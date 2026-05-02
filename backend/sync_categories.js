const { Category } = require('./models');
const sequelize = require('./config/database');

async function sync() {
    try {
        console.log('Syncing Category model...');
        await Category.sync({ alter: true });
        console.log('Category model synced successfully. Missing columns should be added.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to sync Category model:', error);
        process.exit(1);
    }
}

sync();
