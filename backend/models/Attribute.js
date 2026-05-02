const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attribute = sequelize.define('Attribute', {
    type: {
        type: DataTypes.ENUM('STYLE', 'FOR', 'COLOR', 'FORMAT', 'MUSIC', 'PRICING'),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.STRING, // Can be hex code for colors or same as name
        allowNull: true
    }
});

module.exports = Attribute;
