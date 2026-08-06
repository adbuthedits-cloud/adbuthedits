const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, Category, Cart, CartItem, Payment, Coupon, CouponUsage, AssetType, AssetVariant, AssetCategory, AssetSubCategory, AssetOrientation, ShopSetting, Review, User, Admin, Role, Blog, BlogCategory, ReviewSetting, AdminSession, Enquiry, OrderTimeline, CustomizationTemplate, sequelize } = require('../models');
const { orderQueue } = require('../config/orderQueue');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const { sendStaffWelcomeEmail } = require('../utils/staffMailer');
const { sendDeliveryEmail } = require('../utils/orderMailer');
const { signCustomizationData, signCustomizationUrl } = require('../utils/s3Utils');
const { generateWebAsset, webpKey, webVideoKey } = require('../utils/webAssets');

// Apply Admin Middleware to all routes — every single route is protected
router.use(authMiddleware);
router.use(adminMiddleware);

// Configure Multer for File Uploads (Cloudflare R2)
const multer = require('multer');
const path = require('path');
const redisClient = require('../config/redisClient');

// Helper to clear cache
// Helper to clear cache
const clearCache = async (patterns) => {
    if (!redisClient.isOpen) {
        console.warn('Redis is not connected. Skipping cache clear.');
        return;
    }
    try {
        for (const pattern of patterns) {
            const keys = await redisClient.keys(`${pattern}:*`);
            if (keys.length > 0) {
                await redisClient.del(keys);
                console.log(`Cleared cache for pattern: ${pattern}`);
            }
        }
    } catch (err) {
        console.error('Cache Clear Error:', err);
    }
};

const { DeleteObjectCommand, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const AdmZip = require('adm-zip');
const { Readable } = require('stream');
const multerS3 = require('multer-s3');
const { publicS3, privateS3 } = require('../config/s3Client');
const XLSX = require('xlsx');
const uploadCouponMedia = multer({
    storage: multerS3({
        s3: publicS3,
        bucket: process.env.R2_PUBLIC_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const ext = path.extname(file.originalname);
            const folder = req.body.code ? req.body.code.toUpperCase() : 'general';
            cb(null, `coupons/${folder}/media-${Date.now()}${ext}`);
        }
    })
});

// Helper: build public file URL from R2 key
const publicFileUrl = (key) => {
    const baseUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    const cleanKey = (key || '').replace(/^\//, '');
    return `${baseUrl}/${cleanKey}`;
};

// Helper: Delete file from Cloud Storage
const deleteCloudFile = async (fileUrl) => {
    if (!fileUrl) return;
    try {
        const urlObj = new URL(fileUrl);
        const fileKey = decodeURIComponent(urlObj.pathname.substring(1));
        if (fileKey) {
            await publicS3.send(new DeleteObjectCommand({
                Bucket: process.env.R2_PUBLIC_BUCKET,
                Key: fileKey
            }));
            console.log(`[Storage Cleanup] Deleted: ${fileKey}`);
        }
    } catch (err) {
        console.error('[Storage Cleanup] Error deleting file:', err);
    }
};

// Helper: check for duplicates in master data (Case-Insensitive)
const checkDuplicate = async (Model, fields, excludeIdField = null, excludeIdValue = null) => {
    const where = { [Op.or]: [] };
    for (const [key, value] of Object.entries(fields)) {
        if (value) {
            where[Op.or].push(
                sequelize.where(
                    sequelize.fn('LOWER', sequelize.col(key)),
                    value.toLowerCase().trim()
                )
            );
        }
    }
    if (where[Op.or].length === 0) return null;

    if (excludeIdField && excludeIdValue) {
        where[excludeIdField] = { [Op.ne]: excludeIdValue };
    }

    return await Model.findOne({ where });
};

const slugify = (text) => text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');

// Helper to ensure slug uniqueness
const ensureUniqueSlug = async (baseSlug, Model, idField, idValue = null) => {
    if (!baseSlug) return null;
    
    const originalSlug = slugify(baseSlug);
    let slug = originalSlug;
    let counter = 1;
    let exists = true;

    while (exists) {
        const where = { slug };
        if (idValue) {
            where[idField] = { [Op.ne]: idValue };
        }
        
        const count = await Model.count({ where });
        if (count === 0) {
            exists = false;
        } else {
            slug = `${originalSlug}-${counter}`;
            counter++;
        }
    }
    return slug;
};

// --- DELIVERY UPLOAD → PRIVATE bucket ---
let upload = multer({
    storage: multerS3({
        s3: privateS3,
        bucket: process.env.R2_PRIVATE_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Organized by order_id/item_id for full traceability
            const itemId = req.params.itemId || 'general';
            const orderId = req.params.orderId || req._parsedOrderId || 'unknown';
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = uniqueSuffix + path.extname(file.originalname);
            cb(null, `deliveries/${orderId}/${itemId}/${filename}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        // Admin deliveries allow standard media + archives for flexible delivery
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'application/zip', 'application/x-zip-compressed'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid delivery format. Use standard media or ZIP files.'), false);
        }
    }
});

// --- BLOG UPLOAD → PUBLIC bucket ---
const blogStorage = multerS3({
    s3: publicS3,
    bucket: process.env.R2_PUBLIC_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: 'public, max-age=31536000, immutable',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blogs/' + uniqueSuffix + path.extname(file.originalname));
    }
});

// --- BANNER UPLOAD → PUBLIC bucket (for Categories/Shop) ---
const bannerStorage = multerS3({
    s3: publicS3,
    bucket: process.env.R2_PUBLIC_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: 'public, max-age=31536000, immutable',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banners/' + uniqueSuffix + path.extname(file.originalname));
    }
});

const blogUpload = multer({ 
    storage: blogStorage,
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid blog media type.'), false);
        }
    }
});

const uploadBanner = multer({ 
    storage: bannerStorage,
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Banners only allow images (JPG, PNG, WEBP).'), false);
        }
    }
});

// Blog Image Upload Route
router.post('/upload-blog-image', checkPermission('blogs', 'edit'), blogUpload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({ url: publicFileUrl(req.file.key) });
    } catch (err) {
        console.error('[Upload] Error processing upload:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCT MEDIA UPLOAD → PUBLIC bucket ---
const productStorage = multerS3({
    s3: publicS3,
    bucket: process.env.R2_PUBLIC_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: 'public, max-age=31536000, immutable',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);

        // Extract hierarchy from request body
        // Ensure these are sent BEFORE the file in the FormData on the frontend
        const { parentCategory, typeCode, variantCode, categoryCode, subCategoryCode, orientationCode, sku, subfolder, explicitKey } = req.body;

        if (explicitKey) {
            cb(null, explicitKey);
        } else if (parentCategory && typeCode && categoryCode && subCategoryCode && sku) {
            // Industrial Hierarchical Path
            let folder = `products/${parentCategory}/${typeCode}/${variantCode || 'Variant'}/${categoryCode}/${subCategoryCode}/${orientationCode || 'Orientation'}/${sku}/`;

            // Handle subfolders within the SKU directory
            if (subfolder === 'image') folder += 'images/';
            else if (subfolder === 'video') folder += 'videos/';
            else if (subfolder === 'file') folder += ''; // Resource files go to the root of SKU folder

            // 'thumbnail' goes to the root of SKU folder (no extra subfolder)

            cb(null, folder + uniqueSuffix + ext);
        } else {
            // Fallback for legacy or incomplete data
            const folder = file.mimetype.startsWith('video/') ? 'products/videos/' : 'products/images/';
            cb(null, folder + uniqueSuffix + ext);
        }
    }
});

const productUpload = multer({
    storage: productStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos
});

// Helper to convert stream to buffer (for unzipping)
const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
};

router.post('/upload-media', checkPermission('products', 'edit'), productUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const fileUrl = publicFileUrl(req.file.key);

        // --- UNZIP & UPLOAD (Optional, for ZIP files in 'file' subfolder) ---
        const { subfolder } = req.body;
        const isZip = req.file.mimetype === 'application/zip' ||
            req.file.mimetype === 'application/x-zip-compressed' ||
            req.file.originalname.toLowerCase().endsWith('.zip');

        if (subfolder === 'file' && isZip) {
            console.log(`[Unzip] Extracting ZIP: ${req.file.key}`);
            try {
                // 1. Get the ZIP buffer from R2
                const getCommand = new GetObjectCommand({
                    Bucket: process.env.R2_PUBLIC_BUCKET,
                    Key: req.file.key
                });
                const { Body } = await publicS3.send(getCommand);
                const buffer = await streamToBuffer(Body);

                // 2. Unzip using adm-zip
                const zip = new AdmZip(buffer);
                const zipEntries = zip.getEntries();

                // 3. Upload each entry
                // Find the SKU folder by removing the filename from req.file.key
                const zipBaseKey = req.file.key.substring(0, req.file.key.lastIndexOf('/'));

                // Concurrently upload files but keep some restraint if many (sequential for safety/simplicity first)
                for (const entry of zipEntries) {
                    if (!entry.isDirectory) {
                        const entryKey = `${zipBaseKey}/${entry.entryName}`;
                        const putCommand = new PutObjectCommand({
                            Bucket: process.env.R2_PUBLIC_BUCKET,
                            Key: entryKey,
                            Body: entry.getData(),
                            // No need to set ContentType manually, R2 handles or uses generic
                        });
                        await publicS3.send(putCommand);
                    }
                }
                console.log(`[Unzip] Successfully extracted ${zipEntries.length} entries to ${zipBaseKey}/`);
            } catch (unzipErr) {
                console.error('[Unzip] Error during extraction:', unzipErr);
                // Non-fatal error for the main upload response
            }
        }

        res.json({ url: publicFileUrl(req.file.key) });
    } catch (err) {
        console.error('[Upload] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Blog Image Delete Route ---
router.delete('/delete-blog-image', checkPermission('blogs', 'edit'), async (req, res) => {
    try {
        const { fileUrl, key } = req.body;
        const fs = require('fs');

        if (!fileUrl && !key) {
            return res.status(400).json({ error: 'No file key or URL provided' });
        }

        // Extract key from R2 public URL or use provided key directly
        let fileKey = key;
        if (!fileKey && fileUrl) {
            try {
                const urlObj = new URL(fileUrl);
                fileKey = decodeURIComponent(urlObj.pathname.substring(1));
            } catch (e) {
                console.error('[Delete] Key extraction failed:', e);
            }
        }

        if (!fileKey) {
            return res.status(400).json({ error: 'Could not extract file key' });
        }

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_PUBLIC_BUCKET,
            Key: fileKey
        });

        await publicS3.send(command);

        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('[Delete] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- DASHBOARD STATS ---
router.get('/dashboard', checkPermission('dashboard', 'view'), async (req, res) => {
    try {
        const { role } = req.user;
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Helper for safe growth calculation
        const calcGrowth = (current, last) => {
            if (last === 0) return current > 0 ? 100 : 0;
            return ((current - last) / last) * 100;
        };

        let responseData = { stats: {}, recentOrders: [] };
        const { role_id, permissions = {} } = req.user;
        const isSuperAdmin = req.user.is_super_admin === true;

        // Check if user has permission on module (ID-based, no role name strings)
        const can = (module, action = 'view') =>
            isSuperAdmin || (Array.isArray(permissions[module]) && permissions[module].includes(action));

        const stats = {};

        // Orders
        if (can('orders')) {
            stats.totalOrders = await Order.count();
            const currentMonthOrders = await Order.count({ where: { createdAt: { [Op.gte]: firstDayCurrentMonth } } });
            const lastMonthOrders = await Order.count({ where: { createdAt: { [Op.gte]: firstDayLastMonth, [Op.lte]: lastDayLastMonth } } });
            stats.orderGrowth = calcGrowth(currentMonthOrders, lastMonthOrders).toFixed(1);
            stats.totalPendingOrders = await Order.count({
                where: { status: 'paid' },
                include: [{ model: OrderItem, as: 'items', where: { delivery_status: { [Op.ne]: 'delivered' } }, required: true }],
                distinct: true
            });
        }

        // Revenue
        if (can('payments')) {
            stats.revenue = await Order.sum('total_amount') || 0;
            const curRevenue = await Order.sum('total_amount', { where: { createdAt: { [Op.gte]: firstDayCurrentMonth } } }) || 0;
            const lastRevenue = await Order.sum('total_amount', { where: { createdAt: { [Op.gte]: firstDayLastMonth, [Op.lte]: lastDayLastMonth } } }) || 0;
            stats.revenueGrowth = calcGrowth(curRevenue, lastRevenue).toFixed(1);
        }

        // Users
        if (can('users')) {
            stats.totalUsers = await User.count();
            const curUsers = await User.count({ where: { createdAt: { [Op.gte]: firstDayCurrentMonth } } });
            const lastUsers = await User.count({ where: { createdAt: { [Op.gte]: firstDayLastMonth, [Op.lte]: lastDayLastMonth } } });
            stats.userGrowth = calcGrowth(curUsers, lastUsers).toFixed(1);
        }

        // Products
        if (can('products')) {
            stats.totalProducts = await Product.count();
            stats.lowStockCount = await Product.count({ where: { resource_file: null } });
        }

        // Marketing / Coupons
        if (can('marketing')) {
            stats.activeCoupons = await Coupon.count({ where: { is_active: true } });
            const mktOrders = stats.totalOrders ?? await Order.count();
            const mktUsers  = stats.totalUsers  ?? await User.count();
            stats.conversionRate = mktUsers > 0 ? ((mktOrders / mktUsers) * 100).toFixed(2) + '%' : '0%';
        }

        // Support / Inquiries
        if (can('reviews')) {
            stats.recentInquiriesCount = await Enquiry.count({ where: { status: { [Op.ne]: 'closed' } } });
        }

        // Employee dashboard statistics
        if (!isSuperAdmin) {
            const adminId = req.user.admin_id || req.user.id;
            
            // Stats counts for the employee
            stats.myTasksCount = await Order.count({
                where: { assigned_to: adminId }
            });
            stats.myPendingTasks = await Order.count({
                where: { assigned_to: adminId, working_status: 'assigned' }
            });
            stats.myActiveTasks = await Order.count({
                where: { assigned_to: adminId, working_status: 'in_progress' }
            });
            stats.myCompletedTasks = await Order.count({
                where: { assigned_to: adminId, working_status: { [Op.in]: ['delivered', 'completed'] } }
            });
            
            // Enquiries check
            if (can('enquiries')) {
                stats.openEnquiries = await Enquiry.count({
                    where: { status: { [Op.in]: ['pending', 'in-review'] } }
                });
            } else {
                stats.openEnquiries = 0;
            }

            // My Tasks list (detailed)
            const myTasksRaw = await Order.findAll({
                where: { assigned_to: adminId },
                limit: 5,
                order: [['createdAt', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['first_name', 'email'] }]
            });
            responseData.myTasks = myTasksRaw;
        }

        responseData.stats = stats;

        // Recent Orders (Recent activity)
        const recentOrdersRaw = await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['first_name', 'email'] }]
        });
        responseData.recentOrders = recentOrdersRaw;

        res.json(responseData);
    } catch (err) {
        console.error('[Dashboard Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// Get New Orders Count (Pending Deliveries)
router.get('/orders/new-count', checkPermission('orders', 'view'), async (req, res) => {
    try {
        const count = await Order.count({
            where: {
                status: 'paid', // Only paid orders matter
                viewed_by_admin: false
            }
        });
        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- BLOG MANAGEMENT ---
router.get('/blogs', checkPermission('blogs', 'view'), async (req, res) => {
    try {
        const blogs = await Blog.findAll({
            order: [['createdAt', 'DESC']],
            include: [{ model: BlogCategory, as: 'category' }]
        });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/blogs/:id', checkPermission('blogs', 'view'), async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id, {
            include: [{ model: BlogCategory, as: 'category' }]
        });
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/blogs', checkPermission('blogs', 'edit'), async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.slug) {
            body.slug = await ensureUniqueSlug(body.slug, Blog, 'blog_id');
        } else if (body.title) {
            body.slug = await ensureUniqueSlug(body.title, Blog, 'blog_id');
        }

        const blog = await Blog.create(body);

        // Invalidate Cache
        await clearCache(['blogs', 'blog']);

        res.status(201).json(blog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/blogs/:id', checkPermission('blogs', 'edit'), async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.slug) {
            body.slug = await ensureUniqueSlug(body.slug, Blog, 'blog_id', req.params.id);
        }

        const [updated] = await Blog.update(body, { where: { blog_id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Blog not found' });

        // Invalidate Cache
        await clearCache(['blogs', 'blog']);

        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/blogs/:id', checkPermission('blogs', 'delete'), async (req, res) => {
    try {
        const deleted = await Blog.destroy({ where: { blog_id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'Blog not found' });

        // Invalidate Cache
        await clearCache(['blogs', 'blog']);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BLOG CATEGORY MANAGEMENT ---
router.get('/blog-categories', checkPermission('blog_categories', 'view'), async (req, res) => {
    try {
        const categories = await BlogCategory.findAll({ order: [['name', 'ASC']] });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/blog-categories', checkPermission('blog_categories', 'edit'), async (req, res) => {
    try {
        const category = await BlogCategory.create(req.body);
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/blog-categories/:id', checkPermission('blog_categories', 'edit'), async (req, res) => {
    try {
        const [updated] = await BlogCategory.update(req.body, { where: { id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Category not found' });
        await clearCache(['products', 'product']);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/blog-categories/:id', checkPermission('blog_categories', 'delete'), async (req, res) => {
    try {
        const deleted = await BlogCategory.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'Category not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- PRODUCT MANAGEMENT (Admin specific Create/Update/Delete) ---
// Note: Admin GET /products list for dashboard use

router.get('/products', checkPermission('products', 'view'), async (req, res) => {
    try {
        const { page = 1, limit = 500, search, category } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (search) where[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { internal_sku: { [Op.like]: `%${search}%` } }
        ];
        if (category) where.parent_category_id = category;

        const { count, rows } = await Product.findAndCountAll({
            where,
            include: [
                { model: Category, as: 'parentCategory', attributes: ['category_name'] },
                { model: AssetType, as: 'assetType', attributes: ['name', 'code'] },
                { model: AssetVariant, as: 'assetVariant', attributes: ['name', 'code'] },
                { model: AssetCategory, as: 'assetCategory', attributes: ['name', 'code'] },
                { model: AssetSubCategory, as: 'assetSubCategory', attributes: ['name', 'code'] },
                { model: AssetOrientation, as: 'assetOrientation', attributes: ['name', 'code'] }
            ],
            attributes: {
                include: [
                    [sequelize.literal(`(
                        SELECT AVG(rating)
                        FROM ratings
                        WHERE ratings.products_id = "Product"."products_id" AND ratings.status = 'approved'
                    )`), 'averageRating'],
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        res.json({ total: count, page: parseInt(page), products: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/products', checkPermission('products', 'edit'), async (req, res) => {
    try {
        const body = { ...req.body };
        if (body.slug) {
            body.slug = await ensureUniqueSlug(body.slug, Product, 'products_id');
        } else if (body.title) {
            body.slug = await ensureUniqueSlug(body.title, Product, 'products_id');
        }

        const product = await Product.create(body);
        await clearCache(['products', 'product', 'products-meta']);
        res.status(201).json(product);
    } catch (err) {
        console.error('[Admin] Product Create Error:', err);
        res.status(400).json({ error: err.message });
    }
});

router.put('/products/:id', checkPermission('products', 'edit'), async (req, res) => {
    try {
        // --- 1. FETCH OLD PRODUCT TO DETECT GENERIC (DRAFT) MEDIA ---
        const existingProduct = await Product.findByPk(req.params.id);
        if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

        const body = { ...req.body };

        // Ensure unique slug if it's being updated
        if (body.slug && body.slug !== existingProduct.slug) {
            body.slug = await ensureUniqueSlug(body.slug, Product, 'products_id', req.params.id);
        }

        // --- 2. MEDIA MIGRATION: Generic → Categorized ---
        // Only migrate if new data has a real SKU (i.e. all categories are now selected)
        const newSku = body.internal_sku;
        const oldSku = existingProduct.internal_sku;
        const isGenericOld = !oldSku || oldSku === 'no-sku';
        const hasRealNewSku = newSku && newSku !== 'no-sku' && !newSku.includes('null');

        if (isGenericOld && hasRealNewSku) {
            console.log(`[Media Migration] Migrating media from generic draft to: ${newSku}`);

            // Helper: extract R2 key from a full URL
            const urlToKey = (url) => {
                if (!url || typeof url !== 'string') return null;
                try {
                    const urlObj = new URL(url);
                    return decodeURIComponent(urlObj.pathname.replace(/^\//, ''));
                } catch { return null; }
            };

            // Helper: check if a key lives in a generic/draft folder
            const isGenericKey = (key) => {
                if (!key) return false;
                return key.includes('/Generic/') || key.includes('/no-sku/') ||
                       key.includes('/Type/') || key.includes('/Category/') || key.includes('/Subcategory/') ||
                       key.includes('/Variant/') || key.includes('/Orientation/');
            };

            // Helper: determine subfolder tag from key
            const getSubfolder = (key) => {
                if (key.includes('/videos/')) return 'videos';
                if (key.includes('/images/')) return 'images';
                return ''; // thumbnail / resource at root
            };

            // Helper: build new key for migrated file
            const buildNewKey = (oldKey, newSkuVal, parentCat, typeCode, variantCode, catCode, subCatCode, orientationCode) => {
                const ext = path.extname(oldKey);
                const filename = path.basename(oldKey);
                const subfolder = getSubfolder(oldKey);
                const base = `products/${parentCat}/${typeCode}/${variantCode}/${catCode}/${subCatCode}/${orientationCode}/${newSkuVal}`;
                return subfolder ? `${base}/${subfolder}/${filename}` : `${base}/${filename}`;
            };

            // Resolve codes from master data for new categorization
            const [pCat, aType, aVar, aCat, aSubCat, aOri] = await Promise.all([
                body.parent_category_id ? require('../models/Category').findByPk(body.parent_category_id, { attributes: ['category_name'] }) : null,
                body.asset_type_id ? require('../models/AssetType').findByPk(body.asset_type_id, { attributes: ['code'] }) : null,
                body.asset_variant_id ? require('../models/AssetVariant').findByPk(body.asset_variant_id, { attributes: ['code'] }) : null,
                body.asset_category_id ? require('../models/AssetCategory').findByPk(body.asset_category_id, { attributes: ['code'] }) : null,
                body.asset_sub_category_id ? require('../models/AssetSubCategory').findByPk(body.asset_sub_category_id, { attributes: ['code'] }) : null,
                body.asset_orientation_id ? require('../models/AssetOrientation').findByPk(body.asset_orientation_id, { attributes: ['code'] }) : null,
            ]);

            const parentCatName = (pCat?.category_name || 'Generic').replace(/\s+/g, '');
            const typeCd = (aType?.code || 'Type').replace(/\s+/g, '');
            const varCd = (aVar?.code || 'Variant').replace(/\s+/g, '');
            const catCd = (aCat?.code || 'Category').replace(/\s+/g, '');
            const subCatCd = (aSubCat?.code || 'Subcategory').replace(/\s+/g, '');
            const oriCd = (aOri?.code || 'Orientation').replace(/\s+/g, '');

            // Copy + delete helper
            const migrateFile = async (oldUrl) => {
                const oldKey = urlToKey(oldUrl);
                if (!oldKey || !isGenericKey(oldKey)) return oldUrl; // not a generic file, skip
                try {
                    const newKey = buildNewKey(oldKey, newSku, parentCatName, typeCd, varCd, catCd, subCatCd, oriCd);
                    // Copy using CopyObjectCommand (correct S3/R2 API)
                    await publicS3.send(new CopyObjectCommand({
                        Bucket: process.env.R2_PUBLIC_BUCKET,
                        CopySource: `${process.env.R2_PUBLIC_BUCKET}/${encodeURIComponent(oldKey)}`,
                        Key: newKey,
                        MetadataDirective: 'COPY',
                    }));
                    // Delete old
                    await publicS3.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_PUBLIC_BUCKET,
                        Key: oldKey,
                    }));
                    console.log(`[Media Migration] Moved: ${oldKey} → ${newKey}`);
                    return publicFileUrl(newKey);
                } catch (err) {
                    console.error(`[Media Migration] Failed for ${oldKey}:`, err.message);
                    return oldUrl; // fallback: keep old URL on error
                }
            };

            // Migrate thumbnail
            if (body.thumbnail && typeof body.thumbnail === 'string') {
                body.thumbnail = await migrateFile(body.thumbnail);
            }

            // Migrate gallery images
            if (Array.isArray(body.images)) {
                body.images = await Promise.all(body.images.map(url => migrateFile(url)));
            }

            // Migrate videos
            if (Array.isArray(body.video)) {
                body.video = await Promise.all(body.video.map(url => migrateFile(url)));
            }

            // Migrate resource file
            if (body.resource_file && typeof body.resource_file === 'string') {
                body.resource_file = await migrateFile(body.resource_file);
            }

            console.log(`[Media Migration] Complete for product: ${req.params.id}`);
        }

        // --- 3. SAVE UPDATED PRODUCT ---
        await Product.update(body, { where: { products_id: req.params.id } });
        await clearCache(['products', 'product', 'products-meta']);
        res.json({ success: true });
    } catch (err) {
        console.error('[Admin] Product Update Error:', err);
        res.status(400).json({ error: err.message });
    }
});
// --- BULK PRODUCT DELETION ---
router.delete('/products/bulk', checkPermission('products', 'delete'), async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No product IDs provided' });
        }

        const products = await Product.findAll({ where: { products_id: ids } });

        for (const product of products) {
            let prefix = null;
            const mediaUrl = product.thumbnail || product.resource_file || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);

            if (mediaUrl && mediaUrl.includes('/products/')) {
                try {
                    const urlObj = new URL(mediaUrl);
                    const pathParts = decodeURIComponent(urlObj.pathname).split('/');
                    const sku = product.internal_sku;

                    if (sku) {
                        const skuIndex = pathParts.indexOf(sku);
                        if (skuIndex !== -1) {
                            prefix = pathParts.slice(1, skuIndex + 1).join('/') + '/';
                        }
                    }
                } catch (e) {
                    console.error('[Bulk Delete Media] Prefix derivation failed:', e);
                }
            }

            if (prefix && prefix.startsWith('products/')) {
                try {
                    const listCommand = new ListObjectsV2Command({ Bucket: process.env.R2_PUBLIC_BUCKET, Prefix: prefix });
                    const listedObjects = await publicS3.send(listCommand);
                    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
                        const deleteParams = {
                            Bucket: process.env.R2_PUBLIC_BUCKET,
                            Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })), Quiet: true }
                        };
                        await publicS3.send(new DeleteObjectsCommand(deleteParams));
                    }
                } catch (cloudErr) {
                    console.error('[Bulk Delete Media] Cloud deletion failed:', cloudErr);
                }
            }
        }

        await Product.destroy({ where: { products_id: ids } });
        await clearCache(['products', 'product', 'products-meta']);

        res.json({ success: true, message: `${products.length} products deleted successfully` });
    } catch (err) {
        require('fs').appendFileSync('debug.log', err.stack + '\n');
        console.error('[Delete Bulk Products Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/products/:id', checkPermission('products', 'delete'), async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // --- 1. CLOUD MEDIA DELETION ---
        // Determine the S3 prefix (SKU folder) to delete everything inside
        let prefix = null;
        const mediaUrl = product.thumbnail || product.resource_file || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);

        if (mediaUrl && mediaUrl.includes('/products/')) {
            console.log(`[Delete Product Media] Derived Media URL: ${mediaUrl}`);
            try {
                const urlObj = new URL(mediaUrl);
                const pathParts = decodeURIComponent(urlObj.pathname).split('/');
                const sku = product.internal_sku;

                if (sku) {
                    const skuIndex = pathParts.indexOf(sku);
                    if (skuIndex !== -1) {
                        prefix = pathParts.slice(1, skuIndex + 1).join('/') + '/';
                    } else {
                        console.warn(`[Delete Product Media] SKU "${sku}" not found in path parts:`, pathParts);
                    }
                } else {
                    console.warn(`[Delete Product Media] Product has no internal_sku`);
                }
            } catch (e) {
                console.error('[Delete Product Media] Prefix derivation failed:', e);
            }
        }

        if (prefix && prefix.startsWith('products/')) {
            console.log(`[Delete Product Media] Deleting all objects with prefix: ${prefix}`);
            try {
                const listCommand = new ListObjectsV2Command({
                    Bucket: process.env.R2_PUBLIC_BUCKET,
                    Prefix: prefix
                });
                const listedObjects = await publicS3.send(listCommand);
                console.log(`[Delete Product Media] Found ${listedObjects.Contents?.length || 0} objects.`);

                if (listedObjects.Contents && listedObjects.Contents.length > 0) {
                    const deleteParams = {
                        Bucket: process.env.R2_PUBLIC_BUCKET,
                        Delete: {
                            Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
                            Quiet: true
                        }
                    };
                    await publicS3.send(new DeleteObjectsCommand(deleteParams));
                    console.log(`[Delete Product Media] Bulk deletion successful.`);
                }
            } catch (cloudErr) {
                console.error('[Delete Product Media] Cloud deletion failed:', cloudErr);
            }
        } else {
            console.warn(`[Delete Product Media] No valid prefix derived for deletion.`);
        }

        // --- 2. DB DELETION ---
        await product.destroy();
        await clearCache(['products', 'product', 'products-meta']);

        res.json({ success: true, message: 'Product and associated media deleted successfully' });
    } catch (err) {
        console.error('[Delete Product Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCT EXPORT ---
router.get('/products/export', checkPermission('products', 'view'), async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{ model: Category, as: 'parentCategory', attributes: ['category_name'] }],
            order: [['createdAt', 'DESC']]
        });

        const exportData = products.map(p => ({
            ID: p.products_id,
            Title: p.title,
            SKU: p.internal_sku,
            Category: p.parentCategory?.category_name || 'Uncategorized',
            Price: p.price,
            Stock: p.stock_count,
            Sales: p.sales_count,
            Rating: p.averageRating,
            Status: p.is_active ? 'Active' : 'Inactive',
            Created: p.createdAt
        }));

        const format = req.query.format || 'json';

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=products.json');
            return res.json(exportData);
        }

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Products');

        if (format === 'xlsx') {
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
            return res.send(buf);
        }

        if (format === 'csv') {
            const csv = XLSX.utils.sheet_to_csv(ws);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
            return res.send(csv);
        }

        res.status(400).json({ error: 'Unsupported format' });
    } catch (err) {
        console.error('[Export Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCT IMPORT TEMPLATE (Download sample .xlsx) ---
router.get('/products/import-template', checkPermission('products', 'edit'), async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();

        // ── Sheet 1: Import Template ──────────────────────────────────────────
        const headers = [
            'Title',
            'Slug',
            'Parent Category',
            'Type',
            'Variant',
            'Category',
            'Sub-Category',
            'Orientation',
            'Serial Number',
            'Price (₹)',
            'Compared Price (₹)',
            'Product Description',
            'Meta Title',
            'Meta Description',
            'Meta Keywords',
            'Canonical URL',
            'Tag Key 1',
            'Tag Value 1',
            'Tag Key 2',
            'Tag Value 2',
            'Target Audience',
            'Thumbnail URL',
            'Images Gallery',
            'Video Showcase',
            'Resource File (ZIP)',
            'Load Template',
            'Custom Group Name',
            'Custom Fields',
        ];

        const sampleRow = {
            'Title': 'Elegant Wedding Invitation - Gold Floral',
            'Slug': '',
            'Parent Category': 'Digital Invitations',
            'Type': 'VI',
            'Variant': 'WI',
            'Category': 'PE',
            'Sub-Category': 'WED',
            'Orientation': 'HOR',
            'Serial Number': '1001',
            'Price (₹)': '999',
            'Compared Price (₹)': '1499',
            'Product Description': 'A beautiful gold floral wedding invitation video with elegant animation. Perfect for sharing digitally with all your loved ones.',
            'Meta Title': 'Wedding Video Invitation - Gold Floral | Adbuth',
            'Meta Description': 'Send beautiful digital wedding invitations with gold floral animation. Instantly shareable, beautifully crafted by Adbuth.',
            'Meta Keywords': 'wedding invitation, digital invite, video card, floral wedding',
            'Canonical URL': '',
            'Tag Key 1': 'Brand',
            'Tag Value 1': 'Adbuth',
            'Tag Key 2': 'Quality',
            'Tag Value 2': 'Premium',
            'Target Audience': 'Bride and Groom, Couples',
            'Thumbnail URL': 'https://assets.adbuthverse.com/sample/thumb.jpg',
            'Images Gallery': 'https://assets.adbuthverse.com/sample/img1.jpg | https://assets.adbuthverse.com/sample/img2.jpg',
            'Video Showcase': 'https://assets.adbuthverse.com/sample/vid.mp4',
            'Resource File (ZIP)': 'https://private.r2.dev/sample/file.zip',
            'Load Template': 'Wedding With Images',
            'Custom Group Name': '',
            'Custom Fields': '',
        };

        const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });

        // Set column widths
        ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 22) }));

        XLSX.utils.book_append_sheet(wb, ws, 'Import Template');

        // ── Sheet 2: Rules & Valid Values ─────────────────────────────────────
        const rulesData = [
            { Field: '--- GENERAL RULES ---', Rule: '' },
            { Field: 'Title', Rule: 'REQUIRED. Plain text. Each word is auto-capitalised.' },
            { Field: 'Slug', Rule: 'OPTIONAL. Leave empty to auto-generate from Title (duplicate-safe). Use lowercase-with-hyphens if you provide one.' },
            { Field: 'Serial Number', Rule: 'OPTIONAL. Integer (e.g. 1001). Leave empty to auto-assign next available serial for the selected category combination.' },
            { Field: 'Price (₹)', Rule: 'REQUIRED. Number only, no ₹ symbol.' },
            { Field: 'Compared Price (₹)', Rule: 'OPTIONAL. Leave empty if no strike-through price is needed.' },
            { Field: 'Compared Price (₹)', Rule: 'Must be higher than Price if provided.' },
            { Field: 'Images Gallery', Rule: 'Separate multiple image URLs with  |  (space-pipe-space). E.g.: https://url1.jpg | https://url2.jpg' },
            { Field: 'Video Showcase', Rule: 'Separate multiple video URLs with  |  (space-pipe-space).' },
            { Field: 'Target Audience', Rule: 'Comma-separated values. E.g.: Bride and Groom, Couples, Parents' },
            { Field: 'Load Template', Rule: 'Exact template name from the system. See Sheet 3 for all available templates.' },
            { Field: 'Custom Group Name', Rule: 'OPTIONAL. Add an extra customization group on top of the loaded template.' },
            { Field: 'Custom Fields', Rule: 'Required only if Custom Group Name is filled. Format: FieldName:type | FieldName:type. Valid types: text, date, time, media' },
            { Field: '--- MEDIA RULES ---', Rule: '' },
            { Field: 'Thumbnail URL', Rule: 'Must be a public HTTPS URL already uploaded to R2/CDN.' },
            { Field: 'Resource File (ZIP)', Rule: 'Must be a private HTTPS URL. This is the downloadable file sent to customers after purchase.' },
            { Field: '--- DUPLICATE HANDLING ---', Rule: '' },
            { Field: 'Slug Duplicates', Rule: 'If a slug already exists in the DB, a suffix (-1, -2 ...) is automatically appended.' },
            { Field: 'SKU Duplicates', Rule: 'If the same Type+Variant+Category+SubCategory+Orientation+Serial already exists, that row is SKIPPED with an error.' },
            { Field: '--- VALID PARENT CATEGORIES ---', Rule: '' },
            { Field: 'Digital Invitations', Rule: 'Use exactly: Digital Invitations' },
            { Field: 'Greetings', Rule: 'Use exactly: Greetings' },
            { Field: '--- VALID TYPE CODES ---', Rule: '' },
            { Field: 'PO', Rule: 'Poster' },
            { Field: 'VI', Rule: 'Video' },
            { Field: '--- VALID VARIANT CODES ---', Rule: '' },
            { Field: 'WI', Rule: 'With Image' },
            { Field: 'WO', Rule: 'Without Image' },
            { Field: '--- VALID CATEGORY CODES ---', Rule: '' },
            { Field: 'PE', Rule: 'Personal Events' },
            { Field: 'BI', Rule: 'Business Invites' },
            { Field: 'PAE', Rule: 'Party Events' },
            { Field: 'FW', Rule: 'Festival Wishes' },
            { Field: 'PEG', Rule: 'Personal Greetings' },
            { Field: 'P&S', Rule: 'Political & Social' },
            { Field: 'PG', Rule: 'Professional Greetings' },
            { Field: '--- VALID SUB-CATEGORY CODES ---', Rule: '' },
            { Field: 'WED', Rule: 'Weddings' },
            { Field: 'EN', Rule: 'Engagement' },
            { Field: 'BIR', Rule: 'Birthdays' },
            { Field: 'AN', Rule: 'Anniversaries' },
            { Field: 'BS', Rule: 'Baby Shower' },
            { Field: 'HA', Rule: 'Haldi' },
            { Field: 'ME', Rule: 'Mehandi' },
            { Field: 'SA', Rule: 'Sangeeth' },
            { Field: 'RE', Rule: 'Reception' },
            { Field: 'DF', Rule: 'Dhoti Function' },
            { Field: 'NY', Rule: 'New Year' },
            { Field: 'DIW', Rule: 'Diwali' },
            { Field: 'CHR', Rule: 'Christmas' },
            { Field: 'EID', Rule: 'EID' },
            { Field: 'GO', Rule: 'Grand Opening' },
            { Field: 'PL', Rule: 'Product Launch' },
            { Field: 'PP', Rule: 'Pool Party' },
            { Field: 'RU', Rule: 'Reunion' },
            { Field: 'PRO', Rule: 'Promotion' },
            { Field: 'WA', Rule: 'Work Anniversary' },
            { Field: '--- VALID ORIENTATION CODES ---', Rule: '' },
            { Field: 'HOR', Rule: 'Horizontal' },
            { Field: 'VER', Rule: 'Vertical' },
            { Field: 'H&V', Rule: 'Horizontal & Vertical' },
        ];

        const wsRules = XLSX.utils.json_to_sheet(rulesData, { header: ['Field', 'Rule'] });
        wsRules['!cols'] = [{ wch: 30 }, { wch: 80 }];
        XLSX.utils.book_append_sheet(wb, wsRules, 'Rules & Valid Values');

        // ── Sheet 3: Available Templates ──────────────────────────────────────
        const { CustomizationTemplate: CT } = require('../models');
        const templates = await CT.findAll({ attributes: ['name', 'description', 'fields'], order: [['name', 'ASC']] });
        const templatesData = templates.map(t => ({
            'Template Name (use exactly)': t.name,
            'Description': t.description || '',
            'Fields Preview': JSON.stringify(t.fields || []),
        }));
        const wsTemplates = XLSX.utils.json_to_sheet(templatesData);
        wsTemplates['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 100 }];
        XLSX.utils.book_append_sheet(wb, wsTemplates, 'Available Templates');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=adbuth-product-import-template.xlsx');
        return res.send(buf);
    } catch (err) {
        console.error('[Import Template Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCT BULK IMPORT (Process rows sequentially) ---
const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

router.post('/products/import', checkPermission('products', 'edit'), importUpload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const previewOnly = req.body.previewOnly === 'true';

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
        return res.status(400).json({ error: 'Only .xlsx or .xls files are supported.' });
    }

    try {
        // ── 1. Parse spreadsheet ──────────────────────────────────────────────
        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rows.length) return res.status(400).json({ error: 'The spreadsheet is empty.' });

        // ── 2. Pre-load all master data (one DB round trip) ───────────────────
        const [parentCategories, assetTypes, assetVariants, assetCategories, assetSubCategories, assetOrientations, custTemplates] = await Promise.all([
            Category.findAll({ attributes: ['category_id', 'category_name'] }),
            require('../models/AssetType').findAll({ attributes: ['type_id', 'name', 'code'] }),
            require('../models/AssetVariant').findAll({ attributes: ['variant_id', 'name', 'code'] }),
            AssetCategory.findAll({ attributes: ['asset_category_id', 'name', 'code'] }),
            AssetSubCategory.findAll({ attributes: ['asset_sub_category_id', 'name', 'code'] }),
            AssetOrientation.findAll({ attributes: ['orientation_id', 'name', 'code'] }),
            require('../models').CustomizationTemplate.findAll({ attributes: ['template_id', 'name', 'fields'] }),
        ]);

        // Build lookup maps
        const parentCatMap = Object.fromEntries(parentCategories.map(c => [c.category_name.toLowerCase(), c.category_id]));
        const typeMap = Object.fromEntries(assetTypes.map(t => [t.code.toLowerCase(), t.type_id]));
        const variantMap = Object.fromEntries(assetVariants.map(v => [v.code.toLowerCase(), v.variant_id]));
        const categoryMap = Object.fromEntries(assetCategories.map(c => [c.code.toLowerCase(), c.asset_category_id]));
        const subCategoryMap = Object.fromEntries(assetSubCategories.map(s => [s.code.toLowerCase(), s.asset_sub_category_id]));
        const orientationMap = Object.fromEntries(assetOrientations.map(o => [o.code.toLowerCase(), o.orientation_id]));
        const templateMap = Object.fromEntries(custTemplates.map(t => [t.name.toLowerCase(), t.fields]));

        const results = [];
        let successCount = 0;
        let failCount = 0;

        // ── 3. Process rows one-by-one (sequential, no race conditions) ───────
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Excel row number (header is row 1)
            const rowTitle = String(row['Title'] || '').trim();

            try {
                // Validate required fields
                if (!rowTitle) throw new Error('Title is required.');
                if (!row['Parent Category']) throw new Error('Parent Category is required.');
                if (!row['Type']) throw new Error('Type code is required.');
                if (!row['Variant']) throw new Error('Variant code is required.');
                if (!row['Category']) throw new Error('Category code is required.');
                if (!row['Sub-Category']) throw new Error('Sub-Category code is required.');
                if (!row['Orientation']) throw new Error('Orientation code is required.');
                if (!row['Price (₹)'] && row['Price (₹)'] !== 0) throw new Error('Price is required.');

                // Resolve IDs from codes
                const parentCatId = parentCatMap[String(row['Parent Category']).toLowerCase().trim()];
                if (!parentCatId) throw new Error(`Unknown Parent Category: "${row['Parent Category']}". Valid: Digital Invitations, Greetings`);

                const typeId = typeMap[String(row['Type']).toLowerCase().trim()];
                if (!typeId) throw new Error(`Unknown Type code: "${row['Type']}". Valid: PO, VI`);

                const variantId = variantMap[String(row['Variant']).toLowerCase().trim()];
                if (!variantId) throw new Error(`Unknown Variant code: "${row['Variant']}". Valid: WI, WO`);

                const categoryId = categoryMap[String(row['Category']).toLowerCase().trim()];
                if (!categoryId) throw new Error(`Unknown Category code: "${row['Category']}". Valid: PE, BI, PAE, FW, PEG, P&S, PG`);

                const subCategoryId = subCategoryMap[String(row['Sub-Category']).toLowerCase().trim()];
                if (!subCategoryId) throw new Error(`Unknown Sub-Category code: "${row['Sub-Category']}". See Rules sheet for valid codes.`);

                const orientationId = orientationMap[String(row['Orientation']).toLowerCase().trim()];
                if (!orientationId) throw new Error(`Unknown Orientation code: "${row['Orientation']}". Valid: HOR, VER, H&V`);

                // ── Slug generation (unique) ──────────────────────────────────
                const rawSlug = String(row['Slug'] || '').trim() || rowTitle;
                const slug = await ensureUniqueSlug(rawSlug, Product, 'products_id');

                // ── Serial Number (auto-assign if empty) ─────────────────────
                let serialNumber = String(row['Serial Number'] || '').trim();
                if (!serialNumber) {
                    // Find max serial for this combination and increment
                    const maxSerial = await Product.max('serial_number', {
                        where: {
                            parent_category_id: parentCatId,
                            asset_type_id: typeId,
                            asset_variant_id: variantId,
                            asset_category_id: categoryId,
                            asset_sub_category_id: subCategoryId,
                            asset_orientation_id: orientationId,
                        }
                    });
                    serialNumber = ((parseInt(maxSerial) || 1000) + 1).toString();
                }

                // Build SKU
                const typeCode = assetTypes.find(t => t.type_id === typeId)?.code || '';
                const variantCode = assetVariants.find(v => v.variant_id === variantId)?.code || '';
                const categoryCode = assetCategories.find(c => c.asset_category_id === categoryId)?.code || '';
                const subCategoryCode = assetSubCategories.find(s => s.asset_sub_category_id === subCategoryId)?.code || '';
                const orientationCode = assetOrientations.find(o => o.orientation_id === orientationId)?.code || '';
                const parentCatName = parentCategories.find(c => c.category_id === parentCatId)?.category_name?.replace(/\s+/g, '') || '';
                const internalSku = `JAP-${typeCode}-${variantCode}-${categoryCode}-${subCategoryCode}-${orientationCode}-${serialNumber}`;

                // Check for SKU duplicate
                const existingSku = await Product.findOne({ where: { internal_sku: internalSku } });
                if (existingSku) throw new Error(`SKU "${internalSku}" already exists. Change the Serial Number.`);

                // ── Tags ──────────────────────────────────────────────────────
                const tags = {};
                if (row['Tag Key 1'] && row['Tag Value 1']) tags[String(row['Tag Key 1']).trim()] = String(row['Tag Value 1']).trim();
                if (row['Tag Key 2'] && row['Tag Value 2']) tags[String(row['Tag Key 2']).trim()] = String(row['Tag Value 2']).trim();

                // ── Target Audience ───────────────────────────────────────────
                const to_person = row['Target Audience']
                    ? String(row['Target Audience']).split(',').map(s => s.trim()).filter(Boolean)
                    : [];

                // ── Media arrays (pipe-separated) ─────────────────────────────
                const parseUrlList = (val) => val
                    ? String(val).split('|').map(s => s.trim()).filter(s => s.startsWith('http'))
                    : [];

                const images = parseUrlList(row['Images Gallery']);
                const video = parseUrlList(row['Video Showcase']);

                // ── Customization JSON ────────────────────────────────────────
                let customization = [];
                const templateName = String(row['Load Template'] || '').trim().toLowerCase();
                if (templateName) {
                    const templateFields = templateMap[templateName];
                    if (!templateFields) throw new Error(`Template not found: "${row['Load Template']}". Check Sheet 3 for valid template names.`);
                    customization = JSON.parse(JSON.stringify(templateFields)); // deep clone
                }

                // Append custom group if provided
                const customGroupName = String(row['Custom Group Name'] || '').trim();
                const customFieldsRaw = String(row['Custom Fields'] || '').trim();
                if (customGroupName && customFieldsRaw) {
                    const customFields = customFieldsRaw.split('|').map(f => {
                        const parts = f.trim().split(':');
                        const fieldName = parts[0]?.trim() || '';
                        const fieldType = (['text', 'date', 'time', 'media'].includes(parts[1]?.trim())) ? parts[1].trim() : 'text';
                        return [fieldName, fieldType];
                    }).filter(f => f[0]);
                    if (customFields.length > 0) {
                        customization.push({ [customGroupName]: customFields });
                    }
                }

                // Price validation
                const price = parseFloat(row['Price (₹)']);
                if (isNaN(price) || price < 0) throw new Error('Price must be a valid positive number.');
                const compared_price = row['Compared Price (₹)'] ? parseFloat(row['Compared Price (₹)']) : null;
                if (compared_price !== null && compared_price <= price) throw new Error('Compared Price must be higher than Price.');

                // ── Create the product ────────────────────────────────────────
                if (!previewOnly) {
                    await Product.create({
                        title: rowTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        slug,
                        description: String(row['Product Description'] || '').trim() || null,
                        price,
                        compared_price,
                        parent_category_id: parentCatId,
                        asset_type_id: typeId,
                        asset_variant_id: variantId,
                        asset_category_id: categoryId,
                        asset_sub_category_id: subCategoryId,
                        asset_orientation_id: orientationId,
                        serial_number: parseInt(serialNumber),
                        internal_sku: internalSku,
                        thumbnail: String(row['Thumbnail URL'] || '').trim() || null,
                        images,
                        video,
                        resource_file: String(row['Resource File (ZIP)'] || '').trim() || null,
                        tags,
                        to_person,
                        customization,
                        meta_title: String(row['Meta Title'] || '').trim() || rowTitle,
                        meta_description: String(row['Meta Description'] || '').trim() || null,
                        meta_keywords: String(row['Meta Keywords'] || '').trim() || null,
                        canonical_url: String(row['Canonical URL'] || '').trim() || null,
                        is_draft: false,
                        is_active: true,
                    });
                }

                successCount++;
                results.push({ row: rowNum, title: rowTitle, status: 'success', sku: internalSku, slug });

            } catch (rowErr) {
                failCount++;
                results.push({ row: rowNum, title: rowTitle || `Row ${rowNum}`, status: 'error', reason: rowErr.message });
            }
        }

        // Invalidate cache after all rows are processed
        if (successCount > 0) {
            await clearCache(['products', 'product', 'products-meta']);
        }

        res.json({
            total: rows.length,
            success: successCount,
            failed: failCount,
            results,
        });

    } catch (err) {
        console.error('[Bulk Import Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/products/:id', checkPermission('products', 'view'), async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Category, as: 'parentCategory' },
                { model: AssetType, as: 'assetType' },
                { model: AssetVariant, as: 'assetVariant' },
                { model: AssetCategory, as: 'assetCategory' },
                { model: AssetSubCategory, as: 'assetSubCategory' },
                { model: AssetOrientation, as: 'assetOrientation' }
            ]
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ORDER MANAGEMENT ---
router.get('/orders', checkPermission('orders', 'view'), async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email', 'phone_number'] },
                { model: OrderItem, as: 'items', attributes: ['order_item_id', 'delivery_status', 'customization', 'delivery_link', 'price_at_purchase', 'quantity'] },
                { model: Admin, as: 'assignedEmployee', attributes: ['admin_id', 'first_name', 'last_name', 'role'], required: false },
            ],
            order: [['createdAt', 'DESC']]
        });

        // Sign customization URLs for each item in each order
        const signedOrders = await Promise.all(orders.map(async (order) => {
            const plainOrder = order.get({ plain: true });
            if (plainOrder.items) {
                plainOrder.items = await Promise.all(plainOrder.items.map(async (item) => {
                    if (item.customization) {
                        item.customization = await signCustomizationData(item.customization);
                    }
                    if (item.delivery_link) {
                        item.delivery_link = await signCustomizationUrl(item.delivery_link);
                    }
                    return item;
                }));
            }
            return plainOrder;
        }));

        res.json(signedOrders);
    } catch (err) {
        console.error('[GET /orders Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// ===== ORDER WORKFLOW: ASSIGN / PICKUP / PROGRESS ========
// =========================================================

// GET /orders/my-tasks — Employee's assigned orders (richer data for task list)
router.get('/orders/my-tasks', async (req, res) => {
    try {
        const adminId = req.user.admin_id || req.user.id;
        if (!adminId) return res.status(401).json({ error: 'No admin session found.' });

        const orders = await Order.findAll({
            where: { assigned_to: adminId },
            include: [
                { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email', 'phone_number'] },
                {
                    model: OrderItem, as: 'items',
                    attributes: ['order_item_id', 'delivery_status', 'price_at_purchase', 'quantity'],
                    include: [{ model: Product, as: 'product', attributes: ['products_id', 'title', 'thumbnail', 'slug'] }]
                },
                { model: Admin, as: 'assignedEmployee', attributes: ['first_name', 'last_name', 'role'] },
            ],
            order: [['assigned_at', 'DESC']]
        });
        res.json(orders);
    } catch (err) {
        console.error('[MyTasks Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /orders/:id/timeline — Full timeline for an order
router.get('/orders/:id/timeline', checkPermission('orders', 'view'), async (req, res) => {
    try {
        const timeline = await OrderTimeline.findAll({
            where: { order_id: req.params.id },
            include: [{ model: Admin, as: 'actor', attributes: ['first_name', 'last_name', 'role', 'staff_id'] }],
            order: [['event_at', 'ASC']]
        });
        res.json(timeline);
    } catch (err) {
        console.error('[Timeline Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /orders/:id/assign — Assign/re-assign order to a staff member
router.post('/orders/:id/assign', checkPermission('orders', 'assign'), async (req, res) => {
    try {
        const { assignedTo } = req.body;
        if (!assignedTo) return res.status(400).json({ error: 'assignedTo is required.' });

        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const assignee = await Admin.findByPk(assignedTo, { attributes: ['first_name', 'last_name', 'role'] });
        if (!assignee) return res.status(404).json({ error: 'Staff member not found.' });

        const actorId = req.user.admin_id || req.user.id;
        const actorName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Admin';

        await orderQueue.add('assign-order', {
            type: 'ASSIGN',
            orderId: req.params.id,
            adminId: actorId,
            actorName,
            actorRole: req.user.role || 'admin',
            metadata: {
                assignedTo,
                assigneeName: `${assignee.first_name} ${assignee.last_name || ''}`.trim(),
            }
        });

        res.json({ success: true, message: 'Order assignment queued successfully.' });
    } catch (err) {
        console.error('[Assign Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /orders/:id/pickup — Employee claims an assigned order (exclusive)
router.post('/orders/:id/pickup', checkPermission('orders', 'pickup'), async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const adminId = req.user.admin_id || req.user.id;

        // Pre-check: is it assigned to the requesting employee?
        if (String(order.assigned_to) !== String(adminId)) {
            return res.status(403).json({ error: 'This order is not assigned to you.' });
        }

        // Pre-check: already claimed?
        if (order.working_status === 'in_progress' || order.picked_up_at) {
            return res.status(409).json({ error: 'Order already picked up and in progress.' });
        }

        const actorName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Employee';

        await orderQueue.add('pickup-order', {
            type: 'PICKUP',
            orderId: req.params.id,
            adminId,
            actorName,
            actorRole: req.user.role || 'editor',
        });

        res.json({ success: true, message: 'Order picked up. Status updated to In Progress.' });
    } catch (err) {
        console.error('[Pickup Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /orders/:id/update-progress — Stage dropdown update, direct DB insert, NO customer email
router.post('/orders/:id/update-progress', checkPermission('orders', 'edit'), async (req, res) => {
    try {
        const { stage, notes } = req.body;
        if (!stage) return res.status(400).json({ error: 'Stage is required.' });

        const adminId = req.user.admin_id || req.user.id;
        const actorName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Employee';

        await OrderTimeline.create({
            order_id: req.params.id,
            admin_id: adminId,
            actor_name: actorName,
            actor_role: req.user.role || 'editor',
            action: 'PROGRESS_UPDATE',
            status_label: stage,
            notes: notes || null,
            event_at: new Date(),
        });

        res.json({ success: true, message: 'Progress stage updated.' });
    } catch (err) {
        console.error('[Progress Update Error]', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/orders/:id', checkPermission('orders', 'view'), async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name', 'email', 'phone_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product'
                    }]
                },
                {
                    model: Payment,
                    as: 'payment'
                },
                {
                    model: Admin,
                    as: 'assignedEmployee',
                    attributes: ['admin_id', 'first_name', 'last_name', 'role'],
                    required: false
                }
            ]
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        const plainOrder = order.get({ plain: true });
        if (plainOrder.items) {
            plainOrder.items = await Promise.all(plainOrder.items.map(async (item) => {
                if (item.customization) {
                    item.customization = await signCustomizationData(item.customization);
                }
                if (item.delivery_link) {
                    item.delivery_link = await signCustomizationUrl(item.delivery_link);
                }
                return item;
            }));
        }

        res.json(plainOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =========================================================
// ===== ORDER WORKFLOW: ASSIGN / PICKUP / PROGRESS ========
// =========================================================

// GET /orders/my-tasks — Employee's assigned orders (richer data for task list)
router.get('/orders/my-tasks', async (req, res) => {
    try {
        const adminId = req.user.admin_id || req.user.id;
        if (!adminId) return res.status(401).json({ error: 'No admin session found.' });

        const orders = await Order.findAll({
            where: { assigned_to: adminId },
            include: [
                { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email', 'phone_number'] },
                {
                    model: OrderItem, as: 'items',
                    attributes: ['order_item_id', 'delivery_status', 'price_at_purchase', 'quantity'],
                    include: [{ model: Product, as: 'product', attributes: ['products_id', 'title', 'thumbnail', 'slug'] }]
                },
                { model: Admin, as: 'assignedEmployee', attributes: ['first_name', 'last_name', 'role'] },
            ],
            order: [['assigned_at', 'DESC']]
        });
        res.json(orders);
    } catch (err) {
        console.error('[MyTasks Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /orders/:id/timeline — Full timeline for an order
router.get('/orders/:id/timeline', checkPermission('orders', 'view'), async (req, res) => {
    try {
        const timeline = await OrderTimeline.findAll({
            where: { order_id: req.params.id },
            include: [{ model: Admin, as: 'actor', attributes: ['first_name', 'last_name', 'role', 'staff_id'] }],
            order: [['event_at', 'ASC']]
        });
        res.json(timeline);
    } catch (err) {
        console.error('[Timeline Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /orders/:id/assign — Assign/re-assign order to a staff member
router.post('/orders/:id/assign', checkPermission('orders', 'assign'), async (req, res) => {
    try {
        const { assignedTo } = req.body;
        if (!assignedTo) return res.status(400).json({ error: 'assignedTo is required.' });

        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const assignee = await Admin.findByPk(assignedTo, { attributes: ['first_name', 'last_name', 'role'] });
        if (!assignee) return res.status(404).json({ error: 'Staff member not found.' });

        const actorId = req.user.admin_id || req.user.id;
        const actorName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Admin';

        await orderQueue.add('assign-order', {
            type: 'ASSIGN',
            orderId: req.params.id,
            adminId: actorId,
            actorName,
            actorRole: req.user.role || 'admin',
            metadata: {
                assignedTo,
                assigneeName: `${assignee.first_name} ${assignee.last_name || ''}`.trim(),
            }
        });

        res.json({ success: true, message: 'Order assignment queued successfully.' });
    } catch (err) {
        console.error('[Assign Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /orders/:id/pickup — Employee claims an assigned order (exclusive)
router.post('/orders/:id/pickup', checkPermission('orders', 'pickup'), async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const adminId = req.user.admin_id || req.user.id;

        // Pre-check: is it assigned to the requesting employee?
        if (String(order.assigned_to) !== String(adminId)) {
            return res.status(403).json({ error: 'This order is not assigned to you.' });
        }

        // Pre-check: already claimed?
        if (order.working_status === 'in_progress' || order.picked_up_at) {
            return res.status(409).json({ error: 'Order already picked up and in progress.' });
        }

        const actorName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Employee';

        await orderQueue.add('pickup-order', {
            type: 'PICKUP',
            orderId: req.params.id,
            adminId,
            actorName,
            actorRole: req.user.role || 'editor',
        });

        res.json({ success: true, message: 'Order picked up. Status updated to In Progress.' });
    } catch (err) {
        console.error('[Pickup Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /orders/:id/update-progress — Stage dropdown update, direct DB insert, NO customer email
router.post('/orders/:id/update-progress', checkPermission('orders', 'edit'), async (req, res) => {
    try {
        const { stage, notes } = req.body;
        if (!stage) return res.status(400).json({ error: 'Stage is required.' });

        const adminId = req.user.admin_id || req.user.id;
        const actorName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Employee';

        await OrderTimeline.create({
            order_id: req.params.id,
            admin_id: adminId,
            actor_name: actorName,
            actor_role: req.user.role || 'editor',
            action: 'PROGRESS_UPDATE',
            status_label: stage,
            notes: notes || null,
            event_at: new Date(),
        });

        res.json({ success: true, message: 'Progress stage updated.' });
    } catch (err) {
        console.error('[Progress Update Error]', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/orders/:id', checkPermission('orders', 'view'), async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name', 'email', 'phone_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product'
                    }]
                },
                {
                    model: Payment,
                    as: 'payment'
                },
                {
                    model: Admin,
                    as: 'assignedEmployee',
                    attributes: ['admin_id', 'first_name', 'last_name', 'role'],
                    required: false
                }
            ]
        });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        const plainOrder = order.get({ plain: true });
        if (plainOrder.items) {
            plainOrder.items = await Promise.all(plainOrder.items.map(async (item) => {
                if (item.customization) {
                    item.customization = await signCustomizationData(item.customization);
                }
                if (item.delivery_link) {
                    item.delivery_link = await signCustomizationUrl(item.delivery_link);
                }
                return item;
            }));
        }

        res.json(plainOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /orders/:id/task-detail — Full order details for the task detail page
router.get('/orders/:id/task-detail', async (req, res) => {
    try {
        const adminId = req.user.admin_id || req.user.id;
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email', 'phone_number'] },
                {
                    model: OrderItem, as: 'items',
                    include: [{ model: Product, as: 'product', attributes: ['products_id', 'title', 'thumbnail', 'slug', 'images', 'internal_sku'] }]
                },
                { model: Payment, as: 'payment', attributes: ['amount', 'status', 'mode', 'razorpay_payment_id'], required: false },
                { model: Admin, as: 'assignedEmployee', attributes: ['admin_id', 'first_name', 'last_name', 'role'], required: false },
            ]
        });
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        // Ensure only the assigned employee (or super admin) can see this
        const isSuperAdmin = req.user.is_super_admin === true;
        if (!isSuperAdmin && String(order.assigned_to) !== String(adminId)) {
            return res.status(403).json({ error: 'Access denied. This order is not assigned to you.' });
        }

        const plain = order.get({ plain: true });
        if (plain.items) {
            plain.items = await Promise.all(plain.items.map(async (item) => {
                if (item.customization) item.customization = await signCustomizationData(item.customization);
                if (item.delivery_link) item.delivery_link = await signCustomizationUrl(item.delivery_link);
                return item;
            }));
        }

        // Fetch timeline
        plain.timeline = await OrderTimeline.findAll({
            where: { order_id: req.params.id },
            order: [['event_at', 'ASC']],
            raw: true,
        });

        res.json(plain);
    } catch (err) {
        console.error('[TaskDetail Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// Deliver Order Item → Upload to PRIVATE bucket (order_id/item_id/file)
router.post('/orders/:orderId/items/:itemId/deliver', checkPermission('orders', 'edit'), async (req, res, next) => {
    // Attach orderId to req for multer key function
    req._parsedOrderId = req.params.orderId;
    next();
}, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
        const fileUrl = `${R2_ENDPOINT}/${process.env.R2_PRIVATE_BUCKET}/${req.file.key}`;

        const orderItem = await OrderItem.findByPk(req.params.itemId, {
            include: [{
                model: Order, as: 'order',
                include: [{ model: User, as: 'user', attributes: ['email', 'first_name', 'last_name'] }]
            }]
        });
        if (!orderItem) return res.status(404).json({ error: 'Order Item not found' });

        const deliveredAt = new Date();
        const expiresAt = new Date(deliveredAt);
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Update order item
        await orderItem.update({
            delivery_status: 'delivered',
            delivery_link: fileUrl,
            delivered_at: deliveredAt,
            download_expires_at: expiresAt,
        });

        // Check if ALL items in the order are delivered → update order status
        const allItems = await OrderItem.findAll({ where: { order_id: orderItem.order_id } });
        const allDelivered = allItems.every(i => i.delivery_status === 'delivered');
        if (allDelivered) {
            await Order.update(
                { status: 'delivered', working_status: 'delivered' },
                { where: { order_id: orderItem.order_id } }
            );
        }

        // Create DELIVERED timeline entry
        const actorName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Employee';
        await OrderTimeline.create({
            order_id: orderItem.order_id,
            admin_id: req.user.admin_id || req.user.id,
            actor_name: actorName,
            actor_role: req.user.role || 'editor',
            action: 'DELIVERED',
            status_label: 'Order Delivered',
            notes: `File delivered for item #${req.params.itemId.substring(0, 8).toUpperCase()}. Download available until ${expiresAt.toLocaleDateString('en-IN')}.`,
            event_at: deliveredAt,
        });

        // Send delivery email to customer
        const order = orderItem.order;
        if (order?.user?.email) {
            const orderRef = order.order_id.substring(0, 8).toUpperCase();
            const orderUrl = `${process.env.FRONTEND_URL || 'https://www.adbuthverse.com'}/order/${order.order_id}`;
            try {
                await sendDeliveryEmail({
                    to: order.user.email,
                    name: order.user.first_name,
                    orderId: order.order_id,
                    orderRef,
                    orderUrl,
                    expiresAt,
                });
            } catch (mailErr) {
                console.error('[Delivery Mail Error]', mailErr.message);
                // Don't fail the upload if email fails
            }
        }

        res.json({
            success: true,
            message: 'Item delivered successfully',
            link: fileUrl,
            download_expires_at: expiresAt,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Remove Delivery (Reset Status & Link)
router.put('/orders/items/:itemId/remove-delivery', checkPermission('orders', 'edit'), async (req, res) => {
    try {
        const orderItem = await OrderItem.findByPk(req.params.itemId);
        if (!orderItem) return res.status(404).json({ error: 'Order Item not found' });

        orderItem.delivery_status = 'pending';
        orderItem.delivery_link = null;
        await orderItem.save();

        res.json({ success: true, message: 'Delivery removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/orders/mark-viewed', checkPermission('orders', 'edit'), async (req, res) => {
    try {
        await Order.update({ viewed_by_admin: true }, { where: { viewed_by_admin: false } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PAYMENT MANAGEMENT ---

// GET /api/admin/payments - List payments with direct Razorpay API sync + local DB enrichment
router.get('/payments', checkPermission('payments', 'view'), async (req, res) => {
    try {
        const { from, to, count, skip, search, status, method } = req.query;

        // Initialize Razorpay
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Build parameters for Razorpay API
        const options = {};
        if (from) options.from = Math.floor(new Date(from).getTime() / 1000);
        if (to) options.to = Math.floor(new Date(to).getTime() / 1000);
        
        // Fetch recent payments from Razorpay (fetch up to 100 for client side paging/filtering)
        options.count = 100;
        
        let paymentsList = [];
        try {
            const rzpResponse = await razorpay.payments.all(options);
            paymentsList = rzpResponse.items || [];
        } catch (rzpErr) {
            console.error('[Razorpay API Error] Falling back to local database:', rzpErr);
            // Fallback to local DB if Razorpay API fails
            const localFallback = await Payment.findAll({
                include: [
                    { model: User, as: 'user', attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number'] },
                    { model: Order, as: 'order', attributes: ['order_id', 'status'] }
                ],
                order: [['createdAt', 'DESC']]
            });
            return res.json({
                payments: localFallback.map(p => ({
                    id: p.razorpay_payment_id || p.payment_id,
                    amount: p.amount,
                    currency: 'INR',
                    status: p.status === 'success' ? 'captured' : p.status,
                    method: p.mode || 'online',
                    email: p.user?.email,
                    contact: p.user?.phone_number,
                    created_at: new Date(p.createdAt).getTime(),
                    localPayment: p
                })),
                totalCount: localFallback.length
            });
        }

        // Query local database for corresponding Payments and User info
        const rzpIds = paymentsList.map(p => p.id);
        const localPayments = await Payment.findAll({
            where: { razorpay_payment_id: rzpIds },
            include: [
                { model: User, as: 'user', attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number'] },
                { 
                    model: Order, 
                    as: 'order',
                    include: [
                        { 
                            model: OrderItem, 
                            as: 'items',
                            include: [{ model: Product, as: 'product', attributes: ['products_id', 'title', 'thumbnail', 'price'] }]
                        }
                    ]
                }
            ]
        });

        // Map local payments by RZP ID
        const localMap = {};
        localPayments.forEach(lp => {
            localMap[lp.razorpay_payment_id] = lp;
        });

        // Pre-fetch users for payments that don't have a local match to avoid N+1 queries and prevent JSON type crashes
        const missingEmails = [];
        const missingContacts = [];
        paymentsList.forEach(p => {
            const local = localMap[p.id];
            if (!local?.user) {
                if (p.email) missingEmails.push(p.email.toLowerCase().trim());
                if (p.contact) missingContacts.push(String(p.contact).trim());
            }
        });

        let fallbackUsers = [];
        if (missingEmails.length > 0) {
            fallbackUsers = await User.findAll({
                where: {
                    email: { [Op.in]: missingEmails }
                },
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number']
            });
        }

        let phoneUsers = [];
        if (missingContacts.length > 0) {
            phoneUsers = await User.findAll({
                where: { phone_number: { [Op.ne]: null } },
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number']
            });
        }

        // Resolve and enrich each payment
        let enriched = await Promise.all(paymentsList.map(async p => {
            const local = localMap[p.id];
            let user = local?.user || null;

            // If no local payment but we have user email/phone, search user in pre-fetched lists
            if (!user && (p.email || p.contact)) {
                if (p.email) {
                    const cleanEmail = p.email.toLowerCase().trim();
                    user = fallbackUsers.find(u => u.email && u.email.toLowerCase().trim() === cleanEmail) || null;
                }
                
                if (!user && p.contact) {
                    const contactStr = String(p.contact).trim();
                    user = phoneUsers.find(u => {
                        try {
                            const ph = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                            if (!ph || !ph.number) return false;
                            return contactStr.includes(ph.number) || ph.number.includes(contactStr);
                        } catch (e) {
                            return false;
                        }
                    }) || null;
                }
            }

            // Sync local payment mode with Razorpay's original payment method
            if (local && local.mode !== p.method) {
                try {
                    await Payment.update(
                        { mode: p.method },
                        { where: { payment_id: local.payment_id } }
                    );
                    local.mode = p.method;
                } catch (updateErr) {
                    console.error(`Failed to sync payment mode for payment ${local.payment_id}:`, updateErr);
                }
            }

            return {
                id: p.id,
                amount: p.amount / 100, // paise to INR
                currency: p.currency,
                status: p.status, // created, authorized, captured, refunded, failed
                order_id: p.order_id,
                method: p.method,
                amount_refunded: (p.amount_refunded || 0) / 100,
                refund_status: p.refund_status, // null, partial, full
                email: p.email || user?.email,
                contact: p.contact || user?.phone_number,
                created_at: p.created_at * 1000, // s to ms
                acquirer_data: p.acquirer_data || {},
                user: user ? {
                    user_id: user.user_id,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    email: user.email,
                    phone: user.phone_number
                } : null,
                localPayment: local ? {
                    payment_id: local.payment_id,
                    refund_request_status: local.refund_request_status || 'none',
                    refund_request_reason: local.refund_request_reason,
                    refund_request_details: local.refund_request_details,
                    refund_requested_at: local.refund_requested_at,
                    amount_refunded: (local.amount_refunded || 0) / 100,
                    order: local.order
                } : null
            };
        }));

        // Apply status & method filtering on server side
        if (status && status !== 'all') {
            if (status === 'refunded') {
                enriched = enriched.filter(p => p.status === 'refunded' || p.amount_refunded > 0);
            } else {
                enriched = enriched.filter(p => p.status === status);
            }
        }
        if (method && method !== 'all') {
            enriched = enriched.filter(p => p.method === method);
        }

        // Search filtering (since Razorpay list doesn't support complex searching in Node SDK)
        if (search) {
            const query = search.toLowerCase();
            enriched = enriched.filter(p => 
                p.id.toLowerCase().includes(query) ||
                (p.email && p.email.toLowerCase().includes(query)) ||
                (p.contact && p.contact.includes(query)) ||
                (p.user?.name && p.user.name.toLowerCase().includes(query)) ||
                (p.localPayment?.order?.order_id && p.localPayment.order.order_id.toLowerCase().includes(query))
            );
        }

        // Pagination slice
        const limit = parseInt(count) || 20;
        const offset = parseInt(skip) || 0;
        const paginated = enriched.slice(offset, offset + limit);

        res.json({
            payments: paginated,
            totalCount: enriched.length
        });
    } catch (err) {
        console.error('[GET Payments Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/payments/stats - Fetch dashboard sum stats from Razorpay
router.get('/payments/stats', checkPermission('payments', 'view'), async (req, res) => {
    try {
        const { from, to } = req.query;

        // Initialize Razorpay
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = { count: 100 };
        if (from) options.from = Math.floor(new Date(from).getTime() / 1000);
        if (to) options.to = Math.floor(new Date(to).getTime() / 1000);

        let items = [];
        try {
            const rzpResponse = await razorpay.payments.all(options);
            items = rzpResponse.items || [];
        } catch (err) {
            console.error('[Razorpay Stats Fetch Error]', err);
            // Fallback to local DB sums
            const localPayments = await Payment.findAll({
                where: {
                    status: 'success'
                }
            });
            const collected = localPayments.reduce((s, p) => s + p.amount, 0);
            return res.json({
                collectedAmount: collected,
                capturedCount: localPayments.length,
                refundedAmount: 0,
                refundedCount: 0,
                failedCount: 0
            });
        }

        let collectedAmount = 0;
        let capturedCount = 0;
        let refundedAmount = 0;
        let refundedCount = 0;
        let failedCount = 0;

        items.forEach(p => {
            if (p.status === 'captured' || p.status === 'refunded') {
                collectedAmount += p.amount / 100;
                capturedCount++;
            }
            if (p.status === 'refunded' || p.amount_refunded > 0) {
                refundedAmount += (p.amount_refunded || 0) / 100;
                refundedCount++;
            }
            if (p.status === 'failed') {
                failedCount++;
            }
        });

        res.json({
            collectedAmount,
            capturedCount,
            refundedAmount,
            refundedCount,
            failedCount
        });
    } catch (err) {
        console.error('[GET Payments Stats Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/payments/:id/refund - Issue a full or partial refund via Razorpay
router.post('/payments/:id/refund', checkPermission('payments', 'edit'), async (req, res) => {
    try {
        const paymentId = req.params.id; // This is the Razorpay payment ID (e.g., pay_...)
        const { amount, adminNotes } = req.body; // amount in INR (optional)

        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // 1. Fetch Razorpay Payment to verify details
        const rzpPayment = await razorpay.payments.fetch(paymentId);
        if (!rzpPayment) {
            return res.status(404).json({ error: 'Razorpay payment not found' });
        }

        // Calculate amount to refund
        const refundAmountINR = amount ? parseFloat(amount) : (rzpPayment.amount - (rzpPayment.amount_refunded || 0)) / 100;
        const refundAmountPaise = Math.round(refundAmountINR * 100);

        if (refundAmountPaise <= 0) {
            return res.status(400).json({ error: 'Invalid refund amount' });
        }

        // 2. Call Razorpay Refund API
        const refund = await razorpay.payments.refund(paymentId, {
            amount: refundAmountPaise,
            notes: {
                admin_notes: adminNotes || 'Processed from Admin Dashboard'
            }
        });

        // 3. Find matching local payment
        const localPayment = await Payment.findOne({
            where: { razorpay_payment_id: paymentId },
            include: [{ model: User, as: 'user' }, { model: Order, as: 'order' }]
        });

        if (localPayment) {
            // Update local payment
            const newAmountRefunded = (localPayment.amount_refunded || 0) + refundAmountPaise;
            await localPayment.update({
                refund_request_status: 'approved',
                amount_refunded: newAmountRefunded,
                status: newAmountRefunded >= (localPayment.amount * 100) ? 'refunded' : 'partially_refunded'
            });

            // Update order status if fully refunded
            if (newAmountRefunded >= (localPayment.amount * 100)) {
                await Order.update({ status: 'cancelled' }, { where: { order_id: localPayment.order_id } });
            }

            // Add Order Timeline Event
            await OrderTimeline.create({
                order_id: localPayment.order_id,
                admin_id: req.user.admin_id || req.user.id,
                actor_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Admin',
                actor_role: req.user.role || 'admin',
                action: 'COMPLETED',
                status_label: 'Refund Processed',
                notes: `Refund of ₹${refundAmountINR.toLocaleString()} processed via Razorpay. Notes: ${adminNotes || 'None'}`
            });

            // Send Refund Confirmation Email to Customer
            const { sendRefundEmail } = require('../utils/refundMailer');
            if (localPayment.user?.email) {
                await sendRefundEmail({
                    to: localPayment.user.email,
                    name: localPayment.user.first_name,
                    orderId: localPayment.order_id,
                    refundAmount: refundAmountINR,
                    status: 'approved'
                });
            }
        }

        res.json({ success: true, refund });
    } catch (err) {
        console.error('[Admin Process Refund Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/payments/:id/reject-refund - Reject a customer refund request
router.post('/payments/:id/reject-refund', checkPermission('payments', 'edit'), async (req, res) => {
    try {
        const paymentId = req.params.id; // This is the Razorpay payment ID (e.g. pay_...)
        const { rejectionReason } = req.body;

        const localPayment = await Payment.findOne({
            where: { razorpay_payment_id: paymentId },
            include: [{ model: User, as: 'user' }]
        });

        if (!localPayment) {
            return res.status(404).json({ error: 'Local payment record not found' });
        }

        await localPayment.update({
            refund_request_status: 'rejected'
        });

        // Add Order Timeline Event
        await OrderTimeline.create({
            order_id: localPayment.order_id,
            admin_id: req.user.admin_id || req.user.id,
            actor_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Admin',
            actor_role: req.user.role || 'admin',
            action: 'REASSIGNED',
            status_label: 'Refund Request Rejected',
            notes: rejectionReason || 'Does not qualify for refund.'
        });

        // Send Rejection Email to Customer
        const { sendRefundEmail } = require('../utils/refundMailer');
        if (localPayment.user?.email) {
            await sendRefundEmail({
                to: localPayment.user.email,
                name: localPayment.user.first_name,
                orderId: localPayment.order_id,
                refundAmount: 0,
                status: 'rejected',
                reason: rejectionReason
            });
        }

        res.json({ success: true, message: 'Refund request rejected' });
    } catch (err) {
        console.error('[Admin Reject Refund Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/orders/:id/complete-changes - Mark template changes as completed
router.post('/orders/:id/complete-changes', checkPermission('orders', 'edit'), async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: User, as: 'user' }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update change status
        await order.update({
            change_request_status: 'completed'
        });

        // Add Order Timeline Event
        await OrderTimeline.create({
            order_id: order.order_id,
            admin_id: req.user.admin_id || req.user.id,
            actor_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Admin',
            actor_role: req.user.role || 'admin',
            action: 'COMPLETED',
            status_label: 'Changes Completed',
            notes: 'The design team has completed your customization updates.'
        });

        // Send Email to Customer
        const { sendChangeRequestEmail } = require('../utils/refundMailer');
        if (order.user?.email) {
            await sendChangeRequestEmail({
                to: order.user.email,
                name: order.user.first_name,
                orderId: order.order_id,
                status: 'completed'
            });
        }

        res.json({ success: true, message: 'Change request marked as completed' });
    } catch (err) {
        console.error('[Admin Complete Changes Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// --- USER MANAGEMENT ---
router.get('/users', checkPermission('users', 'view'), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users/:id', checkPermission('users', 'view'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{
                model: Order,
                as: 'orders',
                attributes: ['order_id', 'total_amount', 'status', 'createdAt']
            }]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/users/:id', checkPermission('users', 'edit'), async (req, res) => {
    try {
        // Security Fix: Prevent Mass Assignment (don't allow changing role or id)
        const { first_name, last_name, email, phone_number } = req.body;

        // Only allow updating these specific fields
        const updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (email !== undefined) updateData.email = email;
        if (phone_number !== undefined) updateData.phone_number = phone_number;

        const [updated] = await User.update(updateData, { where: { user_id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/users/:id', checkPermission('users', 'delete'), async (req, res) => {
    try {
        const deleted = await User.destroy({ where: { user_id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Review Management Routes ---

// GET /api/admin/reviews - Get all reviews with pagination and filtering
router.get('/reviews', checkPermission('reviews', 'view'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status; // 'pending', 'approved', 'rejected' or undefined for all
        const search = req.query.search;

        const whereClause = {};
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        // Search Logic
        const includeOptions = [
            {
                model: User,
                as: 'user',
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number']
            },
            {
                model: Product,
                as: 'product',
                attributes: ['products_id', 'title', 'thumbnail', 'price']
            }
        ];

        if (search) {
            // We need to filter based on associated models, so we might need to use top-level where with $ association aliases $ 
            // OR simpler: use nested where in includes if strict, but we want OR across models.
            // Sequelize is tricky with OR across tables. 
            // Easiest robust way: 
            // 1. Filter main table (Review) text 
            // 2. OR Filter User
            // 3. OR Filter Product
            // BUT: complex OR queries across associations often require `required: false` or top level `$model.field$`.

            // Let's try the top-level syntax which works well with left joins
            whereClause[Op.or] = [
                { comment: { [Op.like]: `%${search}%` } },
                { '$user.first_name$': { [Op.like]: `%${search}%` } },
                { '$user.last_name$': { [Op.like]: `%${search}%` } },
                { '$product.title$': { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Review.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            // distinct: true, // Important for accurate count with includes, usually needed but findAndCountAll handles it mostly
            subQuery: false // Needed when using $association$ in where clause to prevent error with limits
        });

        // Metrics for the dashboard cards
        const totalReviews = await Review.count({ where: whereClause });
        const lowRatingCount = await Review.count({ where: { ...whereClause, rating: { [Op.lte]: 2 } } });
        
        let avgRating = 0;
        try {
            const avgRatingSrc = await Review.findAll({ 
                attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
                where: whereClause,
                raw: true
            });
            avgRating = avgRatingSrc[0]?.avgRating || 0;
        } catch (e) {
            console.error('[Admin Reviews] Error calculating avgRating:', e);
        }

        res.json({
            reviews: rows,
            totalReviews: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            metrics: {
                total: totalReviews,
                lowRating: lowRatingCount,
                avgRating: parseFloat(avgRating || 0).toFixed(1)
            }
        });
    } catch (err) {
        console.error('Error fetching admin reviews:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/reviews/:id/status - Update review status
router.patch('/reviews/:id/status', checkPermission('reviews', 'edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        review.status = status;
        await review.save();

        res.json({ success: true, message: 'Review status updated', review });
    } catch (err) {
        console.error('Error updating review status:', err);
        res.status(500).json({ error: err.message });
    }
});



// DELETE /api/admin/reviews/:id - Delete a review
router.delete('/reviews/:id', checkPermission('reviews', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Review.destroy({ where: { review_id: id } });

        if (!result) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- REVIEW MANAGEMENT (Settings & Replies) ---

// GET /api/admin/reviews/:id - Get a single review
router.get('/reviews/:id', checkPermission('reviews', 'view'), async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id === 'settings') return next();
        
        const review = await Review.findByPk(id, {
            include: [
                { model: User, as: 'user', attributes: ['first_name'] },
                { model: Product, as: 'product', attributes: ['title'] }
            ]
        });
        if (!review) return res.status(404).json({ error: 'Review not found' });
        res.json(review);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET /api/admin/reviews/settings - Get auto-reply config
router.get('/reviews/settings', checkPermission('settings', 'view'), async (req, res) => {
    try {
        let settings = await ReviewSetting.findOne();
        if (!settings) {
            settings = await ReviewSetting.create({});
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/reviews/settings - Update auto-reply config
router.post('/reviews/settings', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        let settings = await ReviewSetting.findOne();
        if (settings) {
            await settings.update(req.body);
        } else {
            settings = await ReviewSetting.create(req.body);
        }
        res.json(settings);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/admin/reviews/:id/reply - Admin manual reply
router.post('/reviews/:id/reply', checkPermission('reviews', 'edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message) return res.status(400).json({ error: 'Reply message is required' });

        const review = await Review.findByPk(id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        const adminReply = {
            id: require('crypto').randomUUID(),
            user_id: req.user.id,
            userName: `${req.user.first_name || 'Admin'}`, // Fallback
            role: 'admin',
            message,
            createdAt: new Date()
        };

        const updatedReplies = [...(review.replies || []), adminReply];
        review.replies = updatedReplies;
        review.unread_user = true;
        await review.save();

        res.json({ success: true, replies: updatedReplies });
    } catch (err) {
        console.error('Admin Review Reply Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/reviews/:id/read - Mark review as read by admin
router.post('/reviews/:id/read', checkPermission('reviews', 'edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByPk(id);
        if (review) {
            review.unread_admin = false;
            await review.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- COUPON MANAGEMENT ---
router.get('/coupons', checkPermission('marketing', 'view'), async (req, res) => {
    try {
        const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/coupons/:id/usage', checkPermission('marketing', 'view'), async (req, res) => {
    try {
        const usages = await CouponUsage.findAll({
            where: { coupon_id: req.params.id },
            include: [
                { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
                { model: Order, as: 'order', attributes: ['order_id', 'total_amount', 'discount_amount', 'status'] }
            ],
            order: [['used_at', 'DESC']]
        });
        res.json(usages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/coupons/:id', checkPermission('marketing', 'view'), async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.json(coupon);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/coupons', checkPermission('marketing', 'edit'), async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json(coupon);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }
        res.status(400).json({ error: err.message });
    }
});

// --- Coupon Media Upload ---
router.post('/coupons/upload', checkPermission('marketing', 'edit'), uploadCouponMedia.single('media'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: publicFileUrl(req.file.key) });
});

router.put('/coupons/:id', checkPermission('marketing', 'edit'), async (req, res) => {
    try {
        const [updated] = await Coupon.update(req.body, { where: { coupon_id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Coupon not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/coupons/:id', checkPermission('marketing', 'delete'), async (req, res) => {
    try {
        const deleted = await Coupon.destroy({ where: { coupon_id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'Coupon not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- INQUIRY MANAGEMENT ---
const { sendReply } = require('../utils/emailService');

// GET /api/admin/inquiries/unread-count
router.get('/inquiries/unread-count', checkPermission('support', 'view'), async (req, res) => {
    try {
        const count = await Enquiry.count({ where: { status: 'new' } });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/inquiries', checkPermission('support', 'view'), async (req, res) => {
    try {
        const inquiries = await Enquiry.findAll({ order: [['last_message_at', 'DESC']] });
        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/inquiries/:id/read', checkPermission('support', 'edit'), async (req, res) => {
    try {
        const inquiry = await Enquiry.findByPk(req.params.id);
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

        inquiry.status = 'read';
        await inquiry.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/inquiries/:id/close', checkPermission('support', 'edit'), async (req, res) => {
    try {
        const inquiry = await Enquiry.findByPk(req.params.id);
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

        inquiry.status = 'resolved'; // Mark as resolved/closed
        await inquiry.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/inquiries/:id/reply', checkPermission('support', 'edit'), async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const inquiry = await Enquiry.findByPk(req.params.id);
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

        // 1. Send Email (Skip for Live Chat threads to prevent spam)
        if (!inquiry.subject || !inquiry.subject.includes('Live Chat')) {
            await sendReply({
                to: inquiry.email,
                subject: `Re: ${inquiry.subject}`,
                html: `<p>${message}</p>`
            });
        }

        // 2. Update Database Conversation
        const newMessage = {
            role: 'admin',
            content: message,
            timestamp: new Date()
        };

        const updatedMessages = [...(inquiry.messages || []), newMessage];
        inquiry.messages = updatedMessages;
        inquiry.status = 'replied';
        inquiry.last_message_at = new Date();
        await inquiry.save();

        res.json({ success: true, messages: updatedMessages });
    } catch (err) {
        console.error('Reply Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ===================================================
// ===== STAFF MANAGEMENT ===========================
// ===================================================

// GET /staff — list all staff members
router.get('/staff', checkPermission('staff', 'view'), async (req, res) => {
    try {
        const staff = await Admin.findAll({
            attributes: { exclude: ['password_hash'] }
        });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /staff — create new staff member with role_id
router.post('/staff', checkPermission('staff', 'edit'), async (req, res) => {
    try {
        const { first_name, last_name, email, password, role_id } = req.body;

        const Role = require('../models/Role');
        const roleRecord = await Role.findByPk(role_id);
        if (!roleRecord) return res.status(400).json({ error: 'Invalid role selected' });

        const year = new Date().getFullYear();
        const lastStaff = await Admin.findOne({
            where: sequelize.where(sequelize.fn('LEFT', sequelize.col('staff_id'), 8), `ADB-${year}`),
            order: [['createdAt', 'DESC']]
        });
        let seq = 1;
        if (lastStaff?.staff_id) {
            const parts = lastStaff.staff_id.split('-');
            seq = (parseInt(parts[2] || '0') + 1);
        }
        const staffId = `ADB-${year}-${String(seq).padStart(3, '0')}`;

        const baseUsername = `adbuth.${(first_name || '').toLowerCase().replace(/\\s+/g, '')}${last_name ? '.' + last_name[0].toLowerCase() : ''}`;
        let username = baseUsername;
        let uSuffix = 1;
        while (await Admin.findOne({ where: { username } })) username = `${baseUsername}${uSuffix++}`;

        const newAdmin = await Admin.create({
            first_name, last_name, email,
            password_hash: password,
            role: roleRecord.name,
            role_id: roleRecord.role_id,
            permissions: roleRecord.permissions || {},
            staff_id: staffId,
            username
        });

        let email_sent = true;
        try {
            await sendStaffWelcomeEmail({ to: email, firstName: first_name, lastName: last_name || '', staffId, username, password, role: roleRecord.name });
        } catch (err) {
            console.error(`[StaffMailer Error] ${email}:`, err.message);
            email_sent = false;
        }

        res.status(201).json({ success: true, admin_id: newAdmin.admin_id, staff_id: staffId, username, email_sent });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: 'Staff member with this email already exists' });
        res.status(400).json({ error: err.message });
    }
});

// PUT /staff/:id — update staff member (role_id syncs permissions from role)
router.put('/staff/:id', checkPermission('staff', 'edit'), async (req, res) => {
    try {
        const { first_name, last_name, role_id, is_active, password } = req.body;
        const staff = await Admin.findByPk(req.params.id);
        if (!staff) return res.status(404).json({ error: 'Staff member not found' });

        const updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (is_active !== undefined) updateData.is_active = is_active;

        if (role_id !== undefined) {
            const Role = require('../models/Role');
            const roleRecord = await Role.findByPk(role_id);
            if (!roleRecord) return res.status(400).json({ error: 'Invalid role selected' });

            // Protect the last Super Admin — is_system flag on the role record (UUID-safe)
            const currentRole = staff.role_id ? await require('../models/Role').findByPk(staff.role_id) : null;
            const wasAdmin = currentRole?.is_system === true;
            const willBeAdmin = roleRecord.is_system === true;
            if (wasAdmin && !willBeAdmin) {
                const adminCount = await Admin.count({ where: { role_id: currentRole.role_id, is_active: true } });
                if (adminCount <= 1) return res.status(400).json({ error: 'Cannot change role: at least one Super Admin must exist.' });
            }

            updateData.role = roleRecord.name;
            updateData.role_id = roleRecord.role_id;
            updateData.permissions = roleRecord.permissions || {};
        }

        if (password) updateData.password_hash = password;
        await staff.update(updateData);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /staff/:id — delete staff member
router.delete('/staff/:id', checkPermission('staff', 'delete'), async (req, res) => {
    try {
        if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ error: 'Cannot delete your own admin account' });
        const staff = await Admin.findByPk(req.params.id);
        if (!staff) return res.status(404).json({ error: 'Staff member not found' });
        // Protect the last Super Admin — check is_system on staff's role (UUID-safe)
        if (staff.role_id) {
            const staffRole = await require('../models/Role').findByPk(staff.role_id);
            if (staffRole?.is_system === true) {
                const adminCount = await Admin.count({ where: { role_id: staff.role_id, is_active: true } });
                if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last Super Admin account.' });
            }
        }
        await staff.destroy();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================================================

// Audit Logs have been removed from this system.
// GET /api/admin/reports/audit-logs -> 410 Gone
router.get('/reports/audit-logs', (req, res) => {
    res.status(410).json({ error: 'Audit logs have been removed from this system.' });
});

// GET /api/admin/reports/attendance — Employee time tracking & work hours
router.get('/reports/attendance', checkPermission('staff', 'view'), async (req, res) => {
    try {
        const { admin_id, status, from, to, page = 1, limit = 50 } = req.query;
        const where = {};
        if (admin_id) where.admin_id = admin_id;
        if (status) where.status = status;
        if (from || to) {
            where.login_at = {};
            if (from) where.login_at[Op.gte] = new Date(from);
            if (to) where.login_at[Op.lte] = new Date(to);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await AdminSession.findAndCountAll({
            where,
            order: [['login_at', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        // Summary per admin
        const summary = await AdminSession.findAll({
            attributes: [
                'admin_id',
                'admin_name',
                'admin_role',
                [sequelize.fn('COUNT', sequelize.col('session_id')), 'total_sessions'],
                [sequelize.fn('SUM', sequelize.col('duration_minutes')), 'total_minutes'],
                [sequelize.fn('SUM', sequelize.col('action_count')), 'total_actions']
            ],
            where: admin_id ? { admin_id } : {},
            group: ['admin_id', 'admin_name', 'admin_role']
        });

        res.json({ total: count, page: parseInt(page), sessions: rows, summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =============================================
// ===== MASTER DATA MANAGEMENT ROUTES =========
// =============================================

// --- GET all master data (for dropdowns) ---
router.get('/master-data', checkPermission('master_data', 'view'), async (req, res) => {
    try {
        const [types, variants, orientations, categories, subCategories, parentCategories, shopSettings, customizationTemplates] = await Promise.all([
            AssetType.findAll({ order: [['name', 'ASC']] }),
            AssetVariant.findAll({ order: [['name', 'ASC']] }),
            AssetOrientation.findAll({ order: [['name', 'ASC']] }),
            AssetCategory.findAll({ order: [['name', 'ASC']], include: [{ model: Category, as: 'parentCategory', attributes: ['category_id', 'category_name', 'slug'] }] }),
            AssetSubCategory.findAll({ order: [['name', 'ASC']], include: [{ model: AssetCategory, as: 'assetCategory', attributes: ['asset_category_id', 'name', 'code'] }] }),
            Category.findAll({ order: [['category_name', 'ASC']] }),
            ShopSetting.findOne(),
            CustomizationTemplate.findAll({ order: [['name', 'ASC']] })
        ]);
        res.json({ types, variants, orientations, categories, subCategories, parentCategories, shopSettings, customizationTemplates });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Banner Upload Utility ---
router.post('/master-data/upload-banner', checkPermission('settings', 'edit'), uploadBanner.single('banner'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Force usage of the public R2 domain instead of the default S3-compatible location.
    res.json({ url: publicFileUrl(req.file.key) });
});

// --- ShopSettings CRUD ---
router.get('/master-data/shop-settings', checkPermission('settings', 'view'), async (req, res) => {
    try {
        let settings = await ShopSetting.findOne();
        if (!settings) {
            settings = await ShopSetting.create({
                shop_banner_title: 'Celebrate Every Moment',
                shop_banner_subtitle: 'Premium templates for every occasion.'
            });
        }
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/master-data/shop-settings', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        let settings = await ShopSetting.findOne();
        if (settings) {
            // Old file is intentionally kept in cloud storage to allow reuse in the media library.
            await settings.update(req.body);
        } else {
            settings = await ShopSetting.create(req.body);
        }
        await clearCache(['master-data']);
        res.json(settings);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- AssetType CRUD ---
router.post('/master-data/types', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetType, { name, code });
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const record = await AssetType.create(req.body);
        await clearCache(['master-data']);
        res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/master-data/types/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetType, { name, code }, 'type_id', req.params.id);
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const [n] = await AssetType.update(req.body, { where: { type_id: req.params.id } });
        if (!n) return res.status(404).json({ error: 'Not found' });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/master-data/types/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        await AssetType.destroy({ where: { type_id: req.params.id } });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- AssetVariant CRUD ---
router.post('/master-data/variants', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetVariant, { name, code });
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const record = await AssetVariant.create(req.body);
        await clearCache(['master-data']);
        res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/master-data/variants/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetVariant, { name, code }, 'variant_id', req.params.id);
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const [n] = await AssetVariant.update(req.body, { where: { variant_id: req.params.id } });
        if (!n) return res.status(404).json({ error: 'Not found' });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/master-data/variants/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        await AssetVariant.destroy({ where: { variant_id: req.params.id } });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- AssetOrientation CRUD ---
router.post('/master-data/orientations', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetOrientation, { name, code });
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const record = await AssetOrientation.create(req.body);
        await clearCache(['master-data']);
        res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/master-data/orientations/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetOrientation, { name, code }, 'orientation_id', req.params.id);
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const [n] = await AssetOrientation.update(req.body, { where: { orientation_id: req.params.id } });
        if (!n) return res.status(404).json({ error: 'Not found' });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/master-data/orientations/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        await AssetOrientation.destroy({ where: { orientation_id: req.params.id } });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- AssetCategory CRUD ---
router.post('/master-data/asset-categories', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetCategory, { name, code });
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const slug = await ensureUniqueSlug(name, AssetCategory, 'asset_category_id');
        const record = await AssetCategory.create({ ...req.body, slug });
        await clearCache(['master-data']);
        res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/master-data/asset-categories/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetCategory, { name, code }, 'asset_category_id', req.params.id);
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const slug = await ensureUniqueSlug(name, AssetCategory, 'asset_category_id', req.params.id);
        const [n] = await AssetCategory.update({ ...req.body, slug }, { where: { asset_category_id: req.params.id } });
        if (!n) return res.status(404).json({ error: 'Not found' });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/master-data/asset-categories/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        await AssetCategory.destroy({ where: { asset_category_id: req.params.id } });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- AssetSubCategory CRUD ---
router.post('/master-data/sub-categories', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetSubCategory, { name, code });
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const slug = await ensureUniqueSlug(name, AssetSubCategory, 'asset_sub_category_id');
        const record = await AssetSubCategory.create({ ...req.body, slug });
        await clearCache(['master-data']); // Immediately visible in product creation form
        res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/master-data/sub-categories/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, code } = req.body;
        const duplicate = await checkDuplicate(AssetSubCategory, { name, code }, 'asset_sub_category_id', req.params.id);
        if (duplicate) {
            const field = duplicate.name.toLowerCase() === name.toLowerCase().trim() ? 'name' : 'code';
            return res.status(400).json({ error: `This ${field} already exists.`, field });
        }
        const slug = await ensureUniqueSlug(name, AssetSubCategory, 'asset_sub_category_id', req.params.id);
        const [n] = await AssetSubCategory.update({ ...req.body, slug }, { where: { asset_sub_category_id: req.params.id } });
        if (!n) return res.status(404).json({ error: 'Not found' });
        await clearCache(['master-data']); // Immediately visible in product creation form
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/master-data/sub-categories/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        await AssetSubCategory.destroy({ where: { asset_sub_category_id: req.params.id } });
        await clearCache(['master-data']); // Remove from dropdowns immediately
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});



// --- Category (Primary) CRUD ---
router.post('/master-data/primary-categories', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { category_name } = req.body;
        const duplicate = await Category.findOne({ where: { category_name: sequelize.fn('LOWER', category_name.trim()) } });
        if (duplicate) return res.status(400).json({ error: 'This category already exists.', field: 'category_name' });

        const slug = await ensureUniqueSlug(category_name, Category, 'category_id');
        const record = await Category.create({
            category_name, // Just use the name
            slug,
            banner_image: req.body.banner_image,
            banner_title: req.body.banner_title,
            banner_subtitle: req.body.banner_subtitle
        });
        await clearCache(['master-data']);
        res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/master-data/primary-categories/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { category_name } = req.body;
        const duplicate = await Category.findOne({
            where: {
                category_name: sequelize.fn('LOWER', category_name.trim()),
                category_id: { [Op.ne]: req.params.id }
            }
        });
        if (duplicate) return res.status(400).json({ error: 'This category already exists.', field: 'category_name' });

        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        // Old file is intentionally kept in cloud storage to allow reuse in the media library.
        const slug = await ensureUniqueSlug(category_name, Category, 'category_id', req.params.id);
        await category.update({
            category_name,
            slug,
            banner_image: req.body.banner_image,
            banner_title: req.body.banner_title,
            banner_subtitle: req.body.banner_subtitle,
            banner_type: req.body.banner_type
        });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/master-data/primary-categories/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        await Category.destroy({ where: { category_id: req.params.id } });
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===================================================
// ===== ROLE MANAGEMENT (Super Admin only) ==========
// ===================================================

// GET /api/admin/roles - List all roles
router.get('/roles', checkPermission('staff', 'view'), async (req, res) => {
    try {
        const roles = await Role.findAll({
            order: [['is_system', 'DESC'], ['name', 'ASC']]
        });
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/roles/:id - Get single role
router.get('/roles/:id', checkPermission('staff', 'view'), async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id, {
            include: [{ model: Admin, as: 'members', attributes: ['admin_id', 'first_name', 'last_name', 'email', 'role'] }]
        });
        if (!role) return res.status(404).json({ error: 'Role not found' });
        res.json(role);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/roles - Create new role (Super Admin only)
router.post('/roles', checkPermission('staff', 'edit'), async (req, res) => {
    try {
        // Only Super Admin (is_super_admin === true, from Role.is_system) can create roles
        if (req.user.is_super_admin !== true) {
            return res.status(403).json({ error: 'Only Super Admins can create roles.' });
        }

        const { name, description, permissions } = req.body;
        if (!name) return res.status(400).json({ error: 'Role name is required' });

        const existing = await Role.findOne({ where: { name } });
        if (existing) return res.status(400).json({ error: 'A role with this name already exists' });

        const role = await Role.create({ name, description, permissions: permissions || {}, is_system: false });
        res.status(201).json(role);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/admin/roles/:id - Update role
router.put('/roles/:id', checkPermission('staff', 'edit'), async (req, res) => {
    try {
        if (req.user.is_super_admin !== true) {
            return res.status(403).json({ error: 'Only Super Admins can edit roles.' });
        }

        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ error: 'Role not found' });

        // Prevent renaming system roles
        if (role.is_system && req.body.name && req.body.name !== role.name) {
            return res.status(400).json({ error: 'Cannot rename a system role.' });
        }

        const { name, description, permissions } = req.body;
        await role.update({ name, description, permissions });

        // Sync permissions to all Admin members who belong to this role
        await Admin.update(
            { permissions },
            { where: { role_id: role.role_id } }
        );

        res.json({ success: true, role });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/admin/roles/:id - Delete role (cannot delete system roles)
router.delete('/roles/:id', checkPermission('staff', 'delete'), async (req, res) => {
    try {
        if (req.user.is_super_admin !== true) {
            return res.status(403).json({ error: 'Only Super Admins can delete roles.' });
        }

        const role = await Role.findByPk(req.params.id);
        if (!role) return res.status(404).json({ error: 'Role not found' });
        if (role.is_system) return res.status(400).json({ error: 'System roles cannot be deleted.' });

        // Check if any admins still use this role
        const membersCount = await Admin.count({ where: { role_id: role.role_id } });
        if (membersCount > 0) {
            return res.status(400).json({
                error: `Cannot delete: ${membersCount} staff member(s) are assigned to this role. Reassign them first.`
            });
        }

        await role.destroy();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/roles/seed - Seed default roles (Super Admin only, run once)
router.post('/roles/seed', async (req, res) => {
    try {
        if (req.user.is_super_admin !== true) {
            return res.status(403).json({ error: 'Only Super Admins can seed roles.' });
        }

        const defaultRoles = [
            {
                name: 'Super Admin',
                description: 'Full system access',
                is_system: true,
                permissions: {
                    dashboard: ['view'], seo: ['view', 'edit'], orders: ['view', 'edit', 'delete', 'assign', 'pickup'],
                    products: ['view', 'edit', 'delete'], master_data: ['view', 'edit', 'delete'],
                    blogs: ['view', 'edit', 'delete'], blog_categories: ['view', 'edit', 'delete'],
                    reviews: ['view', 'edit', 'delete'], payments: ['view'], enquiries: ['view', 'edit'],
                    marketing: ['view', 'edit', 'delete'], users: ['view', 'edit', 'delete'],
                    staff: ['view', 'edit', 'delete'], settings: ['view', 'edit'],
                    order_tracking: ['view'], my_tasks: ['view']
                }
            },
            {
                name: 'Editor',
                description: 'Content and order management',
                is_system: false,
                permissions: {
                    dashboard: ['view'], orders: ['view', 'edit', 'pickup'],
                    products: ['view', 'edit'], blogs: ['view', 'edit'],
                    blog_categories: ['view'], reviews: ['view', 'edit'],
                    my_tasks: ['view']
                }
            },
            {
                name: 'Marketing',
                description: 'Marketing and promotions management',
                is_system: false,
                permissions: {
                    dashboard: ['view'], seo: ['view', 'edit'],
                    marketing: ['view', 'edit', 'delete'], users: ['view']
                }
            },
            {
                name: 'Support',
                description: 'Customer support and inquiry management',
                is_system: false,
                permissions: {
                    dashboard: ['view'], orders: ['view'],
                    reviews: ['view', 'edit'], users: ['view'],
                    enquiries: ['view', 'edit']
                }
            },
            {
                name: 'Manager',
                description: 'Management overview access',
                is_system: false,
                permissions: {
                    dashboard: ['view'], orders: ['view', 'edit', 'assign', 'pickup'],
                    products: ['view'], blogs: ['view'], reviews: ['view'],
                    payments: ['view'], users: ['view'], staff: ['view'],
                    order_tracking: ['view'], my_tasks: ['view'],
                    enquiries: ['view', 'edit']
                }
            }
        ];

        const results = [];
        for (const roleData of defaultRoles) {
            const [role, created] = await Role.findOrCreate({
                where: { name: roleData.name },
                defaults: roleData
            });
            results.push({ name: role.name, created, role_id: role.role_id, refreshed: !created });
        }

        res.json({ success: true, roles: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CustomizationTemplate CRUD ---
router.get('/master-data/customization-templates', checkPermission('settings', 'view'), async (req, res) => {
    try {
        const templates = await CustomizationTemplate.findAll({ order: [['name', 'ASC']] });
        res.json(templates);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/master-data/customization-templates', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const { name, fields } = req.body;
        if (!name || !fields) return res.status(400).json({ error: 'Name and fields are required.' });
        
        const existing = await CustomizationTemplate.findOne({ where: { name: name.trim() } });
        if (existing) return res.status(400).json({ error: 'A template with this name already exists.' });

        const record = await CustomizationTemplate.create(req.body);
        await clearCache(['master-data']);
        res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/master-data/customization-templates/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        const [n] = await CustomizationTemplate.update(req.body, { where: { template_id: req.params.id } });
        if (!n) return res.status(404).json({ error: 'Not found' });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/master-data/customization-templates/:id', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        await CustomizationTemplate.destroy({ where: { template_id: req.params.id } });
        await clearCache(['master-data']);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Clear All Cache ───────────────────────────────────────────────────────────
// POST /api/admin/clear-cache
// Flushes every known cache pattern from Redis.
router.post('/clear-cache', checkPermission('settings', 'edit'), async (req, res) => {
    try {
        if (!redisClient.isOpen) {
            return res.status(503).json({ error: 'Redis is not connected. Cache cannot be cleared.' });
        }

        // Collect every key in Redis and delete all, or clear known patterns
        const allKeys = await redisClient.keys('*');
        if (allKeys.length > 0) {
            await redisClient.del(allKeys);
        }

        console.log(`[ClearCache] Flushed ${allKeys.length} key(s) from Redis.`);
        return res.json({ success: true, clearedKeys: allKeys.length });
    } catch (err) {
        console.error('[ClearCache] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── Delete Product Media from R2 ──────────────────────────────────────────────
// DELETE /api/admin/delete-media
// Deletes original media file and its related web-optimized version (_web.mp4 or .webp) from R2.
router.delete('/delete-media', checkPermission('products', 'edit'), async (req, res) => {
    try {
        const { fileUrl } = req.body;
        if (!fileUrl) {
            return res.status(400).json({ error: 'fileUrl is required' });
        }

        let fileKey = '';
        try {
            const urlObj = new URL(fileUrl);
            fileKey = decodeURIComponent(urlObj.pathname.substring(1));
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        if (!fileKey) {
            return res.status(400).json({ error: 'Could not extract file key from URL' });
        }

        const { webpKey, webVideoKey } = require('../utils/webAssets');
        const path = require('path');
        const ext = path.extname(fileKey).toLowerCase();
        
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp', '.webp'];
        const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

        const keysToDelete = [{ Key: fileKey }];

        if (imageExts.includes(ext)) {
            const webp = webpKey(fileKey);
            if (webp && webp !== fileKey) {
                keysToDelete.push({ Key: webp });
            }
        } else if (videoExts.includes(ext)) {
            const webVideo = webVideoKey(fileKey);
            if (webVideo && webVideo !== fileKey) {
                keysToDelete.push({ Key: webVideo });
            }
        }

        await publicS3.send(new DeleteObjectsCommand({
            Bucket: process.env.R2_PUBLIC_BUCKET,
            Delete: { Objects: keysToDelete, Quiet: true },
        }));

        console.log(`[Storage Cleanup] Deleted product media keys:`, keysToDelete.map(k => k.Key));

        return res.json({ success: true, message: 'Media files deleted successfully from R2.' });
    } catch (err) {
        console.error('[DeleteProductMedia] Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;

