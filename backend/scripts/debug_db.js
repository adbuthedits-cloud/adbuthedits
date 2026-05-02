const sequelize = require('../config/database');
const ChatSession = require('../models/ChatSession');

const debug = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        await ChatSession.sync({ force: true });
        console.log('ChatSession Synced.');
    } catch (e) {
        console.error('Error Syncing ChatSession:', e);
    } finally {
        sequelize.close();
    }
};

debug();
