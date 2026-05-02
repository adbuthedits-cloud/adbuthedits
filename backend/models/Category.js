const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    category_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    category_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    category_image: {
        type: DataTypes.TEXT, // Using TEXT for potentially long URLs or base64
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    banner_image: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    banner_title: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    banner_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    banner_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'image'
    }
});

module.exports = Category;
