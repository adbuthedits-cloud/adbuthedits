const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * OrderTimeline Model
 * 
 * Stores every single event in an order's lifecycle.
 * Actions: ORDER_PLACED | ASSIGNED | REASSIGNED | PICKED_UP | PROGRESS_UPDATE | DELIVERED | COMPLETED
 * 
 * This is the single source of truth for tracking order progress.
 */
const OrderTimeline = sequelize.define('OrderTimeline', {
    timeline_id: {
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
    // Who performed this action (null for system/customer events)
    admin_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Admins',
            key: 'admin_id'
        }
    },
    // Staff member name snapshot — preserved even if admin is deleted
    actor_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    actor_role: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Timeline event type
    action: {
        type: DataTypes.ENUM(
            'ORDER_PLACED',
            'ASSIGNED',
            'REASSIGNED',
            'PICKED_UP',
            'PROGRESS_UPDATE',
            'DELIVERED',
            'COMPLETED',
            'NOTIFICATION_SENT'
        ),
        allowNull: false,
    },
    // Human-readable status label shown to customers / admins
    status_label: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Optional detailed notes for this event
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // Extra metadata (previous assignee, file links, etc.)
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    // Exact timestamp for the event
    event_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'OrderTimelines',
    timestamps: true,
});

module.exports = OrderTimeline;
