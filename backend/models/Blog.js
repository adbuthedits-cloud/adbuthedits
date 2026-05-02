const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Blog = sequelize.define('Blog', {
    blog_id: {
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
    content: {
        type: DataTypes.TEXT, // PostgreSQL TEXT is already unlimited length
        allowNull: false
    },
    structure: {
        type: DataTypes.JSON, // Stores block-based editor state
        allowNull: true
    },
    author: {
        type: DataTypes.STRING,
        allowNull: true
    },
    post_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    thumbnail: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tags: {
        type: DataTypes.JSON, // Array of tags
        allowNull: true
    },
    published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
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
    blog_category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'BlogCategories',
            key: 'id'
        }
    }
}, {
    timestamps: true
});

module.exports = Blog;
