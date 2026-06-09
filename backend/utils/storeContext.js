const { Product, Category, Coupon } = require('../models');

// Hardcoded context regarding static site info
const STATIC_CONTEXT = `
**ABOUT ADBUTH VERSE:**
- **Who We Are:** A dynamic post-production studio transforming ideas into stunning visual stories.
- **Founders:** Angilika Jaya Venkat Kiran & Venu Thorani (Managing Directors).
- **Vision:** To be a symbol of limitless creativity and unwavering quality globally.
- **Mission:** Transform creative visions into masterpieces with precision and passion.
- **Team:** Experts in Editing, Sound Design, Motion Graphics, VFX, and Color Grading.

**PLATFORM FAQs (Knowledge Base):**
- *Why choose Adbuth?* We combine expertise in 4K editing, VFX, animation, and sound design to create cinematic experiences.
- *How do I submit footage?* You upload content to our secured cloud storage. We will provide a personal secure drive access.
- *Do you do small projects?* Yes! We serve everyone from personal projects to large-scale productions.
- *What is the turnaround?* We usually work on a first-come-first-serve basis, but ensuring timely professional results.
- *Services:* Video Editing (Wedding, Reels, Highlights, Corporate), Color Grading, Sound Design, Visual Effects (VFX).

**POLICIES & CONTACT:**
- **Email:** contact@adbuthverse.com
- **Policies:** 
    - No refunds on digital products (Templates/Presets) once downloaded. 
    - Revisions are allowed for custom editing services as per agreement.
    - Privacy: We use secure cloud storage for your footage.
`;

const getStoreContext = async () => {
    try {
        // 1. Fetch Products (Use 'title' not 'name')
        const products = await Product.findAll({
            attributes: ['title', 'price'], // Removed 'type' if it doesn't exist, check schema or use 'category_id'
            limit: 20
        });
        const productSummary = products.map(p => `- ${p.title} (₹${p.price})`).join('\n');

        // 2. Fetch Categories (Use 'category_name' not 'name')
        const categories = await Category.findAll({ attributes: ['category_name'] });
        const categoryList = categories.map(c => c.category_name).join(', ');

        // 3. Fetch Active Coupons
        const coupons = await Coupon.findAll({
            where: { is_active: true },
            attributes: ['code', 'value', 'discount_type']
        });
        const couponSummary = coupons.map(c => `- Code: ${c.code} (${c.value}${c.discount_type === 'percentage' ? '%' : ' OFF'})`).join('\n');

        // Combine Everything
        return `
${STATIC_CONTEXT}

**Current Products:**
${productSummary}

**Categories:**
${categoryList}

**Active Offers:**
${couponSummary || "No active coupons right now."}
        `;
    } catch (error) {
        console.error("Error fetching store context:", error);
        return STATIC_CONTEXT; // Fallback
    }
};

module.exports = { getStoreContext };
