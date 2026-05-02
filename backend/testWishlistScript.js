const testWishlist = async () => {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) // Replace with valid test user
        });
        const loginData = await loginRes.json();
        if (!loginData.token) {
            console.log("LOGIN FAILED: Create a user or check credentials.", loginData);
            return;
        }
        const token = loginData.token;
        console.log("Got token.");

        // Fetch Products to get a valid product ID
        const prodRes = await fetch('http://localhost:5000/api/products');
        const prods = await prodRes.json();
        const pid = prods[0].products_id;
        console.log("Using product:", pid);

        // Call POST /wishlist
        const postRes = await fetch('http://localhost:5000/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ product_id: pid })
        });
        console.log("POST Status:", postRes.status);
        console.log(await postRes.json());

        // Call GET /wishlist
        const getRes = await fetch('http://localhost:5000/api/wishlist', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("GET Status:", getRes.status);
        console.log(await getRes.json());

    } catch (err) {
        console.error(err);
    }
};
testWishlist();
