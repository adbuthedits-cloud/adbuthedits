const express = require('express');
const router = express.Router();
const { Category, SubCategory } = require('../models');
const cache = require('../middleware/cacheMiddleware');

// GET /api/categories
router.get('/', cache('categories', 3600), async (req, res) => {
    try {
        const categories = await Category.findAll({
            include: [
                { model: SubCategory, as: 'subcategories' }
            ]
        });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
