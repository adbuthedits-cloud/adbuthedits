const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enquiry = sequelize.define('Enquiry', {
    enquiry_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
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
        allowNull: false,
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
    }
}, {
    timestamps: true,
    underscored: true,
});

module.exports = Enquiry;
