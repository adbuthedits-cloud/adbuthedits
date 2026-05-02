const sequelize = require('../config/database');
const { Product, Category, SubCategory, Attribute, User } = require('../models');

const seedDatabase = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log('Database synced!');

        // 1. Create Default User (Admin)
        await User.create({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@adbuth.com',
            password_hash: 'password123', // Will be hashed by hook
            role: 'admin',
            phone_number: { code: '+91', number: '1234567890' }
        });
        console.log('Admin user created');

        // 2. Create Categories
        const birthdayCat = await Category.create({
            category_name: 'Birthday',
            slug: 'birthday',
            category_image: 'https://via.placeholder.com/150',
            description: 'Celebrate birthdays in style'
        });

        const weddingCat = await Category.create({
            category_name: 'Wedding',
            slug: 'wedding',
            category_image: 'https://via.placeholder.com/150',
            description: 'Wedding invitations and more'
        });

        // 3. Create SubCategories (Optional, based on diagram)
        await SubCategory.create({
            sub_category_name: 'Kids Birthday',
            slug: 'kids-birthday',
            category_id: birthdayCat.category_id
        });

        // 4. Create Product
        await Product.create({
            title: 'Fun Birthday Bash',
            slug: 'fun-birthday-bash',
            description: 'A fun and colorful birthday invitation template.',
            price: 499,
            compared_price: 999,
            category_id: birthdayCat.category_id,
            summary: { duration: '15s', size: '1080x1920' },
            tags: ['fun', 'kids', 'colorful'],
            images: ['https://via.placeholder.com/300'],
            colors: [{ name: 'Blue', value: '#0000FF' }, { name: 'Red', value: '#FF0000' }],
            thumbnail: 'https://via.placeholder.com/300',
            sub_category: ['Kids Birthday'] // Storing as JSON array or we could use the FK
        });

        console.log('Seed data inserted!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDatabase();
