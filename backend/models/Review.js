const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
    review_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    products_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    images: {
        type: DataTypes.JSON, // Array of image URLs
        allowNull: true,
        defaultValue: []
    },
    videos: {
        type: DataTypes.JSON, // Array of video URLs
        allowNull: true,
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'approved'
    },
    replies: {
        type: DataTypes.JSON, // Array of objects: { id, user_id, userName, role, message, createdAt }
        allowNull: true,
        defaultValue: []
    },
    unread_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true 
    },
    unread_user: {
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    }
}, {
    tableName: 'ratings', // Match existing lowercase table in Postgres
    timestamps: true
});

module.exports = Review;
