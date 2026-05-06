const sequelize = require('./config/database');
const models = require('./models');

const syncDatabase = async () => {
    try {
        console.log('Connecting to database and syncing tables...');
        // This will create tables if they do not exist (and does nothing if they already exist)
        await sequelize.sync({ alter: true }); 
        console.log('Database tables synced successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error syncing database:', err);
        process.exit(1);
    }
};

syncDatabase();
