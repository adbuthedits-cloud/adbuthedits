/**
 * webAssets.js — Auto-generate web-optimized versions on every upload
 *
 * When the admin uploads a new image or video to R2,
 * this middleware automatically creates a web-optimized copy:
 *   - Image (PNG/JPG) → WebP (same folder, .webp extension)
 *   - Video (MP4)     → Compressed MP4 (same folder, _web.mp4 suffix)
 *
 * USAGE in upload routes:
 *   const { generateWebAsset } = require('../utils/webAssets');
 *
 *   // Background generation (safe for large files, avoids request timeouts)
 *   generateWebAsset(r2Key, mimeType);
 */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configure ffmpeg path explicitly for the environment
ffmpeg.setFfmpegPath(ffmpegStatic);

const WEBP_QUALITY  = 82;
const VIDEO_HEIGHT  = 720;
const VIDEO_BITRATE = '1500k';
const AUDIO_BITRATE = '128k';
const TEMP_DIR      = path.join(os.tmpdir(), 'adbuth-web-assets');

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_PUBLIC_BUCKET || 'adbuth-public';

function webpKey(key)     { return key.replace(/\.(png|jpg|jpeg|gif|tiff|bmp)$/i, '.webp'); }
function webVideoKey(key) { return key.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '_web.mp4'); }
function isImage(mime)    { return mime && mime.startsWith('image/'); }
function isVideo(mime)    { return mime && mime.startsWith('video/'); }

async function uploadToR2(key, bodyStream, contentType) {
    await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: bodyStream,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { 'web-optimized': 'true' },
    }));
}

async function downloadFromR2(key, localPath) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });
    const response = await r2.send(command);
    const writeStream = fs.createWriteStream(localPath);
    await new Promise((resolve, reject) => {
        response.Body.pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}

/**
 * Generate a web-optimized version of an uploaded file.
 * Downloads original from R2, processes locally, uploads compressed copy, and cleans up.
 *
 * @param {string} r2Key        - The R2 key of the original uploaded file
 * @param {string} mimeType     - MIME type e.g. 'image/png', 'video/mp4'
 * @param {Buffer} [fileBuffer] - Optional buffer if already available in memory (avoids download)
 * @returns {Promise<string|null>} - The R2 key of the web version, or null
 */
async function generateWebAsset(r2Key, mimeType, fileBuffer = null) {
    const inputPath = path.join(TEMP_DIR, `input_${Date.now()}_${path.basename(r2Key)}`);
    let outputPath = '';
    
    try {
        if (!isImage(mimeType) && !isVideo(mimeType)) {
            return null; // Skip unsupported types
        }

        // Determine destination key
        const outKey = isImage(mimeType) ? webpKey(r2Key) : webVideoKey(r2Key);
        if (outKey === r2Key) {
            return null; // Already optimized extension
        }

        console.log(`[WebAssets] ⚡ Starting background optimization for: ${r2Key} (${mimeType})`);

        // Ensure temp directory exists
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        // 1. Get input file on local disk
        if (fileBuffer) {
            fs.writeFileSync(inputPath, fileBuffer);
        } else {
            console.log(`[WebAssets] 📥 Downloading original file from R2...`);
            await downloadFromR2(r2Key, inputPath);
        }

        // 2. Perform compression
        if (isImage(mimeType)) {
            outputPath = path.join(TEMP_DIR, `output_${Date.now()}_${path.basename(outKey)}`);
            console.log(`[WebAssets] 🖼  Compressing image to WebP...`);
            await sharp(inputPath)
                .webp({ quality: WEBP_QUALITY })
                .toFile(outputPath);

            // Upload using stream to conserve memory
            const outStream = fs.createReadStream(outputPath);
            await uploadToR2(outKey, outStream, 'image/webp');
            console.log(`[WebAssets] ✅ Created image: ${outKey}`);
            return outKey;
        }

        if (isVideo(mimeType)) {
            outputPath = path.join(TEMP_DIR, `output_${Date.now()}_web.mp4`);
            console.log(`[WebAssets] 🎬 Compressing video with FFmpeg...`);
            
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        `-vf scale=-2:${VIDEO_HEIGHT}`,
                        `-c:v libx264`,
                        `-preset fast`,
                        `-crf 28`,
                        `-b:v ${VIDEO_BITRATE}`,
                        `-maxrate ${VIDEO_BITRATE}`,
                        `-bufsize 3000k`,
                        `-c:a aac`,
                        `-b:a ${AUDIO_BITRATE}`,
                        `-movflags +faststart`,
                        `-pix_fmt yuv420p`,
                    ])
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Upload using stream to conserve memory
            const outStream = fs.createReadStream(outputPath);
            await uploadToR2(outKey, outStream, 'video/mp4');
            console.log(`[WebAssets] ✅ Created video: ${outKey}`);
            return outKey;
        }
    } catch (err) {
        console.error(`[WebAssets] ⚠️  Failed to generate web asset for ${r2Key}:`, err.message);
    } finally {
        // Cleanup temp files
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (cleanupErr) {
            console.error('[WebAssets] ⚠️  Cleanup error:', cleanupErr.message);
        }
    }
    return null;
}

module.exports = { generateWebAsset, webpKey, webVideoKey };
