const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// AssetSubCategory is the granular level: AN (Anniversaries), BIR (Birthdays), WED (Weddings), DIW (Diwali) etc.

const AssetSubCategory = sequelize.define('AssetSubCategory', {
    asset_sub_category_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING, // e.g., "Anniversaries", "Birthdays"
        allowNull: false,
        unique: true
    },
    code: {
        type: DataTypes.STRING(10), // e.g., "AN", "BIR", "WED"
        allowNull: false,
        unique: true
    },
    // FK to AssetCategory (PE, BI, FW, etc.)
    asset_category_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
    tableName: 'AssetSubCategories',
    timestamps: true,
});

module.exports = AssetSubCategory;
