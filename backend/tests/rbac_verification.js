const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let editorToken = '';

async function runTests(editorEmail, editorPassword) {
    console.log('🚀 Starting RBAC & Security Verification Tests...');

    try {
        // 1. Login as Admin
        console.log('\n--- 1. Admin Login (Full Access) ---');
        try {
            const adminLogin = await axios.post(`${API_URL}/auth/admin/login`, {
                email: 'admin@adbuth.com',
                password: 'password123'
            });
            adminToken = adminLogin.data.token;
            console.log('✅ Admin logged in.');
        } catch (err) {
            console.error('❌ Admin login failed. Check credentials/server.');
        }

        // 2. Login as Editor
        console.log(`\n--- 2. Editor Login (${editorEmail}) ---`);
        try {
            const editorLogin = await axios.post(`${API_URL}/auth/admin/login`, {
                email: editorEmail,
                password: editorPassword
            });
            editorToken = editorLogin.data.token;
            console.log('✅ Editor logged in.');
        } catch (err) {
            console.error('❌ Editor login failed:', err.response?.data?.message || err.message);
            return;
        }

        // 3. Test Unauthorized Access (Editor trying to delete a blog)
        console.log('\n--- 3. Testing RBAC Restriction (Editor Delete Blog) ---');
        try {
            // First get a blog ID if possible, or use a dummy
            const blogRes = await axios.get(`${API_URL}/admin/blogs`, {
                headers: { Authorization: `Bearer ${editorToken}` }
            });
            const blogId = blogRes.data.blogs?.[0]?.blog_id || 'dummy-uuid';

            console.log(`Attempting to delete blog ${blogId} as Editor...`);
            const deleteRes = await axios.delete(`${API_URL}/admin/blogs/${blogId}`, {
                headers: { Authorization: `Bearer ${editorToken}` }
            });
            console.log('❌ ERROR: Editor was allowed to delete a blog!');
        } catch (err) {
            if (err.response?.status === 403) {
                console.log('✅ SUCCESS: Editor blocked with 403 Forbidden.');
                console.log(`   Message: "${err.response.data.message}"`);
            } else {
                console.log(`❌ Unexpected Error: ${err.response?.status} ${err.response?.data?.message}`);
            }
        }

        // 4. Test Dashboard Stats Filtering
        console.log('\n--- 4. Testing Role-Based Dashboard Response ---');
        try {
            const dashRes = await axios.get(`${API_URL}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${editorToken}` }
            });
            console.log('✅ Dashboard fetched for Editor.');
            console.log('   Stats keys returned:', Object.keys(dashRes.data.stats));
            
            if (dashRes.data.stats.ordersOverview && !dashRes.data.stats.revenue) {
                console.log('✅ SUCCESS: Dashboard filtered. Revenue hidden from Editor.');
            } else {
                console.log('⚠️ Warning: Dashboard might not be fully filtered or returned revenue.');
            }
        } catch (err) {
            console.log('❌ Dashboard fetch failed for Editor:', err.message);
        }

        // 5. Audit Logging Verification (as Admin)
        console.log('\n--- 5. Audit Logging Verification (Admin) ---');
        if (adminToken) {
            const couponData = {
                code: 'TEST_RBAC_' + Math.floor(Math.random() * 10000),
                discount_type: 'percentage',
                value: 10,
                expiration_date: '2026-12-31'
            };
            
            console.log('Creating a coupon as Admin...');
            await axios.post(`${API_URL}/admin/coupons`, couponData, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            console.log('Fetching audit logs...');
            const logsRes = await axios.get(`${API_URL}/admin/reports/audit-logs`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            const lastLog = logsRes.data.logs?.[0];
            if (lastLog && lastLog.action === 'CREATE') {
                console.log(`✅ Audit Log Verified: ${lastLog.module} - ${lastLog.action}`);
            }
        }

    } catch (error) {
        console.error('❌ Test runner error:', error.message);
    }
}

// Get credentials from command line
const email = process.argv[2];
const pass = process.argv[3];

if (!email || !pass) {
    console.log('Usage: node backend/tests/rbac_verification.js <editor_email> <editor_password>');
} else {
    runTests(email, pass);
}
