const express = require('express');
const router = express.Router();
const { Blog, BlogCategory } = require('../models');
const cache = require('../middleware/cacheMiddleware');

// Get All Blog Categories
router.get('/categories', cache('blog-categories', 86400), async (req, res) => {
    try {
        const categories = await BlogCategory.findAll({ order: [['name', 'ASC']] });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Published Blogs
router.get('/', cache('blogs', 3600), async (req, res) => {
    try {
        const blogs = await Blog.findAll({
            where: { published: true },
            order: [['createdAt', 'DESC']],
            include: [{ model: BlogCategory, as: 'category' }]
        });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Blog by Slug
router.get('/:slug', cache('blog', 3600), async (req, res) => {
    try {
        const blog = await Blog.findOne({ where: { slug: req.params.slug, published: true } });
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
