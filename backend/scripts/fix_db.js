const { sequelize, Inquiry } = require('../models');

async function fixDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Force sync for Inquiry model specifically
        console.log('Syncing Inquiry model...');
        await Inquiry.sync({ alter: true });
        console.log('Inquiry model synced successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Error fixing database:', error);
        process.exit(1);
    }
}

fixDatabase();
