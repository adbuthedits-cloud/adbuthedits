const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
    setting_key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    setting_value: {
        type: DataTypes.JSON, // Use JSON to allow complex settings or simple strings
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'system_settings',
    timestamps: true,
});

module.exports = SystemSetting;
