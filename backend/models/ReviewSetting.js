const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReviewSetting = sequelize.define('ReviewSetting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    auto_reply_text: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'Thank you for your review! We truly appreciate your feedback and hope to see you again.'
    },
    is_auto_reply_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    reply_delay_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    }
}, {
    timestamps: true
});

module.exports = ReviewSetting;
