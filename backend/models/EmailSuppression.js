const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// EmailSuppression — stores email addresses that have bounced or complained.
// Before sending any email, we check this table and skip if found.
const EmailSuppression = sequelize.define('EmailSuppression', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    // 'bounce' or 'complaint'
    reason: {
        type: DataTypes.ENUM('bounce', 'complaint'),
        allowNull: false,
    },
    // 'Permanent', 'Transient', 'Undetermined' (from AWS bounce type)
    bounce_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Raw SNS notification payload for debugging/audit
    raw_payload: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    suppressed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'email_suppressions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = EmailSuppression;
