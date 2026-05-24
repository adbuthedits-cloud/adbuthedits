/**
 * migrate_cdn_urls.js
 * 
 * One-time migration script to replace all R2 origin and old CDN URLs in the database
 * with the new custom assets CDN domain.
 * 
 * USAGE:
 *   node migrate_cdn_urls.js --dry-run     (preview changes, no DB writes)
 *   node migrate_cdn_urls.js               (apply changes to DB)
 */

require('dotenv').config();
const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

const DOMAINS_TO_REPLACE = [
  'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev',
  'https://cdn.adbuthverse.com'
];
const NEW_URL = 'https://assets.adbuthverse.com';
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('\n🔍 DRY RUN MODE — No changes will be written to DB\n');
} else {
  console.log(`\n🚀 LIVE MODE — Replacing domains with: ${NEW_URL}\n`);
}

function replaceInValue(value) {
  if (!value) return { changed: false, value };

  if (typeof value === 'string') {
    let newVal = value;
    let changed = false;
    for (const domain of DOMAINS_TO_REPLACE) {
      if (newVal.includes(domain)) {
        newVal = newVal.replaceAll(domain, NEW_URL);
        changed = true;
      }
    }
    return { changed, value: newVal };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const newArr = value.map(v => {
      if (typeof v === 'string') {
        let newVal = v;
        for (const domain of DOMAINS_TO_REPLACE) {
          if (newVal.includes(domain)) {
            newVal = newVal.replaceAll(domain, NEW_URL);
            changed = true;
          }
        }
        return newVal;
      }
      return v;
    });
    return { changed, value: newArr };
  }

  if (typeof value === 'object') {
    let strVal = JSON.stringify(value);
    let changed = false;
    for (const domain of DOMAINS_TO_REPLACE) {
      if (strVal.includes(domain)) {
        strVal = strVal.replaceAll(domain, NEW_URL);
        changed = true;
      }
    }
    return { changed, value: changed ? JSON.parse(strVal) : value };
  }

  return { changed: false, value };
}

async function migrateTable(tableName, idColumn, urlColumns) {
  console.log(`\n📦 Table: "${tableName}"`);
  // Quote table names in PostgreSQL to preserve capitalization
  const rows = await sequelize.query(`SELECT * FROM "${tableName}"`, { type: QueryTypes.SELECT });
  let updatedCount = 0;

  for (const row of rows) {
    const updates = {};
    let hasChanges = false;

    for (const col of urlColumns) {
      if (row[col] == null) continue;
      const { changed, value } = replaceInValue(row[col]);
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
        // Quote column names in PostgreSQL to preserve casing
        const setClauses = Object.keys(updates)
          .map(col => `"${col}" = :${col}`)
          .join(', ');

        // Serialize object/array updates to JSON strings for raw PostgreSQL query
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

    // Products
    total += await migrateTable('Products', 'products_id', ['thumbnail', 'images', 'video', 'resource_file']);

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

    // SystemSettings
    total += await migrateTable('system_settings', 'setting_key', ['setting_value']);

    console.log(`\n${'─'.repeat(50)}`);
    if (DRY_RUN) {
      console.log(`🔍 DRY RUN complete — ${total} rows would be updated`);
      console.log(`\nRun without --dry-run to apply changes:\n  node migrate_cdn_urls.js`);
    } else {
      console.log(`✅ Migration complete — ${total} rows updated`);
      console.log(`Domains replaced with: ${NEW_URL}`);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
