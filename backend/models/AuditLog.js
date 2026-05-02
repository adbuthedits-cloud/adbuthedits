const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AuditLog — records every CREATE, UPDATE, DELETE action taken by any admin.
 * Gives the Super Admin full visibility into who did what and when.
 */
const AuditLog = sequelize.define('AuditLog', {
    log_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    admin_name: {
        type: DataTypes.STRING, // Denormalized for readability in reports
        allowNull: true,
    },
    admin_role: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    action: {
        type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'),
        allowNull: false,
    },
    module: {
        type: DataTypes.STRING, // e.g., 'products', 'orders', 'coupons'
        allowNull: false,
    },
    entity_id: {
        type: DataTypes.STRING, // ID of the affected record
        allowNull: true,
    },
    entity_name: {
        type: DataTypes.STRING, // Human-readable name, e.g., product title
        allowNull: true,
    },
    // Snapshot of what changed: { before: {...}, after: {...} }
    changes: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('success', 'failed'),
        defaultValue: 'success',
    }
}, {
    updatedAt: false, // Audit logs are immutable — never updated
});

module.exports = AuditLog;
