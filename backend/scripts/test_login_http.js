const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login via HTTP...');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@adbuth.com',
            password: 'Password@123'
        });

        console.log('✅ HTTP Login Success!');
        console.log('Status:', res.status);
        console.log('Token:', res.data.token ? 'Received (Present)' : 'MISSING');
        console.log('User Role:', res.data.user.role);

    } catch (error) {
        console.error('❌ HTTP Login Failed:', error.response ? error.response.data : error.message);
    }
}

testLogin();
