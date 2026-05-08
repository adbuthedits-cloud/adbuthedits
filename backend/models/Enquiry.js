const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enquiry = sequelize.define('Enquiry', {
    enquiry_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    source: {
        type: DataTypes.STRING, // 'enquiry_form' | 'contact_form' | 'get_in_touch'
        defaultValue: 'enquiry_form',
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true, // Optional for contact form
    },
    company_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    service: {
        type: DataTypes.STRING,
        allowNull: true, // Optional for contact form
    },
    sub_service: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    requirement_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    requirement_desc: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    expected_timeline: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
    },
    assigned_to: {
        type: DataTypes.UUID,
        allowNull: true, // Admin UUID who is handling this
    }
}, {
    tableName: 'enquiries',
    timestamps: true,
    underscored: true,
});

module.exports = Enquiry;
