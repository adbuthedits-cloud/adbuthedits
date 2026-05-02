const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * AdminSession — tracks login/logout times and total work hours for each admin.
 * Gives Super Admin a professional attendance and time-tracking report.
 */
const AdminSession = sequelize.define('AdminSession', {
    session_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    admin_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    admin_role: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    login_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    logout_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Total duration in minutes — calculated on logout
    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'closed'),
        defaultValue: 'active',
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Approximate count of actions performed during this session
    action_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
}, {
    updatedAt: true,
});

module.exports = AdminSession;
