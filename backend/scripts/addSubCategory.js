const { SubCategory, Category } = require('../models');

/**
 * MANUAL SUB-CATEGORY ADDITION SCRIPT
 * 
 * Instructions:
 * 1. Update the 'newSubCategory' object below with your data.
 * 2. Run this script using: node scripts/addSubCategory.js
 */

const addSubCategory = async () => {
    try {
        const newSubCategory = {
            sub_category_name: 'Your Sub Category Name', // Change this
            slug: 'your-sub-category-slug',             // Change this (must be unique)
            category_id: 'PASTE_CATEGORY_ID_HERE'        // Paste the Category UUID here
        };

        // Validate if category exists
        const category = await Category.findByPk(newSubCategory.category_id);
        if (!category) {
            console.error('❌ Error: Category not found! Please check the category_id.');
            process.exit(1);
        }

        const created = await SubCategory.create(newSubCategory);
        console.log(`✅ Success! Sub-category "${created.sub_category_name}" added to "${category.category_name}".`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding sub-category:', error.message);
        process.exit(1);
    }
};

addSubCategory();
