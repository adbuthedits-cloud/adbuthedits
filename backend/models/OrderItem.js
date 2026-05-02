const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    order_item_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Orders',
            key: 'order_id'
        }
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Products',
            key: 'products_id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    price_at_purchase: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    customization: {
        type: DataTypes.JSON,
        allowNull: true
    },
    delivery_status: {
        type: DataTypes.STRING,
        defaultValue: 'pending' // pending, delivered
    },
    delivery_link: {
        type: DataTypes.STRING,
        allowNull: true
    },
    delivered_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    warning_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    download_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = OrderItem;
