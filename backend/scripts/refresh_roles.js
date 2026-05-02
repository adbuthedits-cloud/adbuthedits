const { Role } = require('../models');

async function refreshRoles() {
    console.log('=== Refreshing Default Roles & Permissions ===\n');
    
    // Exact standard defaults used in adminRoutes.js
    const defaultRoles = [
        {
            name: 'Super Admin',
            description: 'Full system access',
            is_system: true,
            permissions: {
                dashboard: ['view'], seo: ['view', 'edit'], orders: ['view', 'edit', 'delete'],
                products: ['view', 'edit', 'delete'], master_data: ['view', 'edit', 'delete'],
                blogs: ['view', 'edit', 'delete'], blog_categories: ['view', 'edit', 'delete'],
                reviews: ['view', 'edit', 'delete'], payments: ['view'],
                marketing: ['view', 'edit', 'delete'], users: ['view', 'edit', 'delete'],
                staff: ['view', 'edit', 'delete'], settings: ['view', 'edit']
            }
        },
        {
            name: 'Editor',
            description: 'Content and order management',
            is_system: false,
            permissions: {
                dashboard: ['view'], orders: ['view', 'edit'],
                products: ['view', 'edit'], blogs: ['view', 'edit'],
                blog_categories: ['view'], reviews: ['view', 'edit']
            }
        },
        {
            name: 'Marketing',
            description: 'Marketing and promotions management',
            is_system: false,
            permissions: {
                dashboard: ['view'], seo: ['view', 'edit'],
                marketing: ['view', 'edit', 'delete'], users: ['view']
            }
        },
        {
            name: 'Support',
            description: 'Customer support and inquiry management',
            is_system: false,
            permissions: {
                dashboard: ['view'], orders: ['view'],
                reviews: ['view', 'edit'], users: ['view']
            }
        },
        {
            name: 'Manager',
            description: 'Management overview access',
            is_system: false,
            permissions: {
                dashboard: ['view'], orders: ['view', 'edit'],
                products: ['view'], blogs: ['view'], reviews: ['view'],
                payments: ['view'], users: ['view'], staff: ['view']
            }
        }
    ];

    try {
        for (const roleData of defaultRoles) {
            console.log(`Refreshing role: ${roleData.name}...`);
            const [role, created] = await Role.findOrCreate({
                where: { name: roleData.name },
                defaults: roleData
            });

            if (!created) {
                await role.update({
                    description: roleData.description,
                    is_system: roleData.is_system,
                    permissions: roleData.permissions
                });
                console.log(`✅ Updated existing role: ${roleData.name}`);
            } else {
                console.log(`✨ Created new role: ${roleData.name}`);
            }
        }

        console.log('\nDone! All roles refreshed.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error refreshing roles:', err.message);
        process.exit(1);
    }
}

refreshRoles();
