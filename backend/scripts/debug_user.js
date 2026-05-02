const { User } = require('../models');
const sequelize = require('../config/database');

async function debugUser(email, testPassword) {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`❌ User with email '${email}' NOT FOUND.`);
            return;
        }

        console.log(`✅ User Found: ${user.email}`);
        console.log(`   ID: ${user.user_id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password Hash (Prefix): ${user.password_hash.substring(0, 10)}...`);

        if (!user.password_hash.startsWith('$2')) {
            console.log('⚠️  WARNING: Password hash does not look like a valid bcrypt hash!');
        }

        const isMatch = await user.checkPassword(testPassword);
        console.log(`\nTesting Password '${testPassword}': ${isMatch ? '✅ MATCH' : '❌ FAILED'}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

// Check with hardcoded known credentials if available, or just generic check
const email = process.argv[2] || 'admin@adbuth.com';
const password = process.argv[3] || 'Password123!';

console.log(`Checking User: ${email}`);
debugUser(email, password);
