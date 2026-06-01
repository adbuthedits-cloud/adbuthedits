const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    order_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'user_id'
        }
    },
    total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    coupon_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    discount_amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    viewed_by_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Customer-visible status: placed | paid | inprocessing | delivered | cancelled
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    // Internal workflow tracking fields
    assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Admins',
            key: 'admin_id'
        }
    },
    assigned_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    picked_up_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Internal working status: unassigned | assigned | in_progress | delivered | completed
    working_status: {
        type: DataTypes.STRING,
        defaultValue: 'unassigned',
    },
    change_request_status: {
        type: DataTypes.STRING,
        defaultValue: 'none'
    },
    change_request_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    change_request_attachments: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    change_requested_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = Order;
