/**
 * Migration Script: Template Restructuring
 * 
 * This script:
 * 1. Syncs new tables (AssetTypes, AssetVariants, AssetCategories, AssetSubCategories, AssetOrientations)
 * 2. Removes obsolete columns from Products table
 * 3. Seeds all master data with the naming convention values from the Google Sheet
 * 
 * Run: node scripts/migrateTemplates.js
 */

const sequelize = require('../config/database');
const {
    AssetType,
    AssetVariant,
    AssetCategory,
    AssetSubCategory,
    AssetOrientation,
    Category,
    Product,
} = require('../models');
const { v4: uuidv4 } = require('uuid');

async function run() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();

        console.log('📦 Syncing new tables (ALTER)...');
        await AssetType.sync({ alter: true });
        await AssetVariant.sync({ alter: true });
        // Product sync will add new columns and drop old ones
        await AssetCategory.sync({ alter: true });
        await AssetSubCategory.sync({ alter: true });
        await AssetOrientation.sync({ alter: true });
        await Product.sync({ alter: true });

        console.log('✅ Tables synced. Removing obsolete Product columns...');
        const qi = sequelize.getQueryInterface();
        const productCols = await qi.describeTable('Products');

        const obsolete = ['category_id', 'sub_category', 'to_person', 'colors'];
        for (const col of obsolete) {
            if (productCols[col]) {
                await qi.removeColumn('Products', col);
                console.log(`  🗑️ Dropped column: ${col}`);
            }
        }

        console.log('\n🌱 Seeding master data...');

        // --- 1. Seed Parent Categories ---
        const [diCat] = await Category.findOrCreate({
            where: { slug: 'digital-invitations' },
            defaults: {
                category_id: uuidv4(),
                category_name: 'Digital Invitations',
                slug: 'digital-invitations',
                description: 'Digital invitation templates for all personal and professional events.'
            }
        });
        const [grCat] = await Category.findOrCreate({
            where: { slug: 'greetings' },
            defaults: {
                category_id: uuidv4(),
                category_name: 'Greetings',
                slug: 'greetings',
                description: 'Greeting card templates for all occasions.'
            }
        });
        console.log(`  ✅ Parent categories: ${diCat.category_name}, ${grCat.category_name}`);

        // --- 2. Seed Asset Types ---
        const types = [
            { name: 'Poster', code: 'PO', description: 'Static poster/image template' },
            { name: 'Video', code: 'VI', description: 'Animated video template' },
        ];
        for (const t of types) {
            await AssetType.findOrCreate({ where: { code: t.code }, defaults: { type_id: uuidv4(), ...t } });
        }
        console.log(`  ✅ Asset types seeded.`);

        // --- 3. Seed Asset Variants ---
        const variants = [
            { name: 'With Image', code: 'WI', description: 'Template includes a customizable image slot' },
            { name: 'Without Image', code: 'WO', description: 'Template is text-only, no image slot' },
        ];
        for (const v of variants) {
            await AssetVariant.findOrCreate({ where: { code: v.code }, defaults: { variant_id: uuidv4(), ...v } });
        }
        console.log(`  ✅ Asset variants seeded.`);

        // --- 4. Seed Asset Orientations ---
        const orientations = [
            { name: 'Horizontal', code: 'HOR', description: 'Landscape format' },
            { name: 'Vertical', code: 'VER', description: 'Portrait format' },
            { name: 'Horizontal & Vertical', code: 'H&V', description: 'Available in both formats' },
        ];
        for (const o of orientations) {
            await AssetOrientation.findOrCreate({ where: { code: o.code }, defaults: { orientation_id: uuidv4(), ...o } });
        }
        console.log(`  ✅ Asset orientations seeded.`);

        // --- 5. Seed Asset Categories ---
        // Digital Invitations categories
        const diCategories = [
            { name: 'Personal Events', code: 'PE', parent_category_id: diCat.category_id },
            { name: 'Business Invites', code: 'BI', parent_category_id: diCat.category_id },
            { name: 'Party Events', code: 'PAE', parent_category_id: diCat.category_id },
        ];
        // Greetings categories
        const grCategories = [
            { name: 'Festival Wishes', code: 'FW', parent_category_id: grCat.category_id },
            { name: 'Personal Greetings', code: 'PEG', parent_category_id: grCat.category_id },
            { name: 'Political & Social', code: 'P&S', parent_category_id: grCat.category_id },
            { name: 'Professional Greetings', code: 'PG', parent_category_id: grCat.category_id },
        ];
        const assetCatMap = {};
        for (const cat of [...diCategories, ...grCategories]) {
            const [record] = await AssetCategory.findOrCreate({
                where: { code: cat.code },
                defaults: { asset_category_id: uuidv4(), ...cat }
            });
            assetCatMap[cat.code] = record.asset_category_id;
        }
        console.log(`  ✅ Asset categories seeded.`);

        // --- 6. Seed Asset Sub Categories ---
        const subCategories = [
            // Personal Events (PE)
            { name: 'Anniversaries', code: 'AN', asset_category_id: assetCatMap['PE'] },
            { name: 'Birthdays', code: 'BIR', asset_category_id: assetCatMap['PE'] },
            { name: 'Weddings', code: 'WED', asset_category_id: assetCatMap['PE'] },
            { name: 'Engagement', code: 'EN', asset_category_id: assetCatMap['PE'] },
            { name: 'Baby Shower', code: 'BS', asset_category_id: assetCatMap['PE'] },
            { name: 'House Warming', code: 'HW', asset_category_id: assetCatMap['PE'] },
            { name: 'Birth Announcements', code: 'BA', asset_category_id: assetCatMap['PE'] },
            // Business Invites (BI)
            { name: 'Business Anniversary', code: 'BANN', asset_category_id: assetCatMap['BI'] },
            { name: 'Product Launch', code: 'PL', asset_category_id: assetCatMap['BI'] },
            { name: 'Grand Opening', code: 'GO', asset_category_id: assetCatMap['BI'] },
            // Party Events (PAE)
            { name: 'Pool Party', code: 'PP', asset_category_id: assetCatMap['PAE'] },
            { name: 'Reunion', code: 'RU', asset_category_id: assetCatMap['PAE'] },
            // Festival Wishes (FW)
            { name: 'Diwali', code: 'DIW', asset_category_id: assetCatMap['FW'] },
            { name: 'New Year', code: 'NY', asset_category_id: assetCatMap['FW'] },
            { name: 'Christmas', code: 'CHR', asset_category_id: assetCatMap['FW'] },
            { name: 'EID', code: 'EID', asset_category_id: assetCatMap['FW'] },
            // Personal Greetings (PEG)
            { name: 'Congratulations', code: 'CONG', asset_category_id: assetCatMap['PEG'] },
            { name: 'Thank You', code: 'TY', asset_category_id: assetCatMap['PEG'] },
            { name: 'Get Well Soon', code: 'GWS', asset_category_id: assetCatMap['PEG'] },
            // Professional Greetings (PG)
            { name: 'Work Anniversary', code: 'WA', asset_category_id: assetCatMap['PG'] },
            { name: 'Promotion', code: 'PRO', asset_category_id: assetCatMap['PG'] },
        ];
        for (const sub of subCategories) {
            await AssetSubCategory.findOrCreate({
                where: { code: sub.code, asset_category_id: sub.asset_category_id },
                defaults: { asset_sub_category_id: uuidv4(), ...sub }
            });
        }
        console.log(`  ✅ Asset sub-categories seeded.`);

        console.log('\n🎉 Migration complete! All master data is seeded and ready.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

run();
