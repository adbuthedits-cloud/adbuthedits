const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// AssetCategory represents the "Category" level in the naming convention:
// PE (Personal Events), BI (Business Invites), PAE (Party Events) under Digital Invitations
// FW (Festival Wishes), PEG (Personal Greetings), P&S (Political & Social), PG (Professional Greetings) under Greetings

const AssetCategory = sequelize.define('AssetCategory', {
    asset_category_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING, // e.g., "Personal Events"
        allowNull: false,
        unique: true
    },
    code: {
        type: DataTypes.STRING(10), // e.g., "PE", "BI", "FW"
        allowNull: false,
        unique: true
    },
    // FK to the root parent (Digital Invitations or Greetings) in the Category table
    parent_category_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: true, // Allow true initially for existing data, but should be unique
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'AssetCategories',
    timestamps: true,
});

module.exports = AssetCategory;
