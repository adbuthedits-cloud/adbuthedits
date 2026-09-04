require('dotenv').config();

// ─── Global Error Guards ──────────────────────────────────────────────────────
// In production: log + exit so PM2/Docker can restart cleanly.
// In development: just log, keep running (handles Redis 5.x BullMQ warnings).
const IS_PROD = process.env.NODE_ENV === 'production';

process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err.message);
    if (IS_PROD) process.exit(1); // Let process manager restart
});
process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Rejection:', reason?.message || reason);
    if (IS_PROD) process.exit(1); // Let process manager restart
});
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const redisClient = require('./config/redisClient');
const cron = require('node-cron');
const cleanupUserUploads = require('./scripts/userUploadCleanup');
const { startWorkers } = require('./config/orderQueue');
const passport = require('./config/passport');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for secure cookies on Render/proxies
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with long-term caching (Expires headers)
const path = require('path');
const oneYear = 31536000000;
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: oneYear,
    immutable: true
}));
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: oneYear
}));

// Passport & Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'adbuth_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Schedule cleanup task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily system maintenance...');
    // Cleanup temporary user uploads
    cleanupUserUploads();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const blogRoutes = require('./routes/blogRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const seoRoutes = require('./routes/seoRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const settingRoutes = require('./routes/settingRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const fileManagerRoutes = require('./routes/fileManagerRoutes');
const otpRoutes = require('./routes/otpRoutes');
const sesRoutes = require('./routes/sesRoutes');
const { runSafeMigrations } = require('./utils/safeSync');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/file-manager', fileManagerRoutes);
app.use('/api/otp', otpRoutes);

// SES SNS Notification Webhook (must use raw body — registered separately)
app.use('/api/ses', sesRoutes);

// Database connection and server start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Run safe additive migrations (adds new columns/tables without dropping data)
        await runSafeMigrations();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

    // Initialize user uploads cleanup on startup
    try {
        cleanupUserUploads();
    } catch (err) {
        console.error('[Cleanup] Error during upload cleanup:', err.message);
    }

    // Start BullMQ workers — non-fatal if Redis is unavailable/incompatible
    try {
        await startWorkers();
        console.log('[Workers] BullMQ workers started successfully.');
    } catch (err) {
        console.warn(
            '[Workers] BullMQ workers could not start (Redis may be unavailable or version < 6.2):',
            err.message
        );
        console.warn('[Workers] Server will continue without background job processing.');
    }

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

// Trigger restart
startServer();