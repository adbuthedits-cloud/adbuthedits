const jwt = require('./node_modules/jsonwebtoken');
const { User, Product } = require('./models');

(async () => {
    try {
        const user = await User.findOne();
        if (!user) return console.log('No user');
        const token = jwt.sign({ user: { id: user.user_id, role: user.role } }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });

        const prod = await Product.findOne();
        if (!prod) return console.log('No product');
        const pid = prod.products_id;

        console.log('User ID:', user.user_id);
        console.log('Product ID:', pid);

        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        console.log('--- POST /api/wishlist ---');
        let res = await fetch('http://localhost:5000/api/wishlist', {
            method: 'POST',
            headers,
            body: JSON.stringify({ product_id: pid })
        });
        console.log(res.status, await res.text());

        console.log('--- GET /api/wishlist ---');
        res = await fetch('http://localhost:5000/api/wishlist', {
            method: 'GET',
            headers
        });
        console.log(res.status);
        const getDbBody = await res.json();
        console.log('Array?', Array.isArray(getDbBody), 'Length:', getDbBody.length);
        if (getDbBody.length > 0) {
            console.log('First Item ID:', getDbBody[0].products_id);
        }

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
})();
