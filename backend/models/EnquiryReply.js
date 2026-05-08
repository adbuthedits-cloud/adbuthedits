const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EnquiryReply = sequelize.define('EnquiryReply', {
    reply_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    enquiry_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    admin_id: {
        type: DataTypes.UUID,
        allowNull: true, // Null if sent by system
    },
    admin_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'System'
    },
    admin_role: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Staff'
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    channel: {
        type: DataTypes.STRING, // 'email' | 'note'
        defaultValue: 'email',
    }
}, {
    tableName: 'enquiry_replies',
    timestamps: true,
    underscored: true,
});

module.exports = EnquiryReply;
