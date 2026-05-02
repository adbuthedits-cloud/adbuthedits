const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
    coupon_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
            this.setDataValue('code', value.toUpperCase());
        }
    },
    discount_type: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        defaultValue: 'percentage',
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    expiration_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    usage_limit: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null means unlimited overall
    },
    per_user_limit: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null means a user can use it unlimited times
        defaultValue: 1, // Default to 1 time per user
    },
    min_order_value: {
        type: DataTypes.FLOAT,
        allowNull: true, // Null means no minimum cart value
        defaultValue: 0,
    },
    // New Advanced Promotion Engine Fields
    start_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    max_discount_amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    allow_stacking: {   
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    new_user_only: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    included_categories: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    excluded_categories: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    // Ultimate Granular Targeting
    included_asset_categories: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    excluded_asset_categories: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    included_asset_sub_categories: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    excluded_asset_sub_categories: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    included_products: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    excluded_products: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    min_items_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    // End Ultimate Targeting
    show_on_popup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    popup_title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    popup_message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    media_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    media_type: {
        type: DataTypes.ENUM('image', 'video'),
        allowNull: true,
    },
    // End New Fields
    used_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'coupons',
    timestamps: true
});

module.exports = Coupon;
