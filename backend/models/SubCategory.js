const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category');

const SubCategory = sequelize.define('SubCategory', {
    sub_category_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    sub_category_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    category_id: {
        type: DataTypes.UUID,
        allowNull: false
    }
});

module.exports = SubCategory;
