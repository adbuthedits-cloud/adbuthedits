/**
 * ================================================================
 *  Adbuth Site — Cloudflare R2 Image Migration (Page-Accurate)
 * ================================================================
 *  R2 FOLDER STRUCTURE (page-by-page):
 *
 *  website-assets/
 *    brand/                      ← logo (global)
 *    shared/                     ← placeholder used across pages
 *    pages/
 *      home/                     ← Hero, WhatWeDo, FAQ bg, blog-1/2/3
 *      about/                    ← about-us
 *      contact/                  ← contact bg, form header
 *      blogs/                    ← blogs header, mobile-blogs, blog-4/5/6
 *      shop/                     ← shop banner
 *      services/
 *        index/                  ← service card images (video, design, commercial, etc.)
 *        videos/
 *          adbuth-edits/         ← blue-robot
 *          adbuth-corporate/     ← curve-arrow, benefit icons
 *          adbuth-ads/           ← AMS-1/2/3 portfolio
 *          adbuth-music/         ← music-banner, sound-to-life, SVG icons
 *        designing/
 *          adbuth-e-invitations/ ← hero banner, feature SVGs
 *        learning/
 *          index/                ← services-dam, services-e-learning, arrow-2
 *          adbuth-dam/           ← feature SVG icons
 * ================================================================
 *
 *  Usage:
 *    node migrate-images-to-r2.js             → dry run (print map only)
 *    node migrate-images-to-r2.js --upload    → upload only
 *    node migrate-images-to-r2.js --replace   → upload + fix all code refs
 */

require('dotenv').config({ path: '../backend/.env' });

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// ── CONFIG ──────────────────────────────────────────────────────
const PUBLIC_URL = process.env.R2_PUBLIC_URL;   // https://pub-xxx.r2.dev
const BUCKET = process.env.R2_PUBLIC_BUCKET; // adbuth-public
const PUBLIC_DIR = path.join(__dirname, 'public');
const FRONTEND_DIR = __dirname;

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// ── COMPLETE FILE MAP ────────────────────────────────────────────
// local   : path relative to /public/ (use forward slashes)
// r2      : new canonical R2 key (page-accurate folder)
// oldR2   : previous wrong R2 key(s) already uploaded — will be replaced in code
const R2B = `${PUBLIC_URL}/`;   // base URL shorthand

const FILE_MAP = [

    // ────────────────────────────────────────────────────────────
    // BRAND — used globally (Navbar, Signup, Login)
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/logo.png',
        r2: 'website-assets/brand/logo.png',
        oldR2: ['website-assets/brand/logo.png'],
    },

    // ────────────────────────────────────────────────────────────
    // SHARED — placeholder used across multiple pages
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/placeholder.jpg',
        r2: 'website-assets/shared/placeholder.jpg',
        oldR2: ['website-assets/shared/placeholder.jpg'],
    },

    // ────────────────────────────────────────────────────────────
    // HOME — Hero, FAQ bg, WhatWeDo cards, blog previews (index.js)
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/hero section.png',
        r2: 'website-assets/pages/home/hero-section.png',
        oldR2: ['website-assets/pages/home/hero-section.png'],
    },
    {
        local: 'images/Frame 11.png',
        r2: 'website-assets/pages/home/faq-bg.png',
        oldR2: ['website-assets/pages/home/frame-11.png'],
    },
    {
        local: 'images/video-editing.png',
        r2: 'website-assets/pages/home/video-editing.png',
        oldR2: ['website-assets/pages/home/video-editing.png'],
    },
    {
        local: 'images/video-editing.svg',
        r2: 'website-assets/pages/home/video-editing-icon.svg',
        oldR2: ['website-assets/pages/home/video-editing.svg'],
    },
    {
        local: 'images/designing.png',
        r2: 'website-assets/pages/home/designing.png',
        oldR2: ['website-assets/pages/home/designing.png'],
    },
    {
        local: 'images/designing.svg',
        r2: 'website-assets/pages/home/designing-icon.svg',
        oldR2: ['website-assets/pages/home/designing-icon.svg'],
    },
    {
        local: 'images/commercial.png',
        r2: 'website-assets/pages/home/commercial.png',
        oldR2: ['website-assets/pages/home/commercial.png'],
    },
    {
        local: 'images/commercial.svg',
        r2: 'website-assets/pages/home/commercial-icon.svg',
        oldR2: ['website-assets/pages/home/commercial-icon.svg'],
    },
    {
        local: 'images/blog-1.png',
        r2: 'website-assets/pages/home/blog-1.png',
        oldR2: ['website-assets/pages/home/blog-1.png'],
    },
    {
        local: 'images/blog-2.png',
        r2: 'website-assets/pages/home/blog-2.png',
        oldR2: ['website-assets/pages/home/blog-2.png'],
    },
    {
        local: 'images/blog-3.png',
        r2: 'website-assets/pages/home/blog-3.png',
        oldR2: ['website-assets/pages/home/blog-3.png'],
    },

    // ────────────────────────────────────────────────────────────
    // ABOUT — pages/about.js
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/about us.png',
        r2: 'website-assets/pages/about/about-us.png',
        oldR2: ['website-assets/pages/about/about-us.png'],
    },

    // ────────────────────────────────────────────────────────────
    // CONTACT — pages/contact-us.js
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/contact-header-bg.png',
        r2: 'website-assets/pages/contact/contact-header-bg.png',
        oldR2: ['website-assets/pages/contact/contact-header-bg.png'],
    },
    {
        local: 'images/contact-form-header.png',
        r2: 'website-assets/pages/contact/contact-form-header.png',
        oldR2: ['website-assets/pages/contact/contact-form-header.png'],
    },

    // ────────────────────────────────────────────────────────────
    // BLOGS — pages/blogs/index.js + FeaturedBlogs component
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/blogs.png',
        r2: 'website-assets/pages/blogs/blogs-header.png',
        oldR2: ['website-assets/pages/blogs/blogs-header.png'],
    },
    {
        local: 'images/mobile-blogs.png',
        r2: 'website-assets/pages/blogs/mobile-blogs.png',
        oldR2: ['website-assets/pages/blogs/mobile-blogs.png'],
    },
    // blog-4/5/6 used in FeaturedBlogs sidebar (shown on home & blogs pages)
    {
        local: 'images/blog-4.png',
        r2: 'website-assets/pages/blogs/blog-4.png',
        oldR2: ['website-assets/pages/blogs/blog-4.png'],
    },
    {
        local: 'images/blog-5.png',
        r2: 'website-assets/pages/blogs/blog-5.png',
        oldR2: ['website-assets/pages/blogs/blog-5.png'],
    },
    {
        local: 'images/blog-6.png',
        r2: 'website-assets/pages/blogs/blog-6.png',
        oldR2: ['website-assets/pages/blogs/blog-6.png'],
    },

    // ────────────────────────────────────────────────────────────
    // SHOP — pages/shop/index.js, ShopGrid.js
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/shop banner.png',
        r2: 'website-assets/pages/shop/shop-banner.png',
        oldR2: [],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES INDEX — pages/services/index.js
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/service-video-editing.png',
        r2: 'website-assets/pages/services/index/service-video-editing.png',
        oldR2: ['website-assets/pages/services/service-video-editing.png'],
    },
    {
        local: 'images/service-design.png',
        r2: 'website-assets/pages/services/index/service-design.png',
        oldR2: ['website-assets/pages/services/service-design.png'],
    },
    {
        local: 'images/service-commercial.png',
        r2: 'website-assets/pages/services/index/service-commercial.png',
        oldR2: ['website-assets/pages/services/service-commercial.png'],
    },
    {
        local: 'images/services-e-invitation.png',
        r2: 'website-assets/pages/services/index/services-e-invitation.png',
        oldR2: ['website-assets/pages/services/designing/services-e-invitation.png'],
    },
    {
        local: 'images/services-graphics.png',
        r2: 'website-assets/pages/services/index/services-graphics.png',
        oldR2: [],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES/VIDEOS/ADBUTH-EDITS
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/Blue-robot.png',
        r2: 'website-assets/pages/services/videos/adbuth-edits/blue-robot.png',
        oldR2: ['website-assets/pages/services/videos/adbuth-edits/blue-robot.png'],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES/VIDEOS/ADBUTH-CORPORATE
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/curve-arrow.png',
        r2: 'website-assets/pages/services/videos/adbuth-corporate/curve-arrow.png',
        oldR2: ['website-assets/pages/services/videos/adbuth-corporate/curve-arrow.png'],
    },
    {
        local: 'images/simplified-communtication.png',
        r2: 'website-assets/pages/services/videos/adbuth-corporate/simplified-communication.png',
        oldR2: ['website-assets/pages/services/videos/adbuth-corporate/simplified-communication.png'],
    },
    {
        local: 'images/employee-engagement.png',
        r2: 'website-assets/pages/services/videos/adbuth-corporate/employee-engagement.png',
        oldR2: ['website-assets/pages/services/videos/adbuth-corporate/employee-engagement.png'],
    },
    {
        local: 'images/strong-brand-identity.png',
        r2: 'website-assets/pages/services/videos/adbuth-corporate/strong-brand-identity.png',
        oldR2: ['website-assets/pages/services/videos/adbuth-corporate/strong-brand-identity.png'],
    },
    {
        local: 'images/enhanced-credibility.png',
        r2: 'website-assets/pages/services/videos/adbuth-corporate/enhanced-credibility.png',
        oldR2: ['website-assets/pages/services/videos/adbuth-corporate/enhanced-credibility.png'],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES/VIDEOS/ADBUTH-ADS — AMS portfolio images
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/AMS-1.png',
        r2: 'website-assets/pages/services/videos/adbuth-ads/ams-1.png',
        oldR2: ['website-assets/pages/about/ams-1.png'],
    },
    {
        local: 'images/AMS-2.png',
        r2: 'website-assets/pages/services/videos/adbuth-ads/ams-2.png',
        oldR2: ['website-assets/pages/about/ams-2.png'],
    },
    {
        local: 'images/AMS-3.png',
        r2: 'website-assets/pages/services/videos/adbuth-ads/ams-3.png',
        oldR2: ['website-assets/pages/about/ams-3.png'],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES/VIDEOS/ADBUTH-MUSIC
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/music-banner.png',
        r2: 'website-assets/pages/services/videos/adbuth-music/music-banner.png',
        oldR2: ['website-assets/pages/services/videos/adbuth-music/music-banner.png'],
    },
    {
        local: 'images/Sound To Life.png',
        r2: 'website-assets/pages/services/videos/adbuth-music/sound-to-life.png',
        // code had typo 'Sound to life.png' — both variants handled in replacements below
        oldR2: ['website-assets/pages/services/videos/adbuth-music/sound-to-life.png'],
    },
    {
        local: 'images/AI-Enhanced Precision.svg',
        r2: 'website-assets/pages/services/videos/adbuth-music/ai-enhanced-precision.svg',
        oldR2: ['website-assets/pages/services/videos/adbuth-music/ai-enhanced-precision.svg'],
    },
    {
        local: 'images/Custom Crafted Sound.svg',
        r2: 'website-assets/pages/services/videos/adbuth-music/custom-crafted-sound.svg',
        oldR2: ['website-assets/pages/services/videos/adbuth-music/custom-crafted-sound.svg'],
    },
    {
        local: 'images/Genre-Versatile Composers.svg',
        r2: 'website-assets/pages/services/videos/adbuth-music/genre-versatile-composers.svg',
        oldR2: ['website-assets/pages/services/videos/adbuth-music/genre-versatile-composers.svg'],
    },
    {
        local: 'images/Industry-Grade Sound Quality.svg',
        r2: 'website-assets/pages/services/videos/adbuth-music/industry-grade-sound-quality.svg',
        oldR2: ['website-assets/pages/services/videos/adbuth-music/industry-grade-sound-quality.svg'],
    },
    {
        local: 'images/One-Stop Audio Production Studio.svg',
        r2: 'website-assets/pages/services/videos/adbuth-music/one-stop-audio-production.svg',
        oldR2: ['website-assets/pages/services/videos/adbuth-music/one-stop-audio-production.svg'],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES/DESIGNING/ADBUTH-E-INVITATIONS
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/every-emotion.svg',
        r2: 'website-assets/pages/services/designing/adbuth-e-invitations/every-emotion.svg',
        oldR2: ['website-assets/pages/services/videos/adbuth-music/every-emotion.svg'],
    },
    {
        local: 'images/instant-customization.svg',
        r2: 'website-assets/pages/services/designing/adbuth-e-invitations/instant-customization.svg',
        oldR2: ['website-assets/shared/icons/instant-customization.svg'],
    },
    {
        local: 'images/seamless-sharing.svg',
        r2: 'website-assets/pages/services/designing/adbuth-e-invitations/seamless-sharing.svg',
        oldR2: ['website-assets/shared/icons/seamless-sharing.svg'],
    },
    {
        local: 'images/storage-and-access.svg',
        r2: 'website-assets/pages/services/designing/adbuth-e-invitations/storage-and-access.svg',
        oldR2: [],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES/LEARNING INDEX — pages/services/learning/index.js
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/services-DAM.png',
        r2: 'website-assets/pages/services/learning/index/services-dam.png',
        oldR2: ['website-assets/pages/services/learning/services-dam.png'],
    },
    {
        local: 'images/services-e-learning.png',
        r2: 'website-assets/pages/services/learning/index/services-e-learning.png',
        oldR2: ['website-assets/pages/services/learning/services-e-learning.png'],
    },
    {
        local: 'images/Arrow 2.svg',
        r2: 'website-assets/pages/services/learning/index/arrow-2.svg',
        oldR2: ['website-assets/shared/icons/arrow-2.svg'],
    },

    // ────────────────────────────────────────────────────────────
    // SERVICES/LEARNING/ADBUTH-DAM — feature icons
    // ────────────────────────────────────────────────────────────
    {
        local: 'images/cloud-storage.svg',
        r2: 'website-assets/pages/services/learning/adbuth-dam/cloud-storage.svg',
        oldR2: ['website-assets/shared/icons/cloud-storage.svg'],
    },
    {
        local: 'images/ai.svg',
        r2: 'website-assets/pages/services/learning/adbuth-dam/ai.svg',
        oldR2: ['website-assets/shared/icons/ai.svg'],
    },
    {
        local: 'images/versions.svg',
        r2: 'website-assets/pages/services/learning/adbuth-dam/versions.svg',
        oldR2: [],
    },
    {
        local: 'images/collaborate.svg',
        r2: 'website-assets/pages/services/learning/adbuth-dam/collaborate.svg',
        oldR2: ['website-assets/shared/icons/collaborate.svg'],
    },
    {
        local: 'images/permissions.svg',
        r2: 'website-assets/pages/services/learning/adbuth-dam/permissions.svg',
        oldR2: ['website-assets/shared/icons/permissions.svg'],
    },
    {
        local: 'images/integration.svg',
        r2: 'website-assets/pages/services/learning/adbuth-dam/integration.svg',
        oldR2: ['website-assets/shared/icons/integration.svg'],
    },
    {
        local: 'assets/features/ai_search_feature_1766423880878.png',
        r2: 'website-assets/pages/services/learning/adbuth-dam/ai-search-feature.png',
        oldR2: ['website-assets/pages/services/learning/ai-search-feature.png'],
    },
    {
        local: 'assets/features/cloud_storage_feature_1766423862520.png',
        r2: 'website-assets/pages/services/learning/adbuth-dam/cloud-storage-feature.png',
        oldR2: ['website-assets/pages/services/learning/cloud-storage-feature.png'],
    },
    {
        local: 'assets/features/version_control_feature_1766423896481.png',
        r2: 'website-assets/pages/services/learning/adbuth-dam/version-control-feature.png',
        oldR2: ['website-assets/pages/services/learning/version-control-feature.png'],
    },
];

// ── HELPERS ─────────────────────────────────────────────────────
const r2Url = (key) => `${PUBLIC_URL}/${key}`;
const local = (rel) => path.join(PUBLIC_DIR, rel.replace(/\//g, path.sep));

async function upload(localPath, r2Key) {
    const body = fs.readFileSync(localPath);
    const contentType = mime.lookup(localPath) || 'application/octet-stream';
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: r2Key, Body: body, ContentType: contentType }));
}

function jsFiles(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.next', '.git'].includes(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) jsFiles(full, out);
        else if (/\.(js|jsx|ts|tsx|css)$/.test(e.name)) out.push(full);
    }
    return out;
}

// ── MAIN ────────────────────────────────────────────────────────
async function main() {
    const doUpload = process.argv.includes('--upload') || process.argv.includes('--replace');
    const doReplace = process.argv.includes('--replace');

    if (!doUpload) console.log('\n🔍  DRY RUN — pass --upload or --replace\n');
    console.log(`📦  Bucket  : ${BUCKET}`);
    console.log(`🌐  Base URL: ${PUBLIC_URL}\n`);
    console.log('─'.repeat(80));

    // ── Build replacement map: every old string → new R2 URL ──
    // Covers: /images/xxx  →  new URL
    //         /assets/xxx  →  new URL
    //         old R2 URL   →  new URL
    // Plus template-literal blog-4/5/6 special handling
    const replaceMap = new Map(); // oldString → newUrl

    let uploaded = 0, skipped = 0, errors = 0;

    for (const entry of FILE_MAP) {
        const localPath = local(entry.local);
        const newUrl = r2Url(entry.r2);
        const localKey = '/' + entry.local; // e.g. https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/brand/logo.png

        // Register local path replacement
        replaceMap.set(localKey, newUrl);

        // Register old R2 key replacements
        for (const oldKey of (entry.oldR2 || [])) {
            if (oldKey !== entry.r2) {
                replaceMap.set(`${PUBLIC_URL}/${oldKey}`, newUrl);
            }
        }

        if (!fs.existsSync(localPath)) {
            console.log(`⚠️   MISSING  ${entry.local}`);
            skipped++;
            continue;
        }

        if (doUpload) {
            try {
                await upload(localPath, entry.r2);
                console.log(`✅  UPLOADED  ${entry.local}`);
                console.log(`             → ${newUrl}`);
                uploaded++;
            } catch (err) {
                console.error(`❌  FAILED    ${entry.local}: ${err.message}`);
                errors++;
            }
        } else {
            console.log(`📄  ${localKey.padEnd(52)} → ${newUrl}`);
        }
    }

    console.log('\n' + '─'.repeat(80));
    if (doUpload) console.log(`\n✅ Uploaded: ${uploaded} | ⚠️ Skipped: ${skipped} | ❌ Errors: ${errors}`);

    // ── REPLACE IN SOURCE FILES ──────────────────────────────────
    if (doReplace) {
        console.log('\n🔄  Replacing paths in source files...\n');

        // Special: template literal blog-4/5/6 in FeaturedBlogs.js
        // `/images/blog-${(i % 3) + 4}.png` → full R2 URL can't be inserted as template
        // We replace it with a lookup object
        const blogSidebarFix = {
            file: path.join(FRONTEND_DIR, 'components', 'FeaturedBlogs.js'),
            old: '`/images/blog-${(i % 3) + 4}.png`',
            newVal: `[
                'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/blogs/blog-4.png',
                'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/blogs/blog-5.png',
                'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/blogs/blog-6.png'
            ][i % 3]`,
        };

        if (fs.existsSync(blogSidebarFix.file)) {
            let c = fs.readFileSync(blogSidebarFix.file, 'utf8');
            if (c.includes(blogSidebarFix.old)) {
                c = c.replace(blogSidebarFix.old, blogSidebarFix.newVal);
                fs.writeFileSync(blogSidebarFix.file, c, 'utf8');
                console.log(`  ✏️  FeaturedBlogs.js — template literal blog-4/5/6 fixed`);
            }
        }

        // Fix adbuth-e-invitations: uses ../..https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/shop/shop-banner.png (relative path)
        const eInvFix = {
            file: path.join(FRONTEND_DIR, 'pages', 'services', 'designing', 'adbuth-e-invitations', 'index.js'),
            old: '../..https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/shop/shop-banner.png',
            newVal: r2Url('website-assets/pages/shop/shop-banner.png'),
        };
        if (fs.existsSync(eInvFix.file)) {
            let c = fs.readFileSync(eInvFix.file, 'utf8');
            if (c.includes(eInvFix.old)) {
                c = c.replace(new RegExp(eInvFix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), eInvFix.newVal);
                fs.writeFileSync(eInvFix.file, c, 'utf8');
                console.log(`  ✏️  adbuth-e-invitations/index.js — relative shop banner path fixed`);
            }
        }

        // Fix adbuth-music: lowercase 'Sound to life.png' (case mismatch)
        replaceMap.set(`https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/sound-to-life.png`, r2Url('website-assets/pages/services/videos/adbuth-music/sound-to-life.png'));

        // Standard find-and-replace for all other paths
        const files = jsFiles(FRONTEND_DIR);
        let totalReplacements = 0;

        for (const file of files) {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;

            for (const [oldStr, newUrl] of replaceMap) {
                const escaped = oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(escaped, 'g');
                if (re.test(content)) {
                    content = content.replace(new RegExp(escaped, 'g'), newUrl);
                    modified = true;
                    totalReplacements++;
                    const rel = path.relative(FRONTEND_DIR, file);
                    console.log(`  ✏️  ${rel}`);
                    console.log(`      ${oldStr.slice(-60)}`);
                    console.log(`      → ${newUrl}`);
                }
            }

            if (modified) fs.writeFileSync(file, content, 'utf8');
        }

        console.log(`\n✅  Total replacements: ${totalReplacements}`);
    }

    // ── URL MAP SUMMARY ──────────────────────────────────────────
    console.log('\n📋  FINAL URL MAP\n' + '─'.repeat(80));
    for (const entry of FILE_MAP) {
        const localKey = '/' + entry.local;
        console.log(`  ${localKey.padEnd(52)} →  ${r2Url(entry.r2)}`);
    }
    console.log('\n🎉  Done!\n');
}

main().catch(err => {
    console.error('\n💥  Fatal:', err.message);
    process.exit(1);
});
