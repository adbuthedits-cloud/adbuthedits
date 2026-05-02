const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
    admin_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    // Human-readable Employee ID: ADB-2025-001
    staff_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    // Username for login: adbuth.dinesh (not email)
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Keep role as string for quick checks + backward compatibility
    // This is kept in sync with the Role table via role_id
    role: {
        type: DataTypes.STRING(100),
        defaultValue: 'support',
    },
    // FK to Roles table - UUID, source of truth for permissions
    role_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Roles',
            key: 'role_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    // Granular CRUD permissions per module - SYNCED from Role record on login
    // Structure: { "products": ["view","edit","delete"], "orders": ["view"], ... }
    permissions: {
        type: DataTypes.JSON,
        defaultValue: {},
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Track current session for attendance
    current_session_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    is_logged_in: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    hooks: {
        beforeCreate: async (admin) => {
            if (admin.password_hash) {
                const salt = await bcrypt.genSalt(10);
                admin.password_hash = await bcrypt.hash(admin.password_hash, salt);
            }
        },
        beforeUpdate: async (admin) => {
            if (admin.changed('password_hash')) {
                const salt = await bcrypt.genSalt(10);
                admin.password_hash = await bcrypt.hash(admin.password_hash, salt);
            }
        }
    }
});

Admin.prototype.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

module.exports = Admin;
