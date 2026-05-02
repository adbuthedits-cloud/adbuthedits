const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetVariant = sequelize.define('AssetVariant', {
    variant_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING, // e.g., "With Image", "Without Image"
        allowNull: false,
        unique: true
    },
    code: {
        type: DataTypes.STRING(10), // e.g., "WI", "WO"
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
    tableName: 'AssetVariants',
    timestamps: true,
});

module.exports = AssetVariant;
