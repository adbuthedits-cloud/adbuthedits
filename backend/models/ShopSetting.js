const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShopSetting = sequelize.define('ShopSetting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shop_banner_image: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    shop_banner_title: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    shop_banner_subtitle: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    shop_banner_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'image'
    }
}, {
    timestamps: true
});

module.exports = ShopSetting;
