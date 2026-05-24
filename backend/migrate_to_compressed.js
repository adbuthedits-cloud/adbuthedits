/**
 * migrate_to_compressed.js
 *
 * Migration script to update existing R2/CDN URL fields in the database
 * to point to their web-optimized versions (.webp for images, _web.mp4 for videos).
 *
 * USAGE:
 *   node migrate_to_compressed.js --dry-run     (preview changes, no DB writes)
 *   node migrate_to_compressed.js               (apply changes to DB)
 */

require('dotenv').config();
const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

const DOMAINS = [
  'https://assets.adbuthverse.com',
  'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev',
  'https://cdn.adbuthverse.com'
];

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('\n🔍 DRY RUN MODE — No changes will be written to DB\n');
} else {
  console.log('\n🚀 LIVE MODE — Updating URLs to compressed formats\n');
}

function isCdnUrl(url) {
  if (typeof url !== 'string') return false;
  return DOMAINS.some(domain => url.startsWith(domain));
}

function compressUrl(url) {
  if (!isCdnUrl(url)) return url;
  
  // Image replacement: convert image extensions to .webp
  if (/\.(png|jpg|jpeg|gif|tiff|bmp)(\?.*)?$/i.test(url)) {
    if (!url.toLowerCase().includes('.webp')) {
      return url.replace(/\.(png|jpg|jpeg|gif|tiff|bmp)(\?.*)?$/i, '.webp$2');
    }
  }
  
  // Video replacement: convert video extensions to _web.mp4
  if (/\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i.test(url)) {
    if (!url.toLowerCase().includes('_web.mp4') && !url.toLowerCase().includes('web.mp4')) {
      return url.replace(/\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i, '_web.mp4$2');
    }
  }
  
  return url;
}

function processValue(val) {
  if (!val) return { changed: false, value: val };
  
  if (typeof val === 'string') {
    const newVal = compressUrl(val);
    return { changed: newVal !== val, value: newVal };
  }
  
  if (Array.isArray(val)) {
    let changed = false;
    const newArr = val.map(item => {
      if (typeof item === 'string') {
        const newItem = compressUrl(item);
        if (newItem !== item) changed = true;
        return newItem;
      }
      return item;
    });
    return { changed, value: newArr };
  }
  
  if (typeof val === 'object') {
    const strVal = JSON.stringify(val);
    const cloned = JSON.parse(strVal);
    let changed = false;
    
    const traverseAndReplace = (obj) => {
      let objChanged = false;
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          if (typeof obj[i] === 'string') {
            const newVal = compressUrl(obj[i]);
            if (newVal !== obj[i]) {
              obj[i] = newVal;
              objChanged = true;
            }
          } else if (typeof obj[i] === 'object' && obj[i] !== null) {
            if (traverseAndReplace(obj[i])) objChanged = true;
          }
        }
      } else if (obj !== null && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'string') {
            const newVal = compressUrl(obj[key]);
            if (newVal !== obj[key]) {
              obj[key] = newVal;
              objChanged = true;
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (traverseAndReplace(obj[key])) objChanged = true;
          }
        }
      }
      return objChanged;
    };
    
    changed = traverseAndReplace(cloned);
    return { changed, value: changed ? cloned : val };
  }
  
  return { changed: false, value: val };
}

async function migrateTable(tableName, idColumn, urlColumns) {
  console.log(`\n📦 Table: "${tableName}"`);
  // Quote table names to handle upper-case letters correctly in PostgreSQL
  const rows = await sequelize.query(`SELECT * FROM "${tableName}"`, { type: QueryTypes.SELECT });
  let updatedCount = 0;

  for (const row of rows) {
    const updates = {};
    let hasChanges = false;

    for (const col of urlColumns) {
      if (row[col] == null) continue;
      const { changed, value } = processValue(row[col]);
      if (changed) {
        updates[col] = value;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updatedCount++;
      if (DRY_RUN) {
        console.log(`  [DRY] Would update "${tableName}"."${idColumn}" = ${row[idColumn]}`);
        for (const [col, val] of Object.entries(updates)) {
          console.log(`    ${col}: ${JSON.stringify(val).substring(0, 120)}`);
        }
      } else {
        const setClauses = Object.keys(updates)
          .map(col => `"${col}" = :${col}`)
          .join(', ');

        const serializedUpdates = {};
        for (const [col, val] of Object.entries(updates)) {
          if (typeof val === 'object' && val !== null) {
            serializedUpdates[col] = JSON.stringify(val);
          } else {
            serializedUpdates[col] = val;
          }
        }

        const replacements = { ...serializedUpdates, id: row[idColumn] };
        await sequelize.query(
          `UPDATE "${tableName}" SET ${setClauses} WHERE "${idColumn}" = :id`,
          { replacements, type: QueryTypes.UPDATE }
        );
        console.log(`  ✅ Updated "${idColumn}" = ${row[idColumn]}`);
      }
    }
  }

  console.log(`  → ${updatedCount} rows ${DRY_RUN ? 'would be' : 'were'} updated`);
  return updatedCount;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected\n');

    let total = 0;

    // Products (Do NOT migrate 'resource_file' as it stores the original purchase files)
    total += await migrateTable('Products', 'products_id', ['thumbnail', 'images', 'video']);

    // Blogs
    total += await migrateTable('Blogs', 'blog_id', ['thumbnail']);

    // Coupons
    total += await migrateTable('coupons', 'coupon_id', ['media_url']);

    // Users
    total += await migrateTable('Users', 'user_id', ['profile_picture']);

    // SeoPages
    total += await migrateTable('SeoPages', 'page_id', ['og_image']);

    // Ratings/Reviews
    total += await migrateTable('ratings', 'review_id', ['images', 'videos']);

    console.log(`\n${'─'.repeat(50)}`);
    if (DRY_RUN) {
      console.log(`🔍 DRY RUN complete — ${total} rows would be updated`);
      console.log(`\nRun without --dry-run to apply changes:\n  node migrate_to_compressed.js`);
    } else {
      console.log(`✅ Migration complete — ${total} rows updated`);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
