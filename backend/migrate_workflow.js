/**
 * Migration: Add order workflow tracking columns
 * Run: node migrate_workflow.js
 */
require('dotenv').config();
const sequelize = require('./config/database');
const { QueryInterface, DataTypes } = require('sequelize');

async function migrate() {
    const qi = sequelize.getQueryInterface();
    
    try {
        await sequelize.authenticate();
        console.log('[Migration] DB connected.');

        // --- Orders table: add workflow columns ---
        const ordersDesc = await qi.describeTable('Orders');

        if (!ordersDesc.assigned_to) {
            await qi.addColumn('Orders', 'assigned_to', {
                type: DataTypes.UUID,
                allowNull: true,
            });
            console.log('[Migration] Added Orders.assigned_to');
        }

        if (!ordersDesc.assigned_at) {
            await qi.addColumn('Orders', 'assigned_at', {
                type: DataTypes.DATE,
                allowNull: true,
            });
            console.log('[Migration] Added Orders.assigned_at');
        }

        if (!ordersDesc.picked_up_at) {
            await qi.addColumn('Orders', 'picked_up_at', {
                type: DataTypes.DATE,
                allowNull: true,
            });
            console.log('[Migration] Added Orders.picked_up_at');
        }

        if (!ordersDesc.working_status) {
            await qi.addColumn('Orders', 'working_status', {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'unassigned',
            });
            console.log('[Migration] Added Orders.working_status');
        }

        // --- Create OrderTimelines table ---
        const tables = await qi.showAllTables();
        if (!tables.includes('OrderTimelines')) {
            await qi.createTable('OrderTimelines', {
                timeline_id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                order_id: {
                    type: DataTypes.UUID,
                    allowNull: false,
                },
                admin_id: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                actor_name: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                actor_role: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                action: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                status_label: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                notes: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                metadata: {
                    type: DataTypes.JSONB,
                    allowNull: true,
                },
                event_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log('[Migration] Created OrderTimelines table');
        } else {
            console.log('[Migration] OrderTimelines table already exists');
        }

        console.log('[Migration] ✅ All migrations applied successfully!');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] ❌ Error:', err.message);
        process.exit(1);
    }
}

migrate();
