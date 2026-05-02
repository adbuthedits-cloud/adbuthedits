/**
 * Migration: Convert role_id from INTEGER to UUID
 * 
 * Run once with: node scripts/migrateRoleIdToUUID.js
 * 
 * What this does:
 * 1. Reads all existing Roles (with integer IDs)
 * 2. Assigns each a new UUID
 * 3. Updates all Admin.role_id references to the new UUIDs
 * 4. Alters the DB column types
 * 
 * Safe to run on existing data.
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
    console.log('=== Role ID UUID Migration ===\n');
    const transaction = await sequelize.transaction();

    try {
        // Step 1: Get all current roles with their integer IDs
        const roles = await sequelize.query(
            'SELECT role_id, name FROM "Roles" ORDER BY role_id',
            { type: QueryTypes.SELECT, transaction }
        );
        console.log(`Found ${roles.length} roles to migrate.`);

        if (roles.length === 0) {
            console.log('No roles found. Nothing to migrate.');
            await transaction.rollback();
            return;
        }

        // Step 2: Build a mapping old_int_id → new_uuid
        const idMap = {};
        for (const role of roles) {
            idMap[role.role_id] = uuidv4();
            console.log(`  Role "${role.name}" (ID: ${role.role_id}) → ${idMap[role.role_id]}`);
        }

        // Step 3: Add a temporary new_uuid column to Roles
        await sequelize.query('ALTER TABLE "Roles" ADD COLUMN IF NOT EXISTS new_uuid VARCHAR(36)', { transaction });

        // Step 4: Populate new_uuid for each role
        for (const [oldId, newUuid] of Object.entries(idMap)) {
            await sequelize.query(
                'UPDATE "Roles" SET new_uuid = ? WHERE role_id = ?',
                { replacements: [newUuid, oldId], type: QueryTypes.UPDATE, transaction }
            );
        }

        // Step 5: Add temp column to Admins for new role UUID
        await sequelize.query('ALTER TABLE "Admins" ADD COLUMN IF NOT EXISTS new_role_uuid VARCHAR(36)', { transaction });

        // Step 6: Populate new_role_uuid in Admins based on current role_id
        for (const [oldId, newUuid] of Object.entries(idMap)) {
            await sequelize.query(
                'UPDATE "Admins" SET new_role_uuid = ? WHERE role_id = ?',
                { replacements: [newUuid, String(oldId)], type: QueryTypes.UPDATE, transaction }
            );
        }

        // Step 7: Drop FK constraint (Admin.role_id → Roles.role_id)
        // Get constraint name dynamically
        const constraints = await sequelize.query(
            `SELECT conname FROM pg_constraint 
             WHERE conrelid = '"Admins"'::regclass AND contype = 'f' AND conname LIKE '%role%'`,
            { type: QueryTypes.SELECT, transaction }
        );
        for (const c of constraints) {
            await sequelize.query(`ALTER TABLE "Admins" DROP CONSTRAINT IF EXISTS "${c.conname}"`, { transaction });
            console.log(`Dropped FK constraint: ${c.conname}`);
        }

        // Step 8: Drop old integer columns
        await sequelize.query('ALTER TABLE "Admins" DROP COLUMN IF EXISTS role_id', { transaction });
        await sequelize.query('ALTER TABLE "Roles" DROP COLUMN IF EXISTS role_id', { transaction });

        // Step 9: Rename new_uuid → role_id in Roles
        await sequelize.query('ALTER TABLE "Roles" RENAME COLUMN new_uuid TO role_id', { transaction });
        await sequelize.query(
            'ALTER TABLE "Roles" ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (role_id)',
            { transaction }
        );

        // Step 10: Rename new_role_uuid → role_id in Admins
        await sequelize.query('ALTER TABLE "Admins" RENAME COLUMN new_role_uuid TO role_id', { transaction });
        await sequelize.query(
            `ALTER TABLE "Admins" ADD CONSTRAINT "Admins_role_id_fkey" 
             FOREIGN KEY (role_id) REFERENCES "Roles"(role_id) ON UPDATE CASCADE ON DELETE SET NULL`,
            { transaction }
        );

        await transaction.commit();
        console.log('\n✅ Migration complete! role_id is now UUID in both Roles and Admins tables.');
        console.log('   Restart the backend server for changes to take full effect.');

    } catch (err) {
        await transaction.rollback();
        console.error('\n❌ Migration failed. All changes rolled back.', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

migrate();
