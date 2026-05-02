const sequelize = require('./config/database');

async function check() {
    try {
        const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables in DB:', results.map(r => r.table_name));

        const [ratingsLower] = await sequelize.query("SELECT COUNT(*) FROM ratings").catch(() => [[{ count: 'not found' }]]);
        console.log('Count in lowercase "ratings":', ratingsLower[0].count);

        const [ratingsUpper] = await sequelize.query('SELECT COUNT(*) FROM "Ratings"').catch(() => [[{ count: 'not found' }]]);
        console.log('Count in quoted "Ratings":', ratingsUpper[0].count);

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
