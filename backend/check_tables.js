const sequelize = require('./config/database');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables in database:', tables);
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await sequelize.close();
  }
}

check();
