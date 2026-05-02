const { sequelize, Admin } = require('../models');

async function run() {
    await sequelize.authenticate();
    
    // Get the actual table name from the model
    const tableName = Admin.getTableName();
    console.log('Admin table name:', tableName);

    const perms = {
        orders: ['view'],
        products: ['view', 'edit'],
        marketing: ['view'],
        reviews: ['view', 'edit'],
        blogs: ['view', 'edit'],
        dashboard: ['view'],
        blog_categories: ['view']
    };

    // Use Sequelize update directly with reload
    const editors = await Admin.findAll({ where: { role: 'editor' } });
    for (const editor of editors) {
        // Force update by setting permissions field directly as a new object reference
        await Admin.update(
            { permissions: perms },
            { 
                where: { admin_id: editor.admin_id },
                returning: true
            }
        );
        
        // Reload and verify
        await editor.reload();
        console.log('After reload perms:', JSON.stringify(editor.permissions));
    }

    // Verify via raw query
    const [rawRows] = await sequelize.query(
        `SELECT email, permissions FROM "${tableName}" WHERE role = 'editor'`
    );
    rawRows.forEach(r => {
        const p = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions;
        console.log('✅ DB Verified:', r.email, 'dashboard:', p.dashboard, 'reviews:', p.reviews);
    });

    process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
