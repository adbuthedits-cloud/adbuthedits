require('dotenv').config();
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

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/enquiries', enquiryRoutes);

// Database connection and server start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Initialize user uploads cleanup on startup
        cleanupUserUploads();

        // Start BullMQ workers for order workflow & email throttling
        startWorkers().catch(err => console.error('[Workers] Startup error:', err));

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

// Trigger restart
startServer();