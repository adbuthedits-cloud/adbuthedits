/**
 * webAssets.js — Auto-generate web-optimized versions on every upload
 *
 * Prevents server crashes on memory-constrained hosting (e.g. Render Free Tier 512MB RAM)
 * by queuing conversion tasks and processing them sequentially (single concurrency).
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

// Configure sharp for low-memory environments (disable cache, limit thread concurrency to 1)
sharp.cache(false);
sharp.concurrency(1);

const WEBP_QUALITY = 82;
const VIDEO_HEIGHT = 720;
const VIDEO_BITRATE = '1500k';
const AUDIO_BITRATE = '128k';
const TEMP_DIR = path.join(os.tmpdir(), 'adbuth-web-assets');

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_PUBLIC_BUCKET || 'adbuth-public';

function webpKey(key) { return key.replace(/\.(png|jpg|jpeg|gif|tiff|bmp)$/i, '.webp'); }
function webVideoKey(key) { return key.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '_web.mp4'); }
function isImage(mime) { return mime && mime.startsWith('image/'); }
function isVideo(mime) { return mime && mime.startsWith('video/'); }

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

// ─── Single Concurrency Queue Implementation ──────────────────────────────────
const optimizationQueue = [];
let isProcessingQueue = false;

async function processQueue() {
    if (isProcessingQueue || optimizationQueue.length === 0) return;
    isProcessingQueue = true;

    const task = optimizationQueue.shift();
    console.log(`[WebAssets Queue] 🔄 Processing task for key: ${task.r2Key}. Remaining in queue: ${optimizationQueue.length}`);

    try {
        await executeOptimization(task.r2Key, task.mimeType, task.fileBuffer);
    } catch (err) {
        console.error(`[WebAssets Queue] ❌ Error executing optimization for ${task.r2Key}:`, err.message);
    } finally {
        isProcessingQueue = false;
        // Schedule next queue process tick
        setTimeout(processQueue, 200);
    }
}

/**
 * Performs the actual resource-intensive media processing.
 */
async function executeOptimization(r2Key, mimeType, fileBuffer = null) {
    const inputPath = path.join(TEMP_DIR, `input_${Date.now()}_${path.basename(r2Key)}`);
    let outputPath = '';

    try {
        const outKey = isImage(mimeType) ? webpKey(r2Key) : webVideoKey(r2Key);
        console.log(`[WebAssets] ⚡ Starting processing: ${r2Key} (${mimeType})`);

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
            console.log(`[WebAssets] 🖼  Compressing image to WebP (Quality: ${WEBP_QUALITY})...`);

            await sharp(inputPath)
                .webp({ quality: WEBP_QUALITY })
                .toFile(outputPath);

            // Upload using stream to conserve memory
            const outStream = fs.createReadStream(outputPath);
            await uploadToR2(outKey, outStream, 'image/webp');
            console.log(`[WebAssets] ✅ Created image asset: ${outKey}`);
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
                        `-preset superfast`, // Use superfast for lower CPU load
                        `-crf 28`,
                        `-b:v ${VIDEO_BITRATE}`,
                        `-maxrate ${VIDEO_BITRATE}`,
                        `-bufsize 3000k`,
                        `-c:a aac`,
                        `-b:a ${AUDIO_BITRATE}`,
                        `-movflags +faststart`,
                        `-pix_fmt yuv420p`,
                        `-threads 1` // Limit FFmpeg to 1 thread to avoid CPU throttling crashes
                    ])
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Upload using stream to conserve memory
            const outStream = fs.createReadStream(outputPath);
            await uploadToR2(outKey, outStream, 'video/mp4');
            console.log(`[WebAssets] ✅ Created video asset: ${outKey}`);
            return outKey;
        }
    } finally {
        // Cleanup temp files
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (cleanupErr) {
            console.error('[WebAssets] ⚠️  Cleanup error:', cleanupErr.message);
        }
    }
}

/**
 * Enqueues a file for background web optimization.
 *
 * @param {string} r2Key        - The R2 key of the original uploaded file
 * @param {string} mimeType     - MIME type e.g. 'image/png', 'video/mp4'
 * @param {Buffer} [fileBuffer] - Optional buffer if already available in memory (avoids download)
 * @returns {Promise<string|null>} - The expected R2 key of the web version, or null
 */
async function generateWebAsset(r2Key, mimeType, fileBuffer = null) {
    // ─── PERMANENT GUARD: No server-side video compression ────────────────────
    // Videos are compressed in the browser (WASM ffmpeg) before upload.
    // Running server-side FFmpeg on Render 512MB RAM causes OOM crashes.
    // This guard prevents any code path from triggering server video compression.
    if (isVideo(mimeType)) {
        console.log(`[WebAssets] ⏭️  Skipping video compression (browser-handled): ${r2Key}`);
        return null;
    }
    // ──────────────────────────────────────────────────────────────────────────

    if (!isImage(mimeType)) {
        return null; // Skip unsupported types
    }

    const outKey = webpKey(r2Key);
    if (outKey === r2Key) {
        return null; // Already a WebP
    }

    // Push image task into queue (sharp is safe: sequential, low memory)
    optimizationQueue.push({ r2Key, mimeType, fileBuffer });
    console.log(`[WebAssets] 📥 Enqueued WebP task for: ${r2Key}. Current queue size: ${optimizationQueue.length}`);

    // Trigger processing (runs asynchronously in background)
    processQueue();

    return outKey;
}

module.exports = { generateWebAsset, executeOptimization, webpKey, webVideoKey };
