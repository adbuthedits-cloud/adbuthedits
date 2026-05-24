const sequelize = require('./config/database');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    const tables = ['ratings', 'coupons', 'system_settings', 'Products', 'Blogs', 'Users', 'SeoPages'];
    for (const table of tables) {
      try {
        const columns = await sequelize.getQueryInterface().describeTable(table);
        console.log(`\nColumns for table "${table}":`, Object.keys(columns));
      } catch (err) {
        console.log(`\nCould not describe table "${table}":`, err.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

check();
