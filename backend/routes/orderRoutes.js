const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, Cart, CartItem, Payment, Coupon, CouponUsage, OrderTimeline, User } = require('../models');
const auth = require('../middleware/authMiddleware');
const { signCustomizationData, signCustomizationUrl } = require('../utils/s3Utils');
const { sendOrderConfirmationEmail } = require('../utils/orderMailer');

// Get User Orders
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
        // Sign customization URLs
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
        console.error('Get Orders Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/orders/:id — Single order detail for customer
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { order_id: req.params.id, user_id: req.user.id },
            include: [{
                model: OrderItem,
                as: 'items',
                attributes: ['order_item_id', 'quantity', 'price_at_purchase', 'customization', 'delivery_status', 'delivery_link', 'delivered_at', 'download_expires_at'],
                include: [{ model: Product, as: 'product', attributes: ['products_id', 'title', 'thumbnail', 'images'] }]
            }]
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        const plainOrder = order.get({ plain: true });
        if (plainOrder.items) {
            plainOrder.items = await Promise.all(plainOrder.items.map(async item => {
                if (item.customization) item.customization = await signCustomizationData(item.customization);
                if (item.delivery_link) item.delivery_link = await signCustomizationUrl(item.delivery_link);
                return item;
            }));
        }
        res.json(plainOrder);
    } catch (err) {
        console.error('[Order Detail Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id/timeline — Customer-facing timeline (status labels only, no internal notes)
router.get('/:id/timeline', auth, async (req, res) => {
    try {
        // Verify the order belongs to this user
        const order = await Order.findOne({ where: { order_id: req.params.id, user_id: req.user.id } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const timeline = await OrderTimeline.findAll({
            where: { order_id: req.params.id },
            attributes: ['timeline_id', 'action', 'status_label', 'notes', 'event_at'],
            order: [['event_at', 'ASC']]
        });
        res.json(timeline);
    } catch (err) {
        console.error('[Timeline Error]', err);
        res.status(500).json({ error: err.message });
    }
});


const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay Order
// Create Razorpay Order
router.post('/create-payment', auth, async (req, res) => {
    try {
        const { couponCode } = req.body;

        const cart = await Cart.findOne({
            where: { user_id: req.user.id },
            include: [{ model: CartItem, as: 'items', include: ['product'] }]
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ msg: 'Empty cart' });
        }

        let total = 0;
        cart.items.forEach(item => {
            total += (item.product.price || 0) * (item.quantity || 1);
        });

        // --- COUPON LOGIC ---
        let finalAmount = total;
        if (couponCode) {
            const coupon = await Coupon.findOne({ where: { code: couponCode } });
            if (coupon) {
                // Double check validity
                const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
                const isLimitReached = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
                const isMinAmountFailed = coupon.min_order_value && total < coupon.min_order_value;

                let isUserLimitReached = false;
                if (coupon.per_user_limit) {
                    const userUsageCount = await CouponUsage.count({
                        where: { coupon_id: coupon.coupon_id, user_id: req.user.id }
                    });
                    if (userUsageCount >= coupon.per_user_limit) isUserLimitReached = true;
                }

                if (!isExpired && !isLimitReached && !isMinAmountFailed && !isUserLimitReached) {
                    let discountAmount = 0;
                    if (coupon.discount_type === 'percentage') {
                        discountAmount = Math.round((total * coupon.value) / 100);
                    } else {
                        discountAmount = coupon.value;
                    }
                    if (discountAmount > total) discountAmount = total;

                    finalAmount = total - discountAmount;
                }
            }
        }

        const options = {
            amount: finalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.json({
            key: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            id: order.id // Razorpay Order ID
        });
    } catch (err) {
        console.error('Create Payment Error:', err);
        res.status(500).send('Server Error');
    }
});

// Verify Payment & Create Order
// Verify Payment & Create Order
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, couponCode } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ msg: 'Invalid signature' });
        }

        // Payment Verified - Start Transaction
        const t = await require('../config/database').transaction();

        try {
            const cart = await Cart.findOne({
                where: { user_id: req.user.id },
                include: [{ model: CartItem, as: 'items', include: ['product'] }],
                transaction: t
            });

            if (!cart) {
                await t.rollback();
                return res.status(400).json({ msg: 'Cart not found' });
            }

            let total = 0;
            cart.items.forEach(item => total += (item.product.price || 0) * (item.quantity || 1));

            // --- COUPON RE-CALCULATION FOR RECORDING ---
            let finalAmount = total;
            let discountAmount = 0;
            let appliedCoupon = null;

            if (couponCode) {
                const coupon = await Coupon.findOne({ where: { code: couponCode }, transaction: t }); // Use transaction here
                if (coupon) {
                    const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
                    const isLimitReached = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
                    const isMinAmountFailed = coupon.min_order_value && total < coupon.min_order_value;

                    let isUserLimitReached = false;
                    if (coupon.per_user_limit) {
                        const userUsageCount = await CouponUsage.count({
                            where: { coupon_id: coupon.coupon_id, user_id: req.user.id },
                            transaction: t
                        });
                        if (userUsageCount >= coupon.per_user_limit) isUserLimitReached = true;
                    }

                    if (!isExpired && !isLimitReached && !isMinAmountFailed && !isUserLimitReached) {
                        if (coupon.discount_type === 'percentage') {
                            discountAmount = Math.round((total * coupon.value) / 100);
                        } else {
                            discountAmount = coupon.value;
                        }
                        if (discountAmount > total) discountAmount = total;

                        finalAmount = total - discountAmount;
                        appliedCoupon = coupon;
                    }
                }
            }

            // 1. Create Final Order
            const order = await Order.create({
                user_id: req.user.id,
                total_amount: finalAmount,
                discount_amount: discountAmount,
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                status: 'paid',
                viewed_by_admin: false
            }, { transaction: t });

            // 2. Coupon Usage Tracking
            if (appliedCoupon) {
                await CouponUsage.create({
                    coupon_id: appliedCoupon.coupon_id,
                    user_id: req.user.id,
                    order_id: order.order_id
                }, { transaction: t });

                await appliedCoupon.increment('used_count', { transaction: t });
            }

            // 3. Create Order Items
            await Promise.all(cart.items.map(item =>
                OrderItem.create({
                    order_id: order.order_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_at_purchase: item.product.price,
                    customization: item.customization
                }, { transaction: t })
            ));

            // 4. Create Payment Record
            await Payment.create({
                user_id: req.user.id,
                order_id: order.order_id,
                amount: finalAmount,
                mode: 'razorpay',
                status: 'success',
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            }, { transaction: t });

            // 5. Log ORDER_PLACED into the timeline (seeds the audit trail)
            await OrderTimeline.create({
                order_id: order.order_id,
                admin_id: null,
                actor_name: null,
                actor_role: null,
                action: 'ORDER_PLACED',
                status_label: 'Order Placed',
                notes: `Payment of ₹${finalAmount.toLocaleString()} confirmed via Razorpay.`,
                event_at: new Date(),
            }, { transaction: t });

            // 6. Clear Cart
            await CartItem.destroy({
                where: { cart_id: cart.cart_id },
                transaction: t
            });

            await t.commit();

            // 7. Send confirmation email to customer
            const user = await User.findByPk(req.user.id);
            if (user && user.email) {
                sendOrderConfirmationEmail({
                    to: user.email,
                    name: user.first_name,
                    orderId: order.order_id,
                    orderRef: order.order_id.substring(0, 8).toUpperCase(),
                    totalAmount: finalAmount
                }).catch(mailErr => {
                    console.error('[Order Placement Mail Error]', mailErr.message);
                });
            }

            res.json({
                msg: 'Payment verified and order placed successfully',
                orderId: order.order_id
            });

        } catch (error) {
            await t.rollback();
            throw error;
        }

    } catch (err) {
        console.error('Verify Payment Error:', err);
        res.status(500).send('Server Error: Payment verification failed.');
    }
});

// --- TIME-LIMITED DOWNLOAD ROUTE (7 Days) ---
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { privateS3 } = require('../config/s3Client');


router.get('/items/:itemId/download', auth, async (req, res) => {
    try {
        const orderItem = await OrderItem.findByPk(req.params.itemId, {
            include: [{ model: Order, as: 'order' }]
        });

        if (!orderItem) return res.status(404).json({ msg: 'Item not found' });

        // 1. Verify Ownership
        if (orderItem.order.user_id !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // 2. Verify Delivery Status
        if (orderItem.delivery_status !== 'delivered' || !orderItem.delivery_link) {
            return res.status(400).json({ msg: 'Item not delivered yet' });
        }

        // 3. Check 7-Day Expiration
        if (!orderItem.delivered_at) {
            // Legacy handling or just delivered
        }

        const deliveredAt = new Date(orderItem.delivered_at || orderItem.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now - deliveredAt);
        const diffSeconds = Math.ceil(diffTime / 1000);

        // CONFIGURATION: 30-day download window
        const MAX_DOWNLOAD_WINDOW_SECONDS = 2592000; // 30 Days in Seconds

        if (diffSeconds > MAX_DOWNLOAD_WINDOW_SECONDS) {
            return res.status(403).json({
                msg: 'Download link expired',
                expired: true,
                expiredAt: orderItem.download_expires_at || null,
                reason: 'The 30-day download window for this item has closed.'
            });
        }

        // 4. Generate Presigned URL from private R2 bucket
        const urlObj = new URL(orderItem.delivery_link);
        let key = decodeURIComponent(urlObj.pathname.substring(1));

        // Strip bucket name prefix if present (legacy B2 format)
        const privateBucket = process.env.R2_PRIVATE_BUCKET;
        if (key.startsWith(`${privateBucket}/`)) {
            key = key.replace(`${privateBucket}/`, '');
        }

        const command = new GetObjectCommand({
            Bucket: process.env.R2_PRIVATE_BUCKET,
            Key: key,
            ResponseContentDisposition: 'attachment'
        });

        // URL Expiry: 1 hour (SigV4 presigned URLs max out at 7 days; 30-day
        // access window is enforced by download_expires_at check above).
        const signedUrl = await getSignedUrl(privateS3, command, { expiresIn: 3600 });

        res.json({
            url: signedUrl,
            download_expires_at: orderItem.download_expires_at || null,
        });

    } catch (err) {
        console.error('Download Error:', err);
        res.status(500).send('Server Error');
    }
});

// GET /api/orders/items/:itemId/view — inline presigned URL (no attachment disposition)
router.get('/items/:itemId/view', auth, async (req, res) => {
    try {
        const orderItem = await OrderItem.findOne({
            where: { order_item_id: req.params.itemId },
            include: [{ model: Order, as: 'order' }]
        });

        if (!orderItem) return res.status(404).json({ msg: 'Item not found' });
        if (orderItem.order.user_id !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
        if (orderItem.delivery_status !== 'delivered' || !orderItem.delivery_link) {
            return res.status(400).json({ msg: 'Item not delivered yet' });
        }

        const deliveredAt = new Date(orderItem.delivered_at || orderItem.updatedAt);
        const diffSeconds = Math.ceil(Math.abs(new Date() - deliveredAt) / 1000);
        if (diffSeconds > 2592000) {
            return res.status(403).json({ msg: 'Download link expired', expired: true });
        }

        const urlObj = new URL(orderItem.delivery_link);
        let key = decodeURIComponent(urlObj.pathname.substring(1));
        const privateBucket = process.env.R2_PRIVATE_BUCKET;
        if (key.startsWith(`${privateBucket}/`)) key = key.replace(`${privateBucket}/`, '');

        // No ResponseContentDisposition — browser will render inline
        const command = new GetObjectCommand({ Bucket: privateBucket, Key: key });
        const signedUrl = await getSignedUrl(privateS3, command, { expiresIn: 3600 });

        const ext = key.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

        res.json({ url: signedUrl, ext, isVideo, isImage, download_expires_at: orderItem.download_expires_at });
    } catch (err) {
        console.error('View Error:', err);
        res.status(500).send('Server Error');
    }
});

// PUBLIC TRACKING ROUTE (For Zoho Bot)
router.get('/public/track', async (req, res) => {
    try {
        const { orderId, email } = req.query;
        if (!orderId || !email) return res.status(400).json({ error: 'Order ID and Email required' });

        const User = require('../models/User');
        const order = await Order.findOne({
            where: { order_id: orderId },
            include: [
                { model: User, as: 'user', where: { email: email.toLowerCase().trim() }, attributes: ['email', 'name'] },
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['title'] }] }
            ]
        });

        if (!order) return res.status(404).json({ error: 'Order not found or email mismatch' });

        res.json({
            status: order.status,
            total: order.total_amount,
            date: order.createdAt,
            items: order.items.map(i => i.product.title).join(', ')
        });
    } catch (err) {
        console.error('[Public Tracking Error]', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
