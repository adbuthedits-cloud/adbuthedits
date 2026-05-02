const { User, Admin, sequelize } = require('../models');

async function migrate() {
    try {
        console.log('--- Starting Admin Migration ---');
        
        // 1. Find all staff/admin in the User table
        const staffUsers = await User.findAll({
            where: {
                role: ['admin', 'editor', 'support']
            }
        });

        console.log(`Found ${staffUsers.length} staff members in User table.`);

        if (staffUsers.length === 0) {
            console.log('No staff members to migrate.');
            return;
        }

        // 2. Clear Admin table first if needed (Optional, usually we append)
        // await Admin.destroy({ where: {} });

        for (const user of staffUsers) {
            console.log(`Migrating: ${user.email} (${user.role})...`);
            
            // Note: Since we use bcrypt hooks, we need to bypass them to keep old hashes 
            // OR we just set password_hash directly if the model allows it.
            // In our Admin model, hooks run on beforeCreate. 
            // We want to KEEP the existing hash from the User table.
            
            try {
                // Use build + save(hooks: false) to prevent double-hashing
                const adminRecord = Admin.build({
                    admin_id: user.user_id, // Keep same ID for consistency
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    password_hash: user.password_hash,
                    role: user.role,
                    is_active: true
                });

                await adminRecord.save({ hooks: false });
                console.log(`Successfully migrated ${user.email}`);

                // 3. Remove from User table
                await user.destroy();
                console.log(`Removed ${user.email} from User table.`);

            } catch (err) {
                if (err.name === 'SequelizeUniqueConstraintError') {
                    console.log(`Admin ${user.email} already exists in Admin table. Skipping clone.`);
                } else {
                    console.error(`Error migrating ${user.email}:`, err.message);
                }
            }
        }

        console.log('--- Migration Completed Successfully ---');
    } catch (err) {
        console.error('Migration Failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
