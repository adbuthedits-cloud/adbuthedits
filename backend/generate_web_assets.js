/**
 * generate_web_assets.js
 *
 * Batch-processes all media files in Cloudflare R2:
 *   - Images (PNG/JPG): Downloads → Converts to WebP (80% quality) → Uploads as .webp
 *   - Videos (MP4):     Downloads → Compresses to _web.mp4 (720p, low bitrate) → Uploads
 *
 * Original files are NEVER touched or deleted.
 *
 * USAGE:
 *   node generate_web_assets.js --dry-run         (list files, no processing)
 *   node generate_web_assets.js --images          (process images only)
 *   node generate_web_assets.js --videos          (process videos only)
 *   node generate_web_assets.js                   (process everything)
 *
 * PREREQUISITES — install once:
 *   npm install sharp @aws-sdk/client-s3 fluent-ffmpeg dotenv axios
 *   # ffmpeg must be installed: https://ffmpeg.org/download.html
 *
 * OUTPUT CONVENTION:
 *   products/thumb.png        → products/thumb.webp        (web image)
 *   products/preview.mp4      → products/preview_web.mp4   (web video)
 */

require('dotenv').config();
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Readable } = require('stream');

// ─── Config ──────────────────────────────────────────────────────────────────
const DRY_RUN      = process.argv.includes('--dry-run');
const IMAGES_ONLY  = process.argv.includes('--images');
const VIDEOS_ONLY  = process.argv.includes('--videos');
const DO_IMAGES    = !VIDEOS_ONLY;
const DO_VIDEOS    = !IMAGES_ONLY;
const WEBP_QUALITY = 82;         // WebP quality 0-100 (82 = excellent quality, ~70% smaller than PNG)
const VIDEO_HEIGHT = 720;        // Output video height (720p)
const VIDEO_BITRATE = '1500k';   // Video bitrate (1.5 Mbps — good for web previews)
const AUDIO_BITRATE = '128k';    // Audio bitrate
const BUCKET        = process.env.R2_PUBLIC_BUCKET || 'adbuth-public';
const TEMP_DIR      = path.join(os.tmpdir(), 'adbuth-web-assets');

// ─── R2 Client ───────────────────────────────────────────────────────────────
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function webpKey(key) {
    return key.replace(/\.(png|jpg|jpeg|gif|tiff|bmp)$/i, '.webp');
}
function webVideoKey(key) {
    return key.replace(/\.(mp4|mov|avi|mkv)$/i, '_web.mp4');
}
function isImage(key) {
    return /\.(png|jpg|jpeg|gif|tiff|bmp)$/i.test(key);
}
function isVideo(key) {
    return /\.(mp4|mov|avi|mkv)$/i.test(key) && !key.endsWith('_web.mp4');
}

async function fileExistsInR2(key) {
    try {
        await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

async function downloadFromR2(key) {
    const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return streamToBuffer(res.Body);
}

async function uploadToR2(key, buffer, contentType) {
    await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { 'web-optimized': 'true', 'source-format': 'converted' },
    }));
}

// ─── Image Processing ─────────────────────────────────────────────────────────
async function processImage(key) {
    const outKey = webpKey(key);
    if (outKey === key) return; // already .webp

    if (await fileExistsInR2(outKey)) {
        console.log(`  ⏭  Already exists: ${outKey}`);
        return;
    }

    console.log(`  🖼  Converting: ${key} → ${outKey}`);
    const buffer = await downloadFromR2(key);
    const webpBuffer = await sharp(buffer)
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

    const originalKB = Math.round(buffer.length / 1024);
    const webpKB = Math.round(webpBuffer.length / 1024);
    const savings = Math.round((1 - webpBuffer.length / buffer.length) * 100);

    await uploadToR2(outKey, webpBuffer, 'image/webp');
    console.log(`  ✅ ${outKey} — ${originalKB}KB → ${webpKB}KB (${savings}% smaller)`);
}

// ─── Video Processing ─────────────────────────────────────────────────────────
async function processVideo(key) {
    const outKey = webVideoKey(key);
    if (outKey === key) return;

    if (await fileExistsInR2(outKey)) {
        console.log(`  ⏭  Already exists: ${outKey}`);
        return;
    }

    console.log(`  🎬 Converting: ${key} → ${outKey}`);
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Download original
    const buffer = await downloadFromR2(key);
    const inputPath = path.join(TEMP_DIR, `input_${Date.now()}${path.extname(key)}`);
    const outputPath = path.join(TEMP_DIR, `output_${Date.now()}_web.mp4`);
    fs.writeFileSync(inputPath, buffer);

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                `-vf scale=-2:${VIDEO_HEIGHT}`,    // Scale to 720p, keep aspect ratio
                `-c:v libx264`,                     // H.264 codec (best browser support)
                `-preset fast`,                     // Encoding speed vs compression
                `-crf 28`,                          // Quality factor (23=high, 28=good for web)
                `-b:v ${VIDEO_BITRATE}`,            // Max video bitrate
                `-maxrate ${VIDEO_BITRATE}`,
                `-bufsize 3000k`,
                `-c:a aac`,                         // AAC audio
                `-b:a ${AUDIO_BITRATE}`,
                `-movflags +faststart`,             // Enable progressive download (crucial for web!)
                `-pix_fmt yuv420p`,                 // Max browser compatibility
            ])
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject);
    });

    const outBuffer = fs.readFileSync(outputPath);
    const originalMB = (buffer.length / 1024 / 1024).toFixed(1);
    const outMB = (outBuffer.length / 1024 / 1024).toFixed(1);
    const savings = Math.round((1 - outBuffer.length / buffer.length) * 100);

    await uploadToR2(outKey, outBuffer, 'video/mp4');

    // Cleanup temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    console.log(`  ✅ ${outKey} — ${originalMB}MB → ${outMB}MB (${savings}% smaller)`);
}

// ─── List all objects in R2 ───────────────────────────────────────────────────
async function listAllObjects() {
    const keys = [];
    let token;
    do {
        const res = await r2.send(new ListObjectsV2Command({
            Bucket: BUCKET,
            ContinuationToken: token,
        }));
        for (const obj of res.Contents || []) keys.push(obj.Key);
        token = res.NextContinuationToken;
    } while (token);
    return keys;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n🚀 Adbuth Web Asset Generator`);
    console.log(`   Bucket: ${BUCKET}`);
    console.log(`   WebP quality: ${WEBP_QUALITY}%`);
    console.log(`   Video output: ${VIDEO_HEIGHT}p @ ${VIDEO_BITRATE}`);
    if (DRY_RUN) console.log(`   MODE: DRY RUN (no uploads)\n`);
    else console.log(`   MODE: LIVE (will upload to R2)\n`);

    const allKeys = await listAllObjects();
    const images = allKeys.filter(isImage);
    const videos = allKeys.filter(isVideo);

    console.log(`📊 Found in bucket:`);
    console.log(`   ${images.length} images to convert to WebP`);
    console.log(`   ${videos.length} videos to compress to _web.mp4\n`);

    if (DRY_RUN) {
        console.log('─── Images that would be converted ───');
        images.forEach(k => console.log(`  ${k}  →  ${webpKey(k)}`));
        console.log('\n─── Videos that would be compressed ───');
        videos.forEach(k => console.log(`  ${k}  →  ${webVideoKey(k)}`));
        console.log(`\n✅ Dry run complete. Run without --dry-run to apply.`);
        return;
    }

    // Process images
    if (DO_IMAGES && images.length > 0) {
        console.log(`\n─── Converting ${images.length} images to WebP ───`);
        for (const key of images) {
            try { await processImage(key); }
            catch (err) { console.error(`  ❌ Failed: ${key}`, err.message); }
        }
    }

    // Process videos
    if (DO_VIDEOS && videos.length > 0) {
        console.log(`\n─── Compressing ${videos.length} videos ───`);
        console.log(`   ⚠️  This may take a long time depending on video sizes.\n`);
        for (const key of videos) {
            try { await processVideo(key); }
            catch (err) { console.error(`  ❌ Failed: ${key}`, err.message); }
        }
    }

    console.log(`\n✅ Done! All web assets generated in R2.`);
    console.log(`   Originals are UNTOUCHED.`);
    console.log(`   Web versions are stored alongside originals with _web suffix / .webp extension.`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
