/**
 * fileManagerRoutes.js — Cloud File Manager API
 *
 * Provides secure, role-gated access to Cloudflare R2 for:
 *   - Browsing folders and files (list)
 *   - Creating folders (virtual prefix in R2)
 *   - Uploading files (any type) with server-side WebP for images
 *   - Deleting files and folders
 *   - Generating public/presigned URLs
 *
 * All routes require: auth + admin + media_manager permission
 *
 * Upload strategy (crash-safe for Render 512MB RAM):
 *   - Files stream directly to R2 via multerS3 — zero server RAM buffering
 *   - Videos: NO server-side FFmpeg (already compressed in browser via WASM)
 *   - Images: background WebP conversion via sharp (safe, sequential, low memory)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const { publicS3 } = require('../config/s3Client');
const { generateWebAsset } = require('../utils/webAssets');
const {
    ListObjectsV2Command,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    HeadObjectCommand,
    PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

const BUCKET = process.env.R2_PUBLIC_BUCKET || 'adbuth-public';
const PUBLIC_BASE = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

// ─── Middleware ────────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.use(adminMiddleware);

// ─── Multer: stream directly to R2 via multerS3 (ZERO server RAM for file data) ─
// This replaces the old memoryStorage which caused OOM crashes on Render 512MB.
// Files go: Browser → Render (as a stream, not buffered) → R2.
const upload = multer({
    storage: multerS3({
        s3: publicS3,
        bucket: BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: (req, file, cb) => {
            cb(null, {
                'uploaded-by': String(req.user?.admin_id || 'admin'),
                'original-name': file.originalname,
            });
        },
        key: (req, file, cb) => {
            // IMPORTANT: req.body is NOT available here (multer hasn't parsed it yet).
            // Use req.query.prefix instead — it's always available from the URL.
            const rawPrefix = (req.query.prefix || req.body?.prefix || '').trim().replace(/^\/+/, '');
            const prefix = rawPrefix && !rawPrefix.endsWith('/') ? rawPrefix + '/' : rawPrefix;
            const originalName = file.originalname.replace(/[^a-zA-Z0-9\-_. ()]/g, '_');
            const ext = path.extname(originalName);
            const baseName = path.basename(originalName, ext);
            const key = `${prefix}${baseName}_${Date.now()}${ext}`;
            cb(null, key);
        },
    }),
    limits: { fileSize: MAX_FILE_SIZE },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const publicUrl = (key) => `${PUBLIC_BASE}/${key}`;

/** Normalize a folder prefix: always ends with '/', never starts with '/' */
const normalizePrefix = (raw = '') => {
    let p = raw.trim().replace(/^\/+/, '');
    if (p && !p.endsWith('/')) p += '/';
    return p;
};

/** Build R2 key: folder prefix + filename */
const buildKey = (prefix, filename) => `${prefix}${filename}`;

// ─── LIST — browse folder contents ────────────────────────────────────────────
/**
 * GET /api/file-manager/list?prefix=folder/subfolder/
 * Returns:
 *   folders: [{ name, prefix }]
 *   files:   [{ name, key, url, size, lastModified, contentType }]
 */
router.get('/list', checkPermission('media_manager', 'view'), async (req, res) => {
    try {
        const prefix = normalizePrefix(req.query.prefix || '');

        const command = new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: prefix,
            Delimiter: '/',
            MaxKeys: 1000,
        });

        const response = await publicS3.send(command);

        // Folders = CommonPrefixes
        const folders = (response.CommonPrefixes || []).map(cp => {
            const fullPrefix = cp.Prefix;
            const parts = fullPrefix.replace(/\/$/, '').split('/');
            const name = parts[parts.length - 1];
            return { name, prefix: fullPrefix };
        });

        // Files = Contents (exclude the folder placeholder itself)
        const files = (response.Contents || [])
            .filter(obj => obj.Key !== prefix && !obj.Key.endsWith('/'))
            .map(obj => {
                const parts = obj.Key.split('/');
                const name = parts[parts.length - 1];
                return {
                    name,
                    key: obj.Key,
                    url: publicUrl(obj.Key),
                    size: obj.Size,
                    lastModified: obj.LastModified,
                };
            });

        res.json({ prefix, folders, files });
    } catch (err) {
        console.error('[FileManager] List error:', err);
        res.status(500).json({ error: 'Failed to list files', details: err.message });
    }
});

// ─── CREATE FOLDER ────────────────────────────────────────────────────────────
/**
 * POST /api/file-manager/create-folder
 * Body: { prefix: "images/banners/", name: "2025" }
 * Creates a virtual R2 folder by uploading an empty placeholder object.
 */
router.post('/create-folder', checkPermission('media_manager', 'edit'), async (req, res) => {
    try {
        let { prefix = '', name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Folder name is required.' });
        }

        // Sanitize folder name: only allow alphanumeric, dash, underscore
        const safeName = name.trim().replace(/[^a-zA-Z0-9\-_. ]/g, '');
        if (!safeName) {
            return res.status(400).json({ error: 'Invalid folder name. Use letters, numbers, dash, underscore.' });
        }

        const normalizedPrefix = normalizePrefix(prefix);
        const folderKey = `${normalizedPrefix}${safeName}/`;

        // Check if it already exists
        try {
            await publicS3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: folderKey }));
            return res.status(409).json({ error: 'Folder already exists.' });
        } catch (e) {
            if (e.name !== 'NotFound' && e.$metadata?.httpStatusCode !== 404) {
                // Ignore "not found" — means we can create
            }
        }

        // Create placeholder
        await publicS3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: folderKey,
            Body: '',
            ContentType: 'application/x-directory',
            Metadata: { 'created-by': 'adbuth-file-manager' },
        }));

        res.json({ success: true, folderKey, message: `Folder "${safeName}" created successfully.` });
    } catch (err) {
        console.error('[FileManager] Create folder error:', err);
        res.status(500).json({ error: 'Failed to create folder', details: err.message });
    }
});

// ─── UPLOAD FILE ──────────────────────────────────────────────────────────────
/**
 * POST /api/file-manager/upload
 * Form-data: file (file), prefix (string)
 *
 * Streams file directly to R2 via multerS3 (no server RAM buffer).
 * After upload:
 *   - Images → background WebP conversion via sharp (safe, low memory)
 *   - Videos → SKIPPED — already compressed by browser WASM before upload
 *
 * Returns immediately with file info; image WebP conversion runs in background.
 */
router.post('/upload', checkPermission('media_manager', 'edit'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided.' });
        }

        // multerS3 already uploaded the file to R2 — req.file.key is the R2 key
        const uniqueKey = req.file.key;
        const mimeType = req.file.mimetype;
        const fileUrl = publicUrl(uniqueKey);

        res.json({
            success: true,
            file: {
                name: path.basename(uniqueKey),
                key: uniqueKey,
                url: fileUrl,
                size: req.file.size,
                mimeType,
                webAssetUrl: null,
                compressionStatus: 'not_applicable',
            },
            message: 'File uploaded successfully.',
        });
    } catch (err) {
        console.error('[FileManager] Upload error:', err);
        res.status(500).json({ error: 'Upload failed', details: err.message });
    }
});

// ─── DELETE FILE ──────────────────────────────────────────────────────────────
/**
 * DELETE /api/file-manager/delete-file
 * Body: { key: "images/banners/photo_12345.jpg" }
 * Also deletes the web-optimized version if it exists.
 */
router.delete('/delete-file', checkPermission('media_manager', 'delete'), async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: 'File key is required.' });

        const keysToDelete = [{ Key: key }];

        // Also attempt to delete the web-optimized version
        const { webpKey, webVideoKey } = require('../utils/webAssets');
        const ext = path.extname(key).toLowerCase();
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp'];
        const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

        if (imageExts.includes(ext)) {
            keysToDelete.push({ Key: webpKey(key) });
        } else if (videoExts.includes(ext)) {
            const webVideo = webVideoKey(key);
            if (webVideo && webVideo !== key) {
                keysToDelete.push({ Key: webVideo });
            }
        }

        await publicS3.send(new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: keysToDelete, Quiet: true },
        }));

        res.json({ success: true, message: 'File deleted successfully.' });
    } catch (err) {
        console.error('[FileManager] Delete file error:', err);
        res.status(500).json({ error: 'Delete failed', details: err.message });
    }
});

// ─── DELETE FOLDER ────────────────────────────────────────────────────────────
/**
 * DELETE /api/file-manager/delete-folder
 * Body: { prefix: "images/old-banners/" }
 * Deletes ALL objects under the given prefix (recursive).
 */
router.delete('/delete-folder', checkPermission('media_manager', 'delete'), async (req, res) => {
    try {
        const { prefix } = req.body;
        if (!prefix) return res.status(400).json({ error: 'Folder prefix is required.' });

        const normalizedPrefix = normalizePrefix(prefix);
        if (!normalizedPrefix) return res.status(400).json({ error: 'Cannot delete root.' });

        // List all objects under prefix
        let allKeys = [];
        let continuationToken;

        do {
            const listCmd = new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: normalizedPrefix,
                MaxKeys: 1000,
                ContinuationToken: continuationToken,
            });
            const listRes = await publicS3.send(listCmd);
            const keys = (listRes.Contents || []).map(obj => ({ Key: obj.Key }));
            allKeys = allKeys.concat(keys);
            continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
        } while (continuationToken);

        if (allKeys.length === 0) {
            return res.json({ success: true, message: 'Folder was empty or already deleted.' });
        }

        // Delete in batches of 1000
        for (let i = 0; i < allKeys.length; i += 1000) {
            const batch = allKeys.slice(i, i + 1000);
            await publicS3.send(new DeleteObjectsCommand({
                Bucket: BUCKET,
                Delete: { Objects: batch, Quiet: true },
            }));
        }

        res.json({
            success: true,
            message: `Folder deleted. Removed ${allKeys.length} object(s).`,
            deletedCount: allKeys.length,
        });
    } catch (err) {
        console.error('[FileManager] Delete folder error:', err);
        res.status(500).json({ error: 'Folder delete failed', details: err.message });
    }
});

// ─── GET PRESIGNED URL (for private files if needed) ──────────────────────────
/**
 * GET /api/file-manager/presign?key=some/private/file.zip
 * Returns a time-limited presigned URL (1 hour) for the file.
 */
router.get('/presign', checkPermission('media_manager', 'view'), async (req, res) => {
    try {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'File key is required.' });

        const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
        const url = await getSignedUrl(publicS3, command, { expiresIn: 3600 });

        res.json({ url, expiresIn: 3600 });
    } catch (err) {
        console.error('[FileManager] Presign error:', err);
        res.status(500).json({ error: 'Failed to generate presigned URL', details: err.message });
    }
});

module.exports = router;
