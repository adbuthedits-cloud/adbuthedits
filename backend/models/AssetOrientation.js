const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetOrientation = sequelize.define('AssetOrientation', {
    orientation_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING, // e.g., "Horizontal", "Vertical"
        allowNull: false,
        unique: true
    },
    code: {
        type: DataTypes.STRING(10), // e.g., "HOR", "VER", "H&V"
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
    tableName: 'AssetOrientations',
    timestamps: true,
});

module.exports = AssetOrientation;
