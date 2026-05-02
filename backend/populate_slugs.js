const sequelize = require('./config/database');
const { AssetCategory, AssetSubCategory, Category } = require('./models');

const slugify = (text) => text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');

async function populate() {
    try {
        console.log('Populating slugs...');
        
        // Parent Categories
        const parents = await Category.findAll();
        for (const p of parents) {
            if (!p.slug) {
                p.slug = slugify(p.category_name);
                await p.save();
                console.log(`Updated Category: ${p.category_name} -> ${p.slug}`);
            }
        }

        // Asset Categories
        const cats = await AssetCategory.findAll();
        for (const c of cats) {
            c.slug = slugify(c.name);
            await c.save();
            console.log(`Updated AssetCategory: ${c.name} -> ${c.slug}`);
        }

        // Asset SubCategories
        const subs = await AssetSubCategory.findAll();
        for (const s of subs) {
            s.slug = slugify(s.name);
            await s.save();
            console.log(`Updated AssetSubCategory: ${s.name} -> ${s.slug}`);
        }

        console.log('Population completed.');
        process.exit(0);
    } catch (err) {
        console.error('Population failed:', err);
        process.exit(1);
    }
}

populate();
