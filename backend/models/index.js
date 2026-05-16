const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Admin = require('./Admin');
const Role = require('./Role');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Wishlist = require('./Wishlist');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Blog = require('./Blog');
const Review = require('./Review');
const Coupon = require('./Coupon');
const Enquiry = require('./Enquiry');
const EnquiryReply = require('./EnquiryReply');
const CouponUsage = require('./CouponUsage');
const BlogCategory = require('./BlogCategory');
const ReviewSetting = require('./ReviewSetting');
const ReviewVote = require('./ReviewVote');

// --- NEW MASTER DATA MODELS ---
const SystemSetting = require('./SystemSetting');
const AssetType = require('./AssetType');
const AssetVariant = require('./AssetVariant');
const AssetCategory = require('./AssetCategory');
const AssetSubCategory = require('./AssetSubCategory');
const AssetOrientation = require('./AssetOrientation');
const ShopSetting = require('./ShopSetting');
const AdminSession = require('./AdminSession');
const OrderTimeline = require('./OrderTimeline');
const AuditLog = require('./AuditLog');
const Attribute = require('./Attribute');
const SeoPage = require('./SeoPage');
const CustomizationTemplate = require('./CustomizationTemplate');

// Association Setup

// Role <-> Admin (a role has many admins)
Role.hasMany(Admin, { foreignKey: 'role_id', as: 'members', constraints: false });
Admin.belongsTo(Role, { foreignKey: 'role_id', as: 'roleDetails', constraints: false });

// Enquiry <-> EnquiryReply
Enquiry.hasMany(EnquiryReply, { foreignKey: 'enquiry_id', as: 'replies', constraints: false });
EnquiryReply.belongsTo(Enquiry, { foreignKey: 'enquiry_id', as: 'enquiry', constraints: false });

// Blog <-> BlogCategory
BlogCategory.hasMany(Blog, { foreignKey: 'blog_category_id', as: 'blogs' });
Blog.belongsTo(BlogCategory, { foreignKey: 'blog_category_id', as: 'category' });

// User <-> Review
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Product <-> Review
Product.hasMany(Review, { foreignKey: 'products_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'products_id', as: 'product' });

// User <-> Cart
User.hasOne(Cart, { foreignKey: 'user_id', as: 'cart' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Wishlist
User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlistItems' });
Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Cart <-> CartItems
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });

// Order <-> OrderItems
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product <-> Items
Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cartEntries' });
CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderEntries' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product <-> Wishlist
Product.hasMany(Wishlist, { foreignKey: 'product_id', as: 'wishlistedBy' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User <-> Orders
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Payments
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order <-> Payment
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Categories <-> SubCategories (legacy, kept for blogs etc.)
Category.hasMany(SubCategory, { foreignKey: 'category_id', as: 'subcategories' });
SubCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// --- COUPON RELATIONSHIPS ---
Coupon.hasMany(CouponUsage, { foreignKey: 'coupon_id', as: 'usages' });
CouponUsage.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

User.hasMany(CouponUsage, { foreignKey: 'user_id', as: 'couponUsages' });
CouponUsage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.hasOne(CouponUsage, { foreignKey: 'order_id', as: 'couponUsage' });
CouponUsage.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// --- NEW MASTER DATA ASSOCIATIONS ---

// Category (parent: Digital Invitations / Greetings) <-> AssetCategory
Category.hasMany(AssetCategory, { foreignKey: 'parent_category_id', as: 'assetCategories' });
AssetCategory.belongsTo(Category, { foreignKey: 'parent_category_id', as: 'parentCategory' });

// AssetCategory <-> AssetSubCategory
AssetCategory.hasMany(AssetSubCategory, { foreignKey: 'asset_category_id', as: 'subCategories' });
AssetSubCategory.belongsTo(AssetCategory, { foreignKey: 'asset_category_id', as: 'assetCategory' });

// Product <-> Parent Category (Digital Invitations / Greetings)
Category.hasMany(Product, { foreignKey: 'parent_category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'parent_category_id', as: 'parentCategory' });

// Product <-> AssetType
AssetType.hasMany(Product, { foreignKey: 'asset_type_id', as: 'products' });
Product.belongsTo(AssetType, { foreignKey: 'asset_type_id', as: 'assetType' });

// Product <-> AssetVariant
AssetVariant.hasMany(Product, { foreignKey: 'asset_variant_id', as: 'products' });
Product.belongsTo(AssetVariant, { foreignKey: 'asset_variant_id', as: 'assetVariant' });

// Product <-> AssetCategory
AssetCategory.hasMany(Product, { foreignKey: 'asset_category_id', as: 'products' });
Product.belongsTo(AssetCategory, { foreignKey: 'asset_category_id', as: 'assetCategory' });

// Product <-> AssetSubCategory
AssetSubCategory.hasMany(Product, { foreignKey: 'asset_sub_category_id', as: 'products' });
Product.belongsTo(AssetSubCategory, { foreignKey: 'asset_sub_category_id', as: 'assetSubCategory' });

// Product <-> AssetOrientation
AssetOrientation.hasMany(Product, { foreignKey: 'asset_orientation_id', as: 'products' });
Product.belongsTo(AssetOrientation, { foreignKey: 'asset_orientation_id', as: 'assetOrientation' });

// --- REVIEW VOTE ASSOCIATIONS ---
Review.hasMany(ReviewVote, { foreignKey: 'review_id', as: 'votes' });
ReviewVote.belongsTo(Review, { foreignKey: 'review_id', as: 'review' });

User.hasMany(ReviewVote, { foreignKey: 'user_id', as: 'votes', constraints: false });
ReviewVote.belongsTo(User, { foreignKey: 'user_id', as: 'user', constraints: false });

// --- ADMIN SESSION ASSOCIATIONS ---
Admin.hasMany(AdminSession, { foreignKey: 'admin_id', as: 'sessions', constraints: false });
AdminSession.belongsTo(Admin, { foreignKey: 'admin_id', as: 'admin', constraints: false });

// --- ORDER TIMELINE ASSOCIATIONS ---
Order.hasMany(OrderTimeline, { foreignKey: 'order_id', as: 'timeline', constraints: false });
OrderTimeline.belongsTo(Order, { foreignKey: 'order_id', as: 'order', constraints: false });
Admin.hasMany(OrderTimeline, { foreignKey: 'admin_id', as: 'timelineEntries', constraints: false });
OrderTimeline.belongsTo(Admin, { foreignKey: 'admin_id', as: 'actor', constraints: false });

// Order -> assigned Admin
Order.belongsTo(Admin, { foreignKey: 'assigned_to', as: 'assignedEmployee', constraints: false });
Admin.hasMany(Order, { foreignKey: 'assigned_to', as: 'assignedOrders', constraints: false });

module.exports = {
    sequelize,
    User,
    Admin,
    Role,
    Category,
    SubCategory,
    Product,
    Cart,
    CartItem,
    Wishlist,
    Order,
    OrderItem,
    Payment,
    Blog,
    Review,
    Coupon,
    Enquiry,
    EnquiryReply,
    CouponUsage,
    BlogCategory,
    // New master data models
    AssetType,
    AssetVariant,
    AssetCategory,
    AssetSubCategory,
    AssetOrientation,
    ShopSetting,
    SystemSetting,
    ReviewSetting,
    ReviewVote,
    AdminSession,
    OrderTimeline,
    AuditLog,
    Attribute,
    SeoPage,
    CustomizationTemplate,
    Sequelize
};
