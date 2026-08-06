const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { SystemSetting } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { publicS3 } = require('../config/s3Client');
const { getBrandLogoUrl, clearBrandLogoCache } = require('../utils/brandSettings');
const { executeOptimization, webpKey } = require('../utils/webAssets');

const publicFileUrl = (key) => {
    const domain = (process.env.R2_PUBLIC_CUSTOM_DOMAIN || '').replace(/\/$/, '');
    return domain ? `${domain}/${key}` : `https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/${key}`;
};

const logoStorage = multerS3({
    s3: publicS3,
    bucket: process.env.R2_PUBLIC_BUCKET || 'adbuth-public',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: 'public, max-age=31536000, immutable',
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'brand/logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadLogoMulter = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max logo size
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Logo image must be PNG, JPG, WEBP, SVG or GIF.'), false);
        }
    }
});

// GET /api/settings/public
// Get public settings like maintenance mode & brand logo (no auth required)
router.get('/public', async (req, res) => {
    try {
        const maintenanceSetting = await SystemSetting.findByPk('maintenance_mode');
        const isMaintenance = maintenanceSetting ? maintenanceSetting.setting_value === true : false;
        
        const logoUrl = await getBrandLogoUrl();

        res.json({
            maintenance_mode: isMaintenance,
            brand_logo: logoUrl
        });
    } catch (err) {
        console.error('[Public Settings Error]', err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/settings/upload-logo
// Upload a new brand logo image to Cloudflare R2 / public storage (Admin only)
router.post('/upload-logo', authMiddleware, adminMiddleware, uploadLogoMulter.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No logo file provided.' });
        }

        let finalKey = req.file.key;

        // Compress logo image to WebP using webAssets module (same module as Media Manager)
        if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
            const expectedWebp = webpKey(req.file.key);
            if (expectedWebp !== req.file.key) {
                console.log(`[Upload Logo] Compressing ${req.file.key} to WebP: ${expectedWebp}...`);
                const optimizedKey = await executeOptimization(req.file.key, req.file.mimetype);
                if (optimizedKey) {
                    finalKey = optimizedKey;
                }
            }
        }

        const logoUrl = publicFileUrl(finalKey);

        // Update system setting
        let setting = await SystemSetting.findByPk('brand_logo');
        if (setting) {
            setting.setting_value = logoUrl;
            await setting.save();
        } else {
            await SystemSetting.create({
                setting_key: 'brand_logo',
                setting_value: logoUrl,
                description: 'Active Brand Logo URL'
            });
        }

        clearBrandLogoCache();

        res.json({
            success: true,
            msg: 'Brand logo uploaded and updated successfully!',
            logo_url: logoUrl
        });
    } catch (err) {
        console.error('[Upload Logo Error]', err);
        res.status(500).json({ msg: err.message || 'Failed to upload brand logo.' });
    }
});

// GET /api/settings
// Get all settings (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const settings = await SystemSetting.findAll();
        res.json(settings);
    } catch (err) {
        console.error('[Get Settings Error]', err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/settings/:key
// Update a specific setting (Admin only)
router.put('/:key', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;

        let setting = await SystemSetting.findByPk(key);
        
        if (setting) {
            setting.setting_value = value;
            if (description) setting.description = description;
            await setting.save();
        } else {
            setting = await SystemSetting.create({
                setting_key: key,
                setting_value: value,
                description: description || `Auto-created setting for ${key}`
            });
        }

        if (key === 'brand_logo') {
            clearBrandLogoCache();
        }

        res.json({ msg: 'Setting updated successfully', setting });
    } catch (err) {
        console.error('[Update Setting Error]', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
