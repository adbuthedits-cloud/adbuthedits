const sequelize = require('./config/database');

const checkColumns = async () => {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Users'
        `);
        console.log('Columns in Users table:');
        results.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error fetching columns:', err);
        process.exit(1);
    }
};

checkColumns();
