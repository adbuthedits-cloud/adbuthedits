const sequelize = require('./config/database');

async function checkConstraints() {
    try {
        const [results, metadata] = await sequelize.query(`
            SELECT 
                conname AS constraint_name,
                conrelid::regclass AS table_name,
                a.attname AS column_name,
                confrelid::regclass AS foreign_table_name,
                af.attname AS foreign_column_name
            FROM 
                pg_constraint c
            JOIN 
                pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
            JOIN 
                pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
            WHERE 
                contype = 'f' AND conrelid::regclass::text = 'SubCategories';
        `);
        console.log('Constraints on SubCategories:');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error checking constraints:', error);
        process.exit(1);
    }
}

checkConstraints();
