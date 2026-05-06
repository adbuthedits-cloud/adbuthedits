const { User } = require('./models');

async function fixEmailConstraint() {
    try {
        await User.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "email" DROP NOT NULL;');
        console.log('Successfully updated Users table to allow null emails.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating table:', err);
        process.exit(1);
    }
}

fixEmailConstraint();
