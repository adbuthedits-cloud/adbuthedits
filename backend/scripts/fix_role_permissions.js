const { Role } = require('../models');

async function fixRoles() {
    console.log('=== Fixing Role Permissions & System Flags ===\n');
    try {
        // Set is_system to false for all roles EXCEPT 'Super Admin'
        const [updatedRoles] = await Role.update(
            { is_system: false },
            { 
                where: { 
                    name: { [require('sequelize').Op.ne]: 'Super Admin' }
                } 
            }
        );
        console.log(`✅ Updated ${updatedRoles} roles: removed incorrect is_system flags.`);

        // Ensure Super Admin remains a system role
        await Role.update({ is_system: true }, { where: { name: 'Super Admin' } });
        console.log('✅ Verified Super Admin is still a system role.');

        console.log('\nDone!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing roles:', err.message);
        process.exit(1);
    }
}

fixRoles();
