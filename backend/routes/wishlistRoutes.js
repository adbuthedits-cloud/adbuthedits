const express = require('express');
const router = express.Router();
const { Wishlist, Product, CartItem, Cart } = require('../models');
const auth = require('../middleware/authMiddleware');
const { signCustomizationData, deleteCustomizationMedia } = require('../utils/s3Utils');

// Get User's Wishlist with Product details
router.get('/', auth, async (req, res) => {
    try {
        const wishlist = await Wishlist.findAll({
            where: { user_id: req.user.id },
            include: [{
                model: Product,
                as: 'product'
            }]
        });

        // Map records to include customization on the product object for frontend compatibility
        const items = await Promise.all(wishlist.map(async (item) => {
            const plainProduct = item.product.get({ plain: true });
            
            // Attach wishlist-specific metadata
            plainProduct.wishlist_id = item.wishlist_id;
            
            if (item.customization) {
                plainProduct.wishlist_customization = await signCustomizationData(item.customization);
            }
            
            return plainProduct;
        }));

        res.json(items);
    } catch (err) {
        console.error('Get Wishlist Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Check if a specific product is in the wishlist
router.get('/check/:product_id', auth, async (req, res) => {
    try {
        const item = await Wishlist.findOne({
            where: {
                user_id: req.user.id,
                product_id: req.params.product_id
            }
        });
        res.json({ isWishlisted: !!item });
    } catch (err) {
        console.error('Check Wishlist Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Add to Wishlist
router.post('/', auth, async (req, res) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({ msg: 'Product ID is required' });
        }

        // 1. Validation: Check if product exists
        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        // 2. Check if already in wishlist
        const existingItem = await Wishlist.findOne({
            where: {
                user_id: req.user.id,
                product_id: product_id
            }
        });

        if (existingItem) {
            return res.status(400).json({ msg: 'Already added to wishlist' });
        }

        // 3. Create new wishlist entry
        const newItem = await Wishlist.create({
            user_id: req.user.id,
            product_id: product_id
        });

        res.status(201).json({ msg: 'Added to wishlist', item: newItem });
    } catch (err) {
        console.error('Add to Wishlist Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Remove from Wishlist
router.delete('/:id', auth, async (req, res) => {
    try {
        const product_id = req.params.id;
        
        // --- CLOUD MEDIA CLEANUP ---
        // Find items to delete their media first
        const itemsToDelete = await Wishlist.findAll({
            where: {
                user_id: req.user.id,
                product_id: product_id
            }
        });

        for (const item of itemsToDelete) {
            if (item.customization) {
                await deleteCustomizationMedia(item.customization);
            }
        }

        const result = await Wishlist.destroy({
            where: {
                user_id: req.user.id,
                product_id: product_id
            }
        });

        if (result === 0) {
            return res.status(404).json({ msg: 'Item not found in wishlist' });
        }

        res.json({ msg: 'Removed from wishlist' });
    } catch (err) {
        console.error('Remove from Wishlist Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Move item from Cart to Wishlist
router.post('/from-cart/:cartItemId', auth, async (req, res) => {
    try {
        const cartItem = await CartItem.findOne({
            where: { cart_item_id: req.params.cartItemId },
            include: [{
                model: Cart,
                as: 'cart',
                where: { user_id: req.user.id }
            }]
        });

        if (!cartItem) {
            return res.status(404).json({ msg: 'Cart item not found' });
        }

        // Create wishlist entry with customization
        const wishItem = await Wishlist.create({
            user_id: req.user.id,
            product_id: cartItem.product_id,
            customization: cartItem.customization
        });

        // Delete from cart WITHOUT cloud cleanup (since files are now used by wishlist)
        // We use CartItem.destroy directly to bypass any hooks that might trigger cloud deletion
        await cartItem.destroy();

        res.json({ msg: 'Moved to wishlist successfully', item: wishItem });
    } catch (err) {
        console.error('Move to Wishlist Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
