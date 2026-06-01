const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    payment_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'user_id'
        }
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Orders',
            key: 'order_id'
        }
    },
    mode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    razorpay_order_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    razorpay_payment_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    razorpay_signature: {
        type: DataTypes.STRING,
        allowNull: true
    },
    refund_request_status: {
        type: DataTypes.STRING,
        defaultValue: 'none'
    },
    refund_request_reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    refund_request_details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    refund_requested_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    amount_refunded: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = Payment;
