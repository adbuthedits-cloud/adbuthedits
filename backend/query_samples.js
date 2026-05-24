const sequelize = require('./config/database');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    
    // Sample Products
    const products = await sequelize.query('SELECT products_id, title, thumbnail, images, video, resource_file FROM "Products" LIMIT 3', {
      type: sequelize.QueryTypes.SELECT
    });
    console.log('\n--- SAMPLE PRODUCTS ---');
    console.log(JSON.stringify(products, null, 2));

    // Sample Blogs
    const blogs = await sequelize.query('SELECT blog_id, title, thumbnail FROM "Blogs" LIMIT 3', {
      type: sequelize.QueryTypes.SELECT
    });
    console.log('\n--- SAMPLE BLOGS ---');
    console.log(JSON.stringify(blogs, null, 2));

    // Sample Coupons
    const coupons = await sequelize.query('SELECT coupon_id, code, media_url FROM coupons LIMIT 3', {
      type: sequelize.QueryTypes.SELECT
    });
    console.log('\n--- SAMPLE COUPONS ---');
    console.log(JSON.stringify(coupons, null, 2));

  } catch (error) {
    console.error('Error querying samples:', error);
  } finally {
    await sequelize.close();
  }
}

run();
