const sequelize = require('../config/database');
const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const BotKnowledge = require('../models/BotKnowledge');

const debug = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Syncing ChatSession...');
        await ChatSession.sync({ alter: true });
        console.log('ChatSession Synced.');

        console.log('Syncing Message...');
        await Message.sync({ alter: true });
        console.log('Message Synced.');

        console.log('Syncing BotKnowledge...');
        await BotKnowledge.sync({ alter: true });
        console.log('BotKnowledge Synced.');

    } catch (e) {
        console.error('Sync Error:', e);
    } finally {
        sequelize.close();
    }
};

debug();
