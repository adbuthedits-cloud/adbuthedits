const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomizationTemplate = sequelize.define('CustomizationTemplate', {
    template_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fields: {
        type: DataTypes.JSON, // Stores the array of customization groups
        allowNull: false
    }
});

module.exports = CustomizationTemplate;
