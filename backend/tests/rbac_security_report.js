/**
 * RBAC Security Verification & Report
 * Tests ALL API endpoints with Admin, Editor, and unauthenticated access.
 * Uses direct JWT tokens for reliable testing.
 * 
 * Usage: node tests/rbac_security_report.js [--admin-pass=PASS] [--editor-email=EMAIL]
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

const API_BASE = process.env.API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

const results = { passed: 0, failed: 0, warnings: 0, tests: [] };

function log(status, label, details = '') {
    const icons = { PASS: '✅', FAIL: '❌', WARN: '⚠️', INFO: 'ℹ️' };
    const line = `${icons[status]} [${status}] ${label}${details ? ' — ' + details : ''}`;
    console.log(line);
    if (status === 'PASS') results.passed++;
    if (status === 'FAIL') results.failed++;
    if (status === 'WARN') results.warnings++;
    results.tests.push({ status, label, details });
}

function makeToken(admin) {
    return jwt.sign({
        user: {
            id: admin.admin_id,
            role: admin.role,
            type: 'admin',
            permissions: admin.permissions || {},
            first_name: admin.first_name,
            last_name: admin.last_name,
            email: admin.email
        }
    }, JWT_SECRET, { expiresIn: '1h' });
}

async function testEndpoint(token, method, path, expectedStatus, label, body = null) {
    try {
        const config = {
            method,
            url: `${API_BASE}${path}`,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            validateStatus: () => true,
            timeout: 10000,
        };
        if (body) config.data = body;
        const res = await axios(config);

        const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
        if (expected.includes(res.status)) {
            log('PASS', label, `${method} ${path} → ${res.status}`);
        } else {
            log('FAIL', label, `${method} ${path} → Expected [${expected.join(',')}], Got ${res.status} — ${res.data?.error || res.data?.msg || ''}`);
        }
        return res.status;
    } catch (e) {
        log('FAIL', label, `${method} ${path} → Network Error: ${e.message}`);
        return 0;
    }
}

async function runTests() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║         ADBUTH ADMIN — RBAC SECURITY REPORT                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`API: ${API_BASE}\n`);

    // ─── Load tokens directly from DB ─────────────────────────────────────
    const adminUser = await Admin.findOne({ where: { role: 'admin', is_active: true } });
    const editorUser = await Admin.findOne({ where: { role: 'editor', is_active: true } });

    if (!adminUser) {
        console.log('❌ No active Super Admin found in DB. Aborting.\n');
        process.exit(1);
    }

    const adminToken = makeToken(adminUser);
    const editorToken = editorUser ? makeToken(editorUser) : null;

    console.log(`Super Admin: ${adminUser.email} (role: ${adminUser.role})`);
    if (editorUser) {
        console.log(`Editor:      ${editorUser.email} (role: ${editorUser.role})`);
        console.log(`Editor Perms: ${JSON.stringify(editorUser.permissions)}`);
    }
    console.log('');

    // ─── STEP 1: Super Admin Full Access ──────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1: Super Admin — Full Access (all should be 200)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const adminTests = [
        ['GET', '/api/admin/dashboard',         200, 'Dashboard'],
        ['GET', '/api/admin/orders',             200, 'Orders list'],
        ['GET', '/api/admin/products',           200, 'Products list'],
        ['GET', '/api/admin/blogs',              200, 'Blogs list'],
        ['GET', '/api/admin/blog-categories',    200, 'Blog Categories'],
        ['GET', '/api/admin/reviews',            200, 'Reviews list'],
        ['GET', '/api/admin/payments',           200, 'Payments list'],
        ['GET', '/api/admin/coupons',            200, 'Coupons list'],
        ['GET', '/api/admin/users',              200, 'Customers list'],
        ['GET', '/api/admin/staff',              200, 'Staff list'],
        ['GET', '/api/admin/roles',              200, 'Roles list'],
        ['GET', '/api/admin/master-data',        200, 'Master Data'],
        ['GET', '/api/admin/reports/attendance', 200, 'Attendance report'],
        ['GET', '/api/admin/reports/audit-logs', 410, 'Audit logs → 410 Gone (removed)'],
    ];

    for (const [method, path, status, label] of adminTests) {
        await testEndpoint(adminToken, method, path, status, `[ADMIN] ${label}`);
    }

    // ─── STEP 2: Editor — Allowed Routes ──────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: Editor — Allowed Routes (should return 200)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!editorToken) {
        log('WARN', 'Editor tests skipped', 'No editor user found in database');
    } else {
        // Editor has: orders:view, products:view+edit, marketing:view, reviews:view, blogs:view+edit
        const editorAllowed = [
            ['GET', '/api/admin/dashboard',       200, 'Dashboard (allowed)'],
            ['GET', '/api/admin/orders',           200, 'Orders view (has view)'],
            ['GET', '/api/admin/products',         200, 'Products view (has view)'],
            ['GET', '/api/admin/blogs',            200, 'Blogs view (has view)'],
            ['GET', '/api/admin/reviews',          200, 'Reviews view (has view)'],
        ];

        for (const [method, path, status, label] of editorAllowed) {
            await testEndpoint(editorToken, method, path, status, `[EDITOR-ALLOWED] ${label}`);
        }

        // ─── STEP 3: Editor — Blocked Routes ──────────────────────────────
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('STEP 3: Editor — Restricted Routes (must return 403)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const editorBlocked = [
            ['GET',    '/api/admin/payments',             403, 'Payments — blocked (no payments perm)'],
            // Editor HAS marketing:view so GET /coupons returns 200 — CORRECT behavior
            // ['GET', '/api/admin/coupons',              403, 'Coupons list — editor has marketing:view so allowed'],
            ['GET',    '/api/admin/users',                403, 'Customers — blocked (no users perm)'],
            ['GET',    '/api/admin/staff',                403, 'Staff list — blocked (no staff perm)'],
            ['GET',    '/api/admin/roles',                403, 'Roles list — blocked (no staff perm)'],
            ['GET',    '/api/admin/master-data',          403, 'Master Data — blocked (no master_data perm)'],
            ['GET',    '/api/admin/reports/attendance',   403, 'Attendance — blocked (no staff perm)'],
            ['DELETE', '/api/admin/blogs/nonexistent',    403, 'Blog DELETE — blocked (no delete perm)'],
            ['DELETE', '/api/admin/products/nonexistent', 403, 'Product DELETE — blocked (no delete perm)'],
            ['DELETE', '/api/admin/reviews/nonexistent',  403, 'Review DELETE — blocked (no delete perm)'],
            ['POST',   '/api/admin/coupons',              403, 'Coupon CREATE — blocked (no marketing edit)'],
            ['DELETE', '/api/admin/coupons/nonexistent',  403, 'Coupon DELETE — blocked (no marketing delete)'],
            ['POST',   '/api/admin/staff',                403, 'Staff CREATE — blocked (no staff perm)'],
            ['DELETE', '/api/admin/staff/nonexistent',    403, 'Staff DELETE — blocked (no staff perm)'],
            ['POST',   '/api/admin/roles',                403, 'Roles CREATE — blocked (no staff perm)'],
            ['DELETE', '/api/admin/roles/1',              403, 'Roles DELETE — blocked (no staff perm)'],
            ['POST',   '/api/seo/pages',                  403, 'SEO edit — blocked (no seo perm)'],
        ];

        for (const [method, path, status, label] of editorBlocked) {
            await testEndpoint(editorToken, method, path, status, `[EDITOR-BLOCKED] ${label}`);
        }

        // ─── STEP 4: Editor — Mutating Allowed Modules ────────────────────
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('STEP 4: Editor — Edits in Allowed Modules (NOT 403)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // These should pass permission check and fail only due to invalid ID (404/400), NOT 403
        const editorCanEdit = [
            ['PUT',   '/api/admin/blogs/nonexistent',             [404, 400], 'Blog PUT reaches handler (not 403)'],
            ['PUT',   '/api/admin/products/nonexistent',          [404, 400], 'Product PUT reaches handler (not 403)'],
            ['PATCH', '/api/admin/reviews/nonexistent/status',    [404, 400], 'Review status PATCH reaches handler (not 403)'],
        ];

        for (const [method, path, statuses, label] of editorCanEdit) {
            await testEndpoint(editorToken, method, path, statuses, `[EDITOR-EDIT] ${label}`);
        }
    }

    // ─── STEP 5: Unauthenticated Access ───────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 5: No Token — All should return 401');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const unauthTests = [
        ['GET',    '/api/admin/dashboard', 401, 'Dashboard without token'],
        ['GET',    '/api/admin/orders',    401, 'Orders without token'],
        ['GET',    '/api/admin/staff',     401, 'Staff without token'],
        ['DELETE', '/api/admin/blogs/1',   401, 'Blog delete without token'],
        ['POST',   '/api/admin/roles',     401, 'Role create without token'],
        ['POST',   '/api/seo/pages',       401, 'SEO edit without token'],
    ];

    for (const [method, path, status, label] of unauthTests) {
        await testEndpoint(null, method, path, status, `[UNAUTH] ${label}`);
    }

    // ─── FINAL REPORT ─────────────────────────────────────────────────────
    const total = results.passed + results.failed + results.warnings;
    const pct = total > 0 ? Math.round((results.passed / (results.passed + results.failed)) * 100) : 0;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                     FINAL REPORT                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`\n  ✅ PASSED:   ${results.passed}`);
    console.log(`  ❌ FAILED:   ${results.failed}`);
    console.log(`  ⚠️  WARNINGS: ${results.warnings}`);
    console.log(`  Total:      ${total}`);
    console.log(`\n  Security Score: ${pct}%`);

    if (results.failed === 0) {
        console.log('\n  🏆 ALL TESTS PASSED — RBAC is correctly configured!\n');
    } else {
        console.log('\n  🚨 SOME TESTS FAILED — Review failures below:\n');
        results.tests.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`     ❌ ${t.label}: ${t.details}`);
        });
        console.log('');
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error('Test runner crashed:', e.message);
    process.exit(1);
});
