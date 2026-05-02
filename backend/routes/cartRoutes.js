const express = require('express');
const router = express.Router();
const { Cart, CartItem, Product, Wishlist, Category, AssetCategory, AssetSubCategory } = require('../models');
const auth = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');
const multerS3 = require('multer-s3');
const { privateS3 } = require('../config/s3Client');
const { getPrivateSignedUrl, signCustomizationData, deleteCustomizationMedia } = require('../utils/s3Utils');

// Security: Allowed Media Types (Whitelist)
const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'
];

const userUploadStorage = multerS3({
    s3: privateS3,
    bucket: process.env.R2_PRIVATE_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        // Organize by User ID
        const userId = req.user?.id || 'anonymous';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        cb(null, `user-uploads/${userId}/${filename}`);
    }
});

const userUpload = multer({
    storage: userUploadStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only photos and videos are allowed.'), false);
        }
    }
});

// Sanitization Helper: Strip HTML tags to prevent XSS
const sanitizeCustomization = (data) => {
    if (typeof data === 'string') {
        return data.replace(/<[^>]*>?/gm, ''); // Basic HTML tag stripping
    } else if (Array.isArray(data)) {
        return data.map(i => sanitizeCustomization(i));
    } else if (data !== null && typeof data === 'object') {
        const clean = {};
        for (const [key, value] of Object.entries(data)) {
            clean[key] = sanitizeCustomization(value);
        }
        return clean;
    }
    return data;
};

// Upload Media for Customization → PRIVATE BUCKET
router.post('/upload-media', auth, userUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        // Storage Key
        const key = req.file.key;
        
        // Permanent Private URL (to save in DB)
        const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
        const privateUrl = `${R2_ENDPOINT}/${process.env.R2_PRIVATE_BUCKET}/${key}`;

        // Temporary Signed URL for frontend preview (expires in 1 hour)
        const signedUrl = await getPrivateSignedUrl(key);

        res.json({ url: privateUrl, previewUrl: signedUrl });
    } catch (err) {
        console.error('[Upload] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get User Cart
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    include: [
                        { model: Category, as: 'parentCategory' },
                        { model: AssetCategory, as: 'assetCategory' },
                        { model: AssetSubCategory, as: 'assetSubCategory' }
                    ]
                }]
            }]
        });

        if (!cart) {
            return res.json({ items: [] });
        }

        // Sign customization URLs for each item
        const plainCart = cart.get({ plain: true });
        if (plainCart.items) {
            plainCart.items = await Promise.all(plainCart.items.map(async (item) => {
                if (item.customization) {
                    item.customization = await signCustomizationData(item.customization);
                }
                return item;
            }));
        }

        res.json(plainCart);
    } catch (err) {
        console.error('Get Cart Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Add to Cart
router.post('/', auth, async (req, res) => {
    try {
        const { product_id, quantity, customization } = req.body;

        if (!product_id) {
            return res.status(400).json({ msg: 'Product ID is required' });
        }

        // 1. Validation: Check if product exists
        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        // 2. Ensure user has a cart
        let cart = await Cart.findOne({ where: { user_id: req.user.id } });
        if (!cart) {
            cart = await Cart.create({ user_id: req.user.id });
        }

        // 3. Create items
        // If customization is an array, we create multiple entries (one for each item)
        if (Array.isArray(customization)) {
            const items = await Promise.all(customization.map(cust =>
                CartItem.create({
                    cart_id: cart.cart_id,
                    product_id,
                    quantity: 1, 
                    customization: sanitizeCustomization(cust)
                })
            ));
            
            const signedItems = await Promise.all(items.map(async (item) => {
                const plainItem = item.get({ plain: true });
                plainItem.customization = await signCustomizationData(plainItem.customization);
                return plainItem;
            }));
            
            res.status(201).json(signedItems);
        } else {
            const newItem = await CartItem.create({
                cart_id: cart.cart_id,
                product_id,
                quantity: quantity || 1,
                customization: sanitizeCustomization(customization || {})
            });
            
            const plainItem = newItem.get({ plain: true });
            plainItem.customization = await signCustomizationData(plainItem.customization);
            
            res.status(201).json(plainItem);
        }
    } catch (err) {
        console.error('Add to Cart Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Move item from Wishlist to Cart
router.post('/from-wishlist/:wishlistId', auth, async (req, res) => {
    try {
        const wishItem = await Wishlist.findOne({
            where: {
                wishlist_id: req.params.wishlistId,
                user_id: req.user.id
            }
        });

        if (!wishItem) {
            return res.status(404).json({ msg: 'Wishlist item not found' });
        }

        // 1. Ensure user has a cart
        let cart = await Cart.findOne({ where: { user_id: req.user.id } });
        if (!cart) {
            cart = await Cart.create({ user_id: req.user.id });
        }

        // 2. Create Cart Item with preserved customization
        const newItem = await CartItem.create({
            cart_id: cart.cart_id,
            product_id: wishItem.product_id,
            quantity: 1,
            customization: wishItem.customization // Already sanitized, raw URLs
        });

        // 3. Delete from Wishlist (without cloud cleanup)
        await wishItem.destroy();

        // 4. Return signed customization for frontend display
        const plainItem = newItem.get({ plain: true });
        if (plainItem.customization) {
            plainItem.customization = await signCustomizationData(plainItem.customization);
        }

        res.status(201).json({ msg: 'Moved to cart successfully', item: plainItem });
    } catch (err) {
        console.error('Move from Wishlist Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Update Cart Item (Customization)
router.put('/:id', auth, async (req, res) => {
    try {
        const cart_item_id = req.params.id;
        const { customization } = req.body;

        // Ensure the item belongs to the user's cart
        const item = await CartItem.findOne({
            where: { cart_item_id },
            include: [{
                model: Cart,
                as: 'cart',
                where: { user_id: req.user.id }
            }]
        });

        if (!item) {
            return res.status(404).json({ msg: 'Item not found in your cart' });
        }

        item.customization = sanitizeCustomization(customization);
        await item.save();

        const plainItem = item.get({ plain: true });
        plainItem.customization = await signCustomizationData(plainItem.customization);

        res.json(plainItem);
    } catch (err) {
        console.error('Update Cart Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Remove from Cart
router.delete('/:id', auth, async (req, res) => {
    try {
        const cart_item_id = req.params.id;

        // Ensure the item belongs to the user's cart
        const item = await CartItem.findOne({
            where: { cart_item_id },
            include: [{
                model: Cart,
                as: 'cart',
                where: { user_id: req.user.id }
            }]
        });

        if (!item) {
            return res.status(404).json({ msg: 'Item not found in your cart' });
        }

        // --- CLOUD MEDIA CLEANUP ---
        // If the item has customization media (photos/videos), delete them from R2
        if (item.customization) {
            // We pass the RAW data from the database (not the signed URLs)
            await deleteCustomizationMedia(item.customization);
        }

        await item.destroy();
        res.json({ msg: 'Item removed from cart' });
    } catch (err) {
        console.error('Remove from Cart Error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
