/**
 * safeSync.js
 * Runs safe ALTER TABLE migrations to add new columns without destroying data.
 * This is called once on server startup.
 */
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

const migrations = [
    // Add 'source' column to enquiries table
    `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'enquiry_form'`,

    // Add 'is_draft' column to products table
    `ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false`,

    // Add 'assigned_to' column to enquiries table  
    `ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_to UUID`,

    // Create enquiry_replies table if it doesn't exist
    `CREATE TABLE IF NOT EXISTS enquiry_replies (
        reply_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enquiry_id UUID NOT NULL,
        admin_id UUID,
        admin_name VARCHAR(255) NOT NULL DEFAULT 'Admin',
        admin_role VARCHAR(100) DEFAULT 'Staff',
        subject VARCHAR(500),
        message TEXT NOT NULL,
        channel VARCHAR(50) DEFAULT 'email',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Make 'phone' nullable in enquiries (contact form doesn't always have phone)
    `ALTER TABLE enquiries ALTER COLUMN phone DROP NOT NULL`,

    // Make 'service' nullable in enquiries
    `ALTER TABLE enquiries ALTER COLUMN service DROP NOT NULL`,

    // Add 'path' column to SeoPages table
    `ALTER TABLE "SeoPages" ADD COLUMN IF NOT EXISTS path VARCHAR(255)`,
];

async function runSafeMigrations() {
    for (const sql of migrations) {
        try {
            await sequelize.query(sql, { type: QueryTypes.RAW });
        } catch (err) {
            // Log but don't crash — column may already exist with different syntax
            console.warn('[SafeSync] Migration skipped (may already exist):', err.message?.split('\n')[0]);
        }
    }
    console.log('[SafeSync] Safe migrations complete.');
}

module.exports = { runSafeMigrations };
