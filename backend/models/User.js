const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    user_id: {
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
        allowNull: true, // Social users might not provide an email
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    phone_number: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: true, // Social users might not have a password initially
    },
    google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    facebook_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    twitter_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    profile_picture: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    auth_provider: {
        type: DataTypes.ENUM('local', 'google', 'facebook', 'twitter'),
        defaultValue: 'local',
    },
    role: {
        type: DataTypes.ENUM('customer'),
        defaultValue: 'customer',
    },
    logged_in: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    user_token: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    phone_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    otp_code: {
        type: DataTypes.STRING(6),
        allowNull: true,
    },
    otp_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    otp_type: {
        type: DataTypes.STRING(30),
        allowNull: true,
        // Values: 'email_login', 'phone_login', 'email_verify', 'forgot_password'
    },
    // Whether the user explicitly consented to receive transactional emails at signup
    email_consent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    // Stores history of previous password hashes and timestamps [{ hash, changed_at }]
    password_history: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: true,
    },
    // Account deactivation status
    is_deactivated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    deactivated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password_hash) {
                const salt = await bcrypt.genSalt(10);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password_hash')) {
                const oldHash = user.previous('password_hash');
                if (oldHash) {
                    let history = user.password_history || [];
                    if (typeof history === 'string') {
                        try { history = JSON.parse(history); } catch { history = []; }
                    }
                    if (!Array.isArray(history)) history = [];
                    history.unshift({ hash: oldHash, changed_at: new Date().toISOString() });
                    user.password_history = history.slice(0, 10);
                    user.changed('password_history', true);
                }
                const salt = await bcrypt.genSalt(10);
                user.password_hash = await bcrypt.hash(user.password_hash, salt);
            }
        }
    }
});

// Instance method to check password
User.prototype.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

// Instance method to check if password matches an old password in password_history
User.prototype.checkOldPassword = async function (password) {
    let history = this.password_history || [];
    if (typeof history === 'string') {
        try { history = JSON.parse(history); } catch { history = []; }
    }
    if (!Array.isArray(history)) return { matched: false };
    for (const item of history) {
        if (!item.hash) continue;
        const match = await bcrypt.compare(password, item.hash);
        if (match) {
            const changedDate = new Date(item.changed_at);
            const now = new Date();
            const diffMs = now - changedDate;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffMonths = Math.floor(diffDays / 30);

            let timeAgo = `${diffDays} days ago`;
            if (diffDays === 0) timeAgo = 'earlier today';
            else if (diffDays === 1) timeAgo = '1 day ago';
            else if (diffMonths >= 1) timeAgo = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;

            return { matched: true, timeAgo };
        }
    }
    return { matched: false };
};

module.exports = User;
