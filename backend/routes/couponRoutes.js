const express = require('express');
const router = express.Router();
const { Coupon, CouponUsage, Order, Product } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/authMiddleware');

// GET /api/coupons/popup - Get all active promos for the storefront popup
router.get('/popup', async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.findAll({
            where: {
                is_active: true,
                show_on_popup: true,
                [Op.or]: [
                    { start_date: null },
                    { start_date: { [Op.lte]: now } }
                ],
                [Op.or]: [
                    { expiration_date: null },
                    { expiration_date: { [Op.gt]: now } }
                ]
            },
            order: [['createdAt', 'DESC']],
            limit: 5 // Allow up to 5 promos in the popup carousel
        });

        // Filter out coupons where global usage limit is reached
        const validCoupons = coupons.filter(c => {
            if (c.usage_limit && c.used_count >= c.usage_limit) return false;
            return true;
        });

        res.json({
            success: true,
            coupons: validCoupons.map(coupon => ({
                coupon_id: coupon.coupon_id,
                code: coupon.code,
                title: coupon.popup_title,
                message: coupon.popup_message,
                discount_type: coupon.discount_type,
                value: coupon.value,
                media_url: coupon.media_url,
                media_type: coupon.media_type,
                updated_at: coupon.updatedAt
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/coupons/product/:id/offers - Get available offers for a specific product
router.get('/product/:id/offers', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findByPk(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const now = new Date();
        const coupons = await Coupon.findAll({
            where: {
                is_active: true,
                [Op.or]: [
                    { start_date: null },
                    { start_date: { [Op.lte]: now } }
                ],
                [Op.or]: [
                    { expiration_date: null },
                    { expiration_date: { [Op.gt]: now } }
                ]
            }
        });

        // Filter coupons that are valid for this specific product
        const eligibleCoupons = coupons.filter(coupon => {
            // 1. Check Global Usage
            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return false;

            // 2. Exclusion Check (High Priority)
            if (coupon.excluded_products?.includes(productId)) return false;
            if (coupon.excluded_asset_sub_categories?.includes(product.asset_sub_category_id)) return false;
            if (coupon.excluded_asset_categories?.includes(product.asset_category_id)) return false;
            if (coupon.excluded_categories?.includes(product.parent_category_id)) return false;

            // 3. Inclusion Check
            const hasInclusionRule = 
                (coupon.included_products?.length > 0) ||
                (coupon.included_asset_sub_categories?.length > 0) ||
                (coupon.included_asset_categories?.length > 0) ||
                (coupon.included_categories?.length > 0);

            if (!hasInclusionRule) return true; // Valid for everything if no inclusion rules

            if (coupon.included_products?.includes(productId)) return true;
            if (coupon.included_asset_sub_categories?.includes(product.asset_sub_category_id)) return true;
            if (coupon.included_asset_categories?.includes(product.asset_category_id)) return true;
            if (coupon.included_categories?.includes(product.parent_category_id)) return true;

            return false;
        });

        res.json(eligibleCoupons.map(c => ({
            code: c.code,
            discount_type: c.discount_type,
            value: c.value,
            min_order_value: c.min_order_value,
            max_discount_amount: c.max_discount_amount,
            expiration_date: c.expiration_date
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/coupons/validate - Ultimate Validation Waterfall
router.post('/validate', auth, async (req, res) => {
    try {
        const { code, totalAmount, cartItems } = req.body; 
        const userId = req.user.id;
        const now = new Date();

        if (!code) return res.status(400).json({ error: 'Coupon code is required' });

        const coupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });

        // 1. Existence
        if (!coupon) return res.status(404).json({ error: 'INVALID_CODE', message: 'Invalid coupon code' });

        // 2. Status & Timeline
        if (!coupon.is_active) return res.status(400).json({ error: 'INACTIVE', message: 'This coupon is currently inactive' });
        if (coupon.start_date && new Date(coupon.start_date) > now) return res.status(400).json({ error: 'NOT_STARTED', message: 'This campaign hasn\'t started yet' });
        if (coupon.expiration_date && new Date(coupon.expiration_date) < now) return res.status(400).json({ error: 'EXPIRED', message: 'This coupon has expired' });

        // 3. Global & User Usage
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return res.status(400).json({ error: 'USAGE_FULL', message: 'Usage limit reached' });
        if (coupon.per_user_limit) {
            const usageCount = await CouponUsage.count({ where: { coupon_id: coupon.coupon_id, user_id: userId } });
            if (usageCount >= coupon.per_user_limit) return res.status(400).json({ error: 'USER_LIMIT', message: 'You have already used this coupon' });
        }

        // 4. New User Only
        if (coupon.new_user_only) {
            const orderCount = await Order.count({ where: { user_id: userId, status: 'paid' } });
            if (orderCount > 0) return res.status(400).json({ error: 'NEW_USER_ONLY', message: 'For first-time customers only' });
        }

        // 5. Quantity Check
        if (coupon.min_items_count > 0 && cartItems?.length < coupon.min_items_count) {
            return res.status(400).json({ 
                error: 'MIN_ITEMS', 
                message: `Add at least ${coupon.min_items_count} items to your cart to use this coupon` 
            });
        }

        // 6. Minimum Order Value
        if (coupon.min_order_value && totalAmount < coupon.min_order_value) {
            return res.status(400).json({ 
                error: 'MIN_VALUE', 
                message: `Minimum order of ₹${coupon.min_order_value} required` 
            });
        }

        // 7. Granular Targeting (Inclusion/Exclusion)
        if (cartItems && Array.isArray(cartItems)) {
            // Check for EXCLUSIONS first (Any forbidden item blocks the whole coupon)
            for (const item of cartItems) {
                const isExcluded = 
                    coupon.excluded_products?.includes(item.product_id) ||
                    coupon.excluded_asset_sub_categories?.includes(item.asset_sub_category_id) ||
                    coupon.excluded_asset_categories?.includes(item.asset_category_id) ||
                    coupon.excluded_categories?.includes(item.parent_category_id);

                if (isExcluded) {
                    return res.status(400).json({ 
                        error: 'CATEGORY_EXCLUSION', 
                        message: 'One or more items in your cart are non-eligible for this coupon' 
                    });
                }
            }

            // Check for INCLUSIONS (At least one item must match)
            const hasInclusionRule = 
                (coupon.included_products?.length > 0) ||
                (coupon.included_asset_sub_categories?.length > 0) ||
                (coupon.included_asset_categories?.length > 0) ||
                (coupon.included_categories?.length > 0);

            if (hasInclusionRule) {
                const hasMatch = cartItems.some(item => 
                    coupon.included_products?.includes(item.product_id) ||
                    coupon.included_asset_sub_categories?.includes(item.asset_sub_category_id) ||
                    coupon.included_asset_categories?.includes(item.asset_category_id) ||
                    coupon.included_categories?.includes(item.parent_category_id)
                );

                if (!hasMatch) {
                    return res.status(400).json({ 
                        error: 'CATEGORY_INCLUSION', 
                        message: 'This coupon is not valid for the items in your cart' 
                    });
                }
            }
        }

        // 8. Discount Calculation
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = Math.round((totalAmount * coupon.value) / 100);
            if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
                discount = coupon.max_discount_amount;
            }
        } else {
            discount = coupon.value;
        }

        if (discount > totalAmount) discount = totalAmount;

        res.json({
            valid: true,
            code: coupon.code,
            discount,
            type: coupon.discount_type,
            value: coupon.value,
            max_cap_applied: coupon.discount_type === 'percentage' && coupon.max_discount_amount && discount === coupon.max_discount_amount
        });

    } catch (err) {
        console.error('Coupon Validation Error:', err);
        res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
    }
});

// GET /api/coupons/available
router.get('/available', auth, async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.findAll({
            where: {
                is_active: true,
                [Op.or]: [
                    { start_date: null },
                    { start_date: { [Op.lte]: now } }
                ],
                [Op.or]: [
                    { expiration_date: null },
                    { expiration_date: { [Op.gt]: now } }
                ]
            }
        });

        const validCoupons = coupons.filter(c => {
            if (c.usage_limit && c.used_count >= c.usage_limit) return false;
            return true;
        });

        res.json(validCoupons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
