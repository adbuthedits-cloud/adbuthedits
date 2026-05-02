const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetType = sequelize.define('AssetType', {
    type_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING, // e.g., "Poster", "Video"
        allowNull: false,
        unique: true
    },
    code: {
        type: DataTypes.STRING(10), // e.g., "PO", "VI"
        allowNull: false,
        unique: true
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'AssetTypes',
    timestamps: true,
});

module.exports = AssetType;
