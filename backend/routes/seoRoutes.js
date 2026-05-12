const express = require('express');
const router = express.Router();
const SeoPage = require('../models/SeoPage');
const cache = require('../middleware/cacheMiddleware');
const redisClient = require('../config/redisClient');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

// Helper to clear cache
const clearCache = async (patterns) => {
    if (!redisClient.isOpen) return;
    try {
        for (const pattern of patterns) {
            const keys = await redisClient.keys(`${pattern}:*`);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }
    } catch (err) {
        console.error('Cache Clear Error:', err);
    }
};


// GET /api/seo/pages - List all pages (public with cache - for frontend SEO)
router.get('/pages', cache('seo', 86400), async (req, res) => {
    try {
        const pages = await SeoPage.findAll();
        res.json(pages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/seo/pages - Create or Update a page SEO (Admin only)
router.post('/pages', authMiddleware, adminMiddleware, checkPermission('seo', 'edit'), async (req, res) => {
    try {
        const { page_identifier, title, description, keywords, meta_title, meta_description, meta_keywords, canonical_url, path } = req.body;

        // Use meta_ fields if provided, else fallback to standard
        const finalTitle = meta_title || title;
        const finalDesc = meta_description || description;
        const finalKeywords = meta_keywords || keywords;

        let page = await SeoPage.findOne({ where: { page_identifier } });

        if (page) {
            await page.update({
                title: finalTitle,
                description: finalDesc,
                keywords: finalKeywords,
                canonical_url,
                path
            });
        } else {
            page = await SeoPage.create({
                page_identifier,
                title: finalTitle,
                description: finalDesc,
                keywords: finalKeywords,
                canonical_url,
                path
            });
        }
        
        await clearCache(['seo']);

        res.json(page);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/seo/pages/:id - Delete a page SEO (Admin only)
router.delete('/pages/:id', authMiddleware, adminMiddleware, checkPermission('seo', 'edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const page = await SeoPage.findByPk(id);
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }
        await page.destroy();
        await clearCache(['seo']);
        res.json({ message: 'SEO Page deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
