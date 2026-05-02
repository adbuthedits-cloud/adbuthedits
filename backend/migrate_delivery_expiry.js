/**
 * One-time migration: 
 * 1. Add download_expires_at column to OrderItems if missing
 * 2. Backfill existing delivered items with 30-day expiry
 */
const { QueryInterface, DataTypes } = require('sequelize');
const sequelize = require('./config/database');
const { OrderItem } = require('./models');

async function migrate() {
    try {
        const qi = sequelize.getQueryInterface();

        // Add column if it doesn't exist
        const tableDescription = await qi.describeTable('OrderItems');
        if (!tableDescription.download_expires_at) {
            await qi.addColumn('OrderItems', 'download_expires_at', {
                type: DataTypes.DATE,
                allowNull: true,
            });
            console.log('✅ Added column: download_expires_at');
        } else {
            console.log('ℹ️  Column already exists: download_expires_at');
        }

        // Backfill existing delivered items
        const delivered = await OrderItem.findAll({
            where: { delivery_status: 'delivered', download_expires_at: null }
        });

        let updated = 0;
        for (const item of delivered) {
            const base = item.delivered_at || item.updatedAt || new Date();
            const expiry = new Date(base);
            expiry.setDate(expiry.getDate() + 30);
            await item.update({ download_expires_at: expiry });
            updated++;
        }

        console.log(`✅ Backfilled ${updated} delivered items with 30-day expiry`);
        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
