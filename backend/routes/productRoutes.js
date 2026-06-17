const express = require('express');
const router = express.Router();
const { Product, Category, AssetType, AssetVariant, AssetCategory, AssetSubCategory, AssetOrientation, ShopSetting } = require('../models');
const cache = require('../middleware/cacheMiddleware');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// GET /api/products/max-price
router.get('/max-price', cache('products-meta', 86400), async (req, res) => {
    try {
        const result = await Product.max('price');
        res.json({ maxPrice: result || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/colors
router.get('/colors', cache('products-meta', 86400), async (req, res) => {
    try {
        const products = await Product.findAll({
            attributes: ['colors']
        });

        const allColors = [];
        const seen = new Set();

        products.forEach(p => {
            let colors = p.colors;
            if (typeof colors === 'string') {
                try { colors = JSON.parse(colors); } catch { colors = []; }
            }
            if (Array.isArray(colors)) {
                colors.forEach(c => {
                    const colorCode = typeof c === 'object' ? c.value : c;
                    const colorName = typeof c === 'object' ? c.name : c;

                    if (colorCode && !seen.has(colorCode)) {
                        seen.add(colorCode);
                        allColors.push({
                            code: colorCode,
                            value: colorName || colorCode,
                            label: colorName || colorCode
                        });
                    }
                });
            }
        });

        res.json(allColors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/to-person
router.get('/to-person', async (req, res) => {
    try {
        const products = await Product.findAll({
            attributes: ['to_person']
        });

        const allToPersons = new Set();

        products.forEach(p => {
            let toPerson = p.to_person;
            if (typeof toPerson === 'string') {
                try { toPerson = JSON.parse(toPerson); } catch { toPerson = []; }
            }
            if (Array.isArray(toPerson)) {
                toPerson.forEach(person => {
                    if (person && typeof person === 'string') {
                        allToPersons.add(person);
                    }
                });
            }
        });

        res.json(Array.from(allToPersons).sort());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products
router.get('/', cache('products', 1800), async (req, res) => {
    try {
        const {
            search, category, style, for: forWho, color, pricing, music, minPrice, maxPrice,
            parentCategory, assetCategory, assetSubCategory, assetType, assetVariant, orientation, language
        } = req.query;

        const where = { 
            [Op.or]: [
                { is_draft: false },
                { is_draft: null }
            ]
        };
        const include = [
            { model: Category, as: 'parentCategory' },
            { model: AssetCategory, as: 'assetCategory' },
            { model: AssetSubCategory, as: 'assetSubCategory' }
        ];

        // 1. Advanced Search (Multi-word Token Search)
        if (search) {
            const tokens = search.split(/\s+/).filter(t => t.length > 0);
            const tokenConditions = tokens.map(token => ({
                [Op.or]: [
                    { title: { [Op.iLike]: `%${token}%` } },
                    { description: { [Op.iLike]: `%${token}%` } },
                    { '$parentCategory.category_name$': { [Op.iLike]: `%${token}%` } },
                    sequelize.where(sequelize.cast(sequelize.col('tags'), 'text'), { [Op.iLike]: `%${token}%` }),
                    sequelize.where(sequelize.cast(sequelize.col('customization'), 'text'), { [Op.iLike]: `%${token}%` }),
                ]
            }));
            where[Op.and] = tokenConditions;
        }

        // 2. Category Filter (by slug)
        if (category) {
            include[0].where = { slug: category };
        }

        // 3. Price Filter
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = minPrice;
            if (maxPrice) where.price[Op.lte] = maxPrice;
        }

        // 4. Database-Level Filtering for JSON fields
        if (style) {
            const styleValues = style.split(',');
            const styleConditions = styleValues.map(val =>
                sequelize.where(sequelize.cast(sequelize.col('tags'), 'text'), { [Op.iLike]: `%${val}%` })
            );
            where[Op.and] = [...(where[Op.and] || []), { [Op.or]: styleConditions }];
        }

        if (forWho) {
            const forValues = forWho.split(',');
            const forConditions = forValues.map(val =>
                sequelize.where(sequelize.cast(sequelize.col('tags'), 'text'), { [Op.iLike]: `%${val}%` })
            );
            where[Op.and] = [...(where[Op.and] || []), { [Op.or]: forConditions }];
        }

        if (color) {
            const colorValues = color.split(',');
            const colorConditions = colorValues.map(val =>
                sequelize.where(sequelize.cast(sequelize.col('tags'), 'text'), { [Op.iLike]: `%${val}%` })
            );
            where[Op.and] = [...(where[Op.and] || []), { [Op.or]: colorConditions }];
        }

        if (music) {
            const musicValues = music.split(',');
            const musicConditions = musicValues.map(val =>
                sequelize.where(sequelize.cast(sequelize.col('tags'), 'text'), { [Op.iLike]: `%${val}%` })
            );
            where[Op.and] = [...(where[Op.and] || []), { [Op.or]: musicConditions }];
        }

        // 5. Master Data Exact Match Filters (Support Multi-Select by ID or Slug)
        const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

        if (parentCategory) {
            const vals = parentCategory.split(',').filter(Boolean);
            if (vals.every(isUuid)) {
                where.parent_category_id = vals.length === 1 ? vals[0] : { [Op.in]: vals };
            } else {
                include.find(i => i.as === 'parentCategory').where = { slug: { [Op.in]: vals } };
            }
        }
        if (assetCategory) {
            const vals = assetCategory.split(',').filter(Boolean);
            if (vals.every(isUuid)) {
                where.asset_category_id = vals.length === 1 ? vals[0] : { [Op.in]: vals };
            } else {
                include.find(i => i.as === 'assetCategory').where = { slug: { [Op.in]: vals } };
            }
        }
        if (assetSubCategory) {
            const vals = assetSubCategory.split(',').filter(Boolean);
            if (vals.every(isUuid)) {
                where.asset_sub_category_id = vals.length === 1 ? vals[0] : { [Op.in]: vals };
            } else {
                include.find(i => i.as === 'assetSubCategory').where = { slug: { [Op.in]: vals } };
            }
        }
        if (assetType) {
            const vals = assetType.split(',').filter(Boolean);
            if (vals.every(isUuid)) {
                where.asset_type_id = vals.length === 1 ? vals[0] : { [Op.in]: vals };
            } else {
                include.push({ model: AssetType, as: 'assetType', where: { slug: { [Op.in]: vals } }, attributes: [] });
            }
        }
        if (assetVariant) {
            const vals = assetVariant.split(',').filter(Boolean);
            if (vals.every(isUuid)) {
                where.asset_variant_id = vals.length === 1 ? vals[0] : { [Op.in]: vals };
            } else {
                include.push({ model: AssetVariant, as: 'assetVariant', where: { slug: { [Op.in]: vals } }, attributes: [] });
            }
        }
        if (orientation) {
            const vals = orientation.split(',').filter(Boolean);
            if (vals.every(isUuid)) {
                where.asset_orientation_id = vals.length === 1 ? vals[0] : { [Op.in]: vals };
            } else {
                include.push({ model: AssetOrientation, as: 'orientation', where: { slug: { [Op.in]: vals } }, attributes: [] });
            }
        }

        // Language filter
        if (language) {
            const langVals = language.split(',').filter(Boolean);
            where.language = langVals.length === 1 ? langVals[0] : { [Op.in]: langVals };
        }

        const products = await Product.findAll({
            where,
            include,
            attributes: [
                'products_id', 'title', 'description', 'price', 'compared_price', 'slug',
                'thumbnail', 'video', 'updatedAt',
                'parent_category_id', 'asset_category_id', 'asset_sub_category_id',
                'asset_type_id', 'asset_variant_id', 'asset_orientation_id',
                // Single pre-aggregated join instead of N correlated subqueries
                [sequelize.literal(`(
                    SELECT ROUND(AVG(r.rating)::numeric, 1)
                    FROM ratings r
                    WHERE r.products_id = "Product"."products_id" AND r.status = 'approved'
                )`), 'averageRating'],
                [sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM ratings r
                    WHERE r.products_id = "Product"."products_id" AND r.status = 'approved'
                )`), 'reviewCount']
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json(products);
    } catch (err) {
        console.error("Backend Error:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Supported languages for template customization
const SUPPORTED_LANGUAGES = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada',
    'Malayalam', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati'
];

// GET /api/products/master-data
router.get('/master-data', cache('master-data', 86400), async (req, res) => {
    try {
        const [categories, parentCategories, types, variants, orientations, subCategories, shopSettings] = await Promise.all([
            AssetCategory.findAll({ order: [['name', 'ASC']] }),
            Category.findAll({ order: [['category_name', 'ASC']] }),
            AssetType.findAll({ order: [['name', 'ASC']] }),
            AssetVariant.findAll({ order: [['name', 'ASC']] }),
            AssetOrientation.findAll({ order: [['name', 'ASC']] }),
            AssetSubCategory.findAll({ order: [['name', 'ASC']] }),
            ShopSetting.findOne()
        ]);
        res.json({ categories, parentCategories, types, variants, orientations, subCategories, shopSettings, languages: SUPPORTED_LANGUAGES });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/next-serial
router.get('/next-serial', async (req, res) => {
    try {
        const {
            parent_category_id,
            asset_type_id,
            asset_variant_id,
            asset_category_id,
            asset_sub_category_id,
            asset_orientation_id
        } = req.query;

        const where = {};
        if (parent_category_id) where.parent_category_id = parent_category_id;
        if (asset_type_id) where.asset_type_id = asset_type_id;
        if (asset_variant_id) where.asset_variant_id = asset_variant_id;
        if (asset_category_id) where.asset_category_id = asset_category_id;
        if (asset_sub_category_id) where.asset_sub_category_id = asset_sub_category_id;
        if (asset_orientation_id) where.asset_orientation_id = asset_orientation_id;

        const maxSerial = await Product.max('serial_number', { where });
        const nextSerial = maxSerial ? maxSerial + 1 : 1001;
        
        res.json({ nextSerial });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/:slug
router.get('/:slug', cache('product', 1800), async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { slug: req.params.slug, is_draft: { [Op.not]: true } },
            include: [
                { model: Category, as: 'parentCategory' },
                { model: AssetCategory, as: 'assetCategory' },
                { model: AssetSubCategory, as: 'assetSubCategory' },
                { model: AssetOrientation, as: 'assetOrientation' }
            ],
            attributes: {
                include: [
                    [sequelize.literal(`(
                        SELECT AVG(rating)
                        FROM ratings
                        WHERE ratings.products_id = "Product"."products_id" AND ratings.status = 'approved'
                    )`), 'averageRating'],
                    [sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM ratings
                        WHERE ratings.products_id = "Product"."products_id" AND ratings.status = 'approved'
                    )`), 'reviewCount']
                ]
            }
        });

        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
