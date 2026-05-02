const sequelize = require('./config/database');

async function migrate() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        console.log('Adding shop_banner_type to ShopSettings...');
        try {
            await queryInterface.addColumn('ShopSettings', 'shop_banner_type', {
                type: require('sequelize').DataTypes.STRING,
                allowNull: true,
                defaultValue: 'image'
            });
        } catch (e) {
            console.log('shop_banner_type already exists or error:', e.message);
        }

        console.log('Adding banner_type to Categories...');
        try {
            await queryInterface.addColumn('Categories', 'banner_type', {
                type: require('sequelize').DataTypes.STRING,
                allowNull: true,
                defaultValue: 'image'
            });
        } catch (e) {
            console.log('banner_type already exists or error:', e.message);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}
migrate();
