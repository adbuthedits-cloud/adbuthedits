const sequelize = require('../config/database');

async function fixEnum() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Raw SQL to add the value to the Postgres ENUM type
        // Note: 'enum_inquiries_status' is the default name Sequelize gives to the type
        // It might be 'Inquiries_status_enum' or similar depending on configuration.
        // Let's try the error message's name: "enum_inquiries_status"

        console.log("Attempting to add 'resolved' to enum_inquiries_status...");
        await sequelize.query(`ALTER TYPE "enum_inquiries_status" ADD VALUE IF NOT EXISTS 'resolved';`);

        console.log("✅ Successfully added 'resolved' to ENUM.");
    } catch (error) {
        console.error('Error updating ENUM:', error);
        // Fallback: Check if we need to handle case sensitivity or quotes differently
    } finally {
        await sequelize.close();
    }
}

fixEnum();
