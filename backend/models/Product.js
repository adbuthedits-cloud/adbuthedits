const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category');

const Product = sequelize.define('Product', {
    products_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    compared_price: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    summary: {
        type: DataTypes.JSON, // e.g. { size: "1080x1920", duration: "15s" }
        allowNull: true
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true
    },
    thumbnail: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    images: {
        type: DataTypes.JSON, // Array of image URLs
        allowNull: true
    },
    video: {
        type: DataTypes.JSON, // Array of video URLs
        allowNull: true
    },
    customization: {
        type: DataTypes.JSON,
        allowNull: true
    },

    // --- NAMING CONVENTION FIELDS ---
    // Root parent category ID (Digital Invitations or Greetings) in Category table
    parent_category_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    // FK to AssetType (PO, VI)
    asset_type_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    // FK to AssetVariant (WI, WO)
    asset_variant_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    // FK to AssetCategory (PE, BI, FW, etc.)
    asset_category_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    // FK to AssetSubCategory (AN, BIR, WED, etc.)
    asset_sub_category_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    // FK to AssetOrientation (HOR, VER, H&V)
    asset_orientation_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    // The 4-digit serial number for naming
    serial_number: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Auto-generated naming ID: JAP-PO-WI-PE-AN-HOR-1001
    internal_sku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },

    // --- SEO ---
    meta_title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    meta_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    meta_keywords: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    canonical_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resource_file: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_draft: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'English'
    },
});

module.exports = Product;
