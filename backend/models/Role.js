const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Role Model
 * 
 * Stores all roles in the system. Super Admin can create custom roles.
 * Each role has a granular permissions JSON object.
 * 
 * Permissions structure:
 * {
 *   "dashboard":  ["view"],
 *   "products":   ["view", "edit", "delete"],
 *   "orders":     ["view", "edit"],
 *   "blogs":      ["view", "edit"],
 *   ...
 * }
 * 
 * Available modules: dashboard, seo, orders, products, master_data,
 *   blogs, blog_categories, reviews, payments, marketing, users, staff, settings
 * 
 * Available actions per module (only those that make sense for the module):
 *   view | edit | delete
 */
const Role = sequelize.define('Role', {
    role_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // Granular permissions JSON
    permissions: {
        type: DataTypes.JSON,
        defaultValue: {},
    },
    // System roles cannot be deleted (super_admin, admin)
    is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'Roles',
    timestamps: true,
});

module.exports = Role;
