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
    }
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

module.exports = User;
