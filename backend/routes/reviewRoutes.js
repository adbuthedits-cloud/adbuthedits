const express = require('express');
const router = express.Router();
const { Review, User, Product, ReviewSetting, ReviewVote, Order, OrderItem } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const { Op, fn, col, literal } = require('sequelize');
const multer = require('multer');
const path = require('path');
const multerS3 = require('multer-s3');
const { publicS3 } = require('../config/s3Client');

// Helper: build public file URL from key
const publicUrl = (key) =>
    `${process.env.R2_PUBLIC_URL}/${key}`;

const upload = multer({
    storage: multerS3({
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
            const productId = req.body.products_id || 'general';
            const subfolder = file.mimetype.startsWith('video/') ? 'videos' : 'images';
            
            // Organized Public Path: reviews/{productId}/{subfolder}/{timestamp}_{filename}
            cb(null, `reviews/${productId}/${subfolder}/${uniqueSuffix}${ext}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only photos and videos are allowed for reviews.'), false);
        }
    }
});

// POST /api/reviews - Submit a review
router.post('/', authMiddleware, upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'videos', maxCount: 2 }
]), async (req, res) => {
    try {
        const { products_id, rating, comment } = req.body;
        const user_id = req.user.id;

        if (!products_id || !rating) {
            return res.status(400).json({ error: 'Product ID and Rating are required' });
        }

        // Verify user has purchased this product
        const purchase = await Order.findOne({
            where: {
                user_id,
                status: {
                    [Op.in]: ['paid', 'placed', 'inprocessing', 'delivered']
                }
            },
            include: [{
                model: OrderItem,
                as: 'items',
                where: { product_id: products_id }
            }]
        });

        if (!purchase) {
            return res.status(403).json({ error: 'You can only review products you have purchased.' });
        }

        // Build public URLs from R2 keys
        const images = req.files['images']
            ? req.files['images'].map(f => publicUrl(f.key))
            : [];
        const videos = req.files['videos']
            ? req.files['videos'].map(f => publicUrl(f.key))
            : [];

        const review = await Review.create({
            user_id,
            products_id,
            rating,
            comment,
            images,
            videos
        });

        // --- SEND THANK YOU EMAIL TO CUSTOMER ---
        const triggerThankYouEmail = async () => {
            try {
                const user = await User.findByPk(user_id);
                const product = await Product.findByPk(products_id);
                if (user && user.email && product) {
                    const { transporter, senders } = require('../utils/emailService');
                    const { getReviewThankYouTemplate } = require('../utils/emailTemplates');
                    
                    const templateHtml = await getReviewThankYouTemplate(user.first_name, product.title);
                    await transporter.sendMail({
                        from: `"Adbuth Support" <${senders.support}>`,
                        to: user.email,
                        subject: `Thank you for reviewing ${product.title}!`,
                        html: templateHtml
                    });
                    console.log(`[Review Email] Thank you mail sent to ${user.email}`);
                }
            } catch (mailErr) {
                console.error('[Review Email] Failed to send thank you mail:', mailErr.message);
            }
        };
        triggerThankYouEmail();

        // --- AUTOMATED REPLY LOGIC ---
        // We do this asynchronously after the response is sent
        const triggerAutoReply = async () => {
            try {
                const settings = await ReviewSetting.findOne();
                if (settings && settings.is_auto_reply_enabled) {
                    const delay = (settings.reply_delay_seconds || 3) * 1000;
                    
                    setTimeout(async () => {
                        const systemReply = {
                            id: require('crypto').randomUUID(),
                            user_id: null,
                            userName: 'Support Team',
                            role: 'system',
                            message: settings.auto_reply_text,
                            createdAt: new Date()
                        };
                        
                        // Update DB with the reply
                        await Review.update(
                            { 
                                replies: [systemReply],
                                unread_user: true 
                            }, 
                            { where: { review_id: review.review_id } }
                        );
                    }, delay);
                }
            } catch (replyErr) {
                console.error('[Review Auto-Reply] Failed to trigger:', replyErr);
            }
        };

        triggerAutoReply();

        res.status(201).json({ success: true, review });
    } catch (err) {
        console.error('[Review] Error submitting review:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews/:id/vote - Toggle or update helpful/unhelpful vote
router.post('/:id/vote', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { type, guest_id } = req.body; // 'helpful' or 'unhelpful'
        const user_id = req.user ? req.user.id : null;

        if (!['helpful', 'unhelpful'].includes(type)) {
            return res.status(400).json({ error: 'Invalid vote type. Must be "helpful" or "unhelpful"' });
        }

        if (!user_id && !guest_id) {
            return res.status(400).json({ error: 'User ID or Guest ID is required for voting' });
        }

        const review = await Review.findByPk(id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        // Logic for identifying the vote (by user or guest)
        // Consolidate into a single voter ID
        const activeVoterId = req.user ? String(req.user.id) : guest_id;

        if (!activeVoterId) {
            return res.status(400).json({ error: 'Identification required for voting' });
        }

        const existingVote = await ReviewVote.findOne({ 
            where: { 
                review_id: id, 
                user_id: activeVoterId 
            } 
        });

        if (existingVote) {
            if (existingVote.vote_type === type) {
                // Toggle off if clicking the same type
                await existingVote.destroy();
            } else {
                // Change mind if clicking different type
                existingVote.vote_type = type;
                await existingVote.save();
            }
        } else {
            // Create new vote using the consolidated voter ID
            await ReviewVote.create({
                review_id: id,
                user_id: activeVoterId,
                vote_type: type
            });
        }

        const finalWhere = { review_id: id, user_id: activeVoterId };

        // Aggregate counts from the ReviewVote table
        const counts = await ReviewVote.findAll({
            where: { review_id: id },
            attributes: [
                'vote_type',
                [fn('COUNT', col('vote_id')), 'count']
            ],
            group: ['vote_type'],
            raw: true
        });

        const helpful_count = parseInt(counts.find(c => c.vote_type === 'helpful')?.count || 0);
        const unhelpful_count = parseInt(counts.find(c => c.vote_type === 'unhelpful')?.count || 0);
        
        // Find current user's updated status
        const myVote = await ReviewVote.findOne({ where: finalWhere });

        res.status(200).json({ 
            success: true, 
            helpful_count, 
            unhelpful_count,
            my_vote: myVote ? myVote.vote_type : null
        });
    } catch (err) {
        console.error('[Review Vote] Error recording vote:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews/:id/reply - Customer adds a reply
router.post('/:id/reply', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message) return res.status(400).json({ error: 'Reply message is required' });

        const review = await Review.findByPk(id, {
            include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }]
        });
        if (!review) return res.status(404).json({ error: 'Review not found' });
        
        // Ensure user owns this review
        if (review.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to reply to this review' });
        }

        const customerReply = {
            id: require('crypto').randomUUID(),
            user_id: req.user.id,
            userName: `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim() || 'Customer',
            role: 'user',
            message,
            createdAt: new Date()
        };

        const updatedReplies = [...(review.replies || []), customerReply];
        review.replies = updatedReplies;
        review.unread_admin = true;
        await review.save();

        res.json({ success: true, replies: updatedReplies });
    } catch (err) {
        console.error('Customer Review Reply Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews/:id/read - Mark review as read by customer
router.post('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByPk(id);
        
        if (review && review.user_id === req.user.id) {
            review.unread_user = false;
            await review.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reviews/product/:productId - Get reviews for a product with stats
router.get('/product/:productId', optionalAuth, async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = page === 1 ? 2 : 10;
        const offset = (page === 1) ? 0 : 2 + (page - 2) * 10;

        const { count: totalReviews, rows: rawReviews } = await Review.findAndCountAll({
            where: { products_id: productId, status: 'approved' },
            include: [{
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Enrich reviews with vote counts
        const reviewIds = rawReviews.map(r => r.review_id);
        const voteStats = await ReviewVote.findAll({
            where: { review_id: reviewIds },
            attributes: [
                'review_id',
                'vote_type',
                [fn('COUNT', col('vote_id')), 'count']
            ],
            group: ['review_id', 'vote_type'],
            raw: true
        });

        const activeGuestId = req.query.guest_id || null;
        let userVotes = [];
        
        // Use optionalAuth effect if present
        const currentVoterId = req.user ? String(req.user.id) : activeGuestId;

        if (currentVoterId) {
            userVotes = await ReviewVote.findAll({
                where: { 
                    review_id: reviewIds, 
                    user_id: currentVoterId 
                },
                attributes: ['review_id', 'vote_type'],
                raw: true
            });
        }

        const reviews = rawReviews.map(review => {
            const revJson = review.toJSON();
            const revStats = voteStats.filter(s => s.review_id === revJson.review_id);
            revJson.helpful_count = parseInt(revStats.find(s => s.vote_type === 'helpful')?.count || 0);
            revJson.unhelpful_count = parseInt(revStats.find(s => s.vote_type === 'unhelpful')?.count || 0);
            
            const myVote = userVotes.find(v => v.review_id === revJson.review_id);
            revJson.my_vote = myVote ? myVote.vote_type : null;
            
            return revJson;
        });

        const stats = await Review.findAll({
            where: { products_id: productId, status: 'approved' },
            attributes: [
                'rating',
                [fn('COUNT', col('review_id')), 'count']
            ],
            group: ['rating'],
            raw: true
        });

        const allReviewsForRating = await Review.findAll({
            where: { products_id: productId, status: 'approved' },
            attributes: ['rating']
        });

        const overallTotalReviews = allReviewsForRating.length;
        const averageRating = overallTotalReviews > 0
            ? (allReviewsForRating.reduce((acc, r) => acc + r.rating, 0) / overallTotalReviews).toFixed(1)
            : 0;

        const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats.forEach(s => {
            starCounts[s.rating] = parseInt(s.count);
        });

        const totalPages = overallTotalReviews <= 2 ? 1 : 1 + Math.ceil((overallTotalReviews - 2) / 10);

        let hasPurchased = false;
        if (req.user) {
            const purchase = await Order.findOne({
                where: {
                    user_id: req.user.id,
                    status: {
                        [Op.in]: ['paid', 'placed', 'inprocessing', 'delivered']
                    }
                },
                include: [{
                    model: OrderItem,
                    as: 'items',
                    where: { product_id: productId }
                }]
            });
            if (purchase) hasPurchased = true;
        }

        res.json({
            success: true,
            averageRating: parseFloat(averageRating),
            totalReviews: overallTotalReviews,
            fetchedCount: reviews.length,
            totalPages,
            currentPage: page,
            starCounts,
            reviews,
            hasPurchased
        });
    } catch (err) {
        console.error('[Review] Error fetching reviews:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
