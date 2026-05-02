require('dotenv').config();
const sequelize = require('../config/database');
const Models = require('../models');

const testConnect = async () => {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Authentication Successful.');

        console.log('Syncing all models (alter: true)...');
        await sequelize.sync({ alter: true });
        console.log('Sync Successful.');
        process.exit(0);
    } catch (error) {
        console.error('Detailed Error:', error);
        if (error.original) console.error('Original Error:', error.original);
        process.exit(1);
    }
};

testConnect();
