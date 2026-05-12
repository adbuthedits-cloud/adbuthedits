const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeoPage = sequelize.define('SeoPage', {
    page_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    page_identifier: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    keywords: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    og_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    canonical_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    no_index: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    path: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = SeoPage;
