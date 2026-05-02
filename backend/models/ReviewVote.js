const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReviewVote = sequelize.define('ReviewVote', {
    vote_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    review_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    user_id: {
        type: DataTypes.STRING, // Store either User UUID or Guest ID string
        allowNull: false
    },
    vote_type: {
        type: DataTypes.ENUM('helpful', 'unhelpful'),
        allowNull: false
    }
}, {
    tableName: 'review_votes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['review_id', 'user_id']
        }
    ]
});

module.exports = ReviewVote;
