const { Role, Admin, sequelize } = require('./models');

async function fixPermissions() {
    try {
        console.log('--- Starting Permission Fix ---');
        
        // 1. Find the roles we need to update
        const roles = await Role.findAll();
        
        for (const role of roles) {
            let updated = false;
            const perms = role.permissions || {};
            
            if (!perms.orders) perms.orders = ['view'];
            
            // Logic for specific roles based on the name
            if (role.name === 'Super Admin' || role.is_system) {
                if (!perms.orders.includes('assign')) { perms.orders.push('assign'); updated = true; }
                if (!perms.orders.includes('pickup')) { perms.orders.push('pickup'); updated = true; }
                if (!perms.order_tracking) { perms.order_tracking = ['view']; updated = true; }
                if (!perms.my_tasks) { perms.my_tasks = ['view']; updated = true; }
            } else if (role.name === 'Editor') {
                if (!perms.orders.includes('pickup')) { perms.orders.push('pickup'); updated = true; }
                if (!perms.my_tasks) { perms.my_tasks = ['view']; updated = true; }
            } else if (role.name === 'Manager') {
                if (!perms.orders.includes('assign')) { perms.orders.push('assign'); updated = true; }
                if (!perms.orders.includes('pickup')) { perms.orders.push('pickup'); updated = true; }
                if (!perms.order_tracking) { perms.order_tracking = ['view']; updated = true; }
                if (!perms.my_tasks) { perms.my_tasks = ['view']; updated = true; }
            }

            if (updated) {
                console.log(`Updating role: ${role.name}`);
                await role.update({ permissions: perms });
                
                // 2. Sync to all Admins with this role
                console.log(`Syncing permissions to admins with role: ${role.name}`);
                await Admin.update(
                    { permissions: perms },
                    { where: { role_id: role.role_id } }
                );
            }
        }
        
        console.log('--- Permission Fix Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing permissions:', error);
        process.exit(1);
    }
}

fixPermissions();
