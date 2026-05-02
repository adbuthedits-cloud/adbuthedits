const { ChatSession, sequelize } = require('../models');
const { Op } = require('sequelize');

const testQuery = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Testing Admin Session Query...');
        const sessions = await ChatSession.findAll({
            where: {
                status: { [Op.ne]: 'resolved' }
            },
            order: [
                [sequelize.literal(`CASE WHEN status = 'waiting' THEN 1 WHEN status = 'live' THEN 2 ELSE 3 END`), 'ASC'],
                ['last_message_at', 'DESC']
            ]
        });

        console.log('Query Successful. Sessions found:', sessions.length);
        process.exit(0);
    } catch (e) {
        console.error('Query Failed:', e);
        process.exit(1);
    }
};

testQuery();
