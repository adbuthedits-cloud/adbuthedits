/**
 * Batch Frontend Permission Gating Script
 * Adds withPermission HOC and hasPermission button gates to all admin pages
 */

const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\DINESH\\Desktop\\adbut\\adbuth-site\\admin\\app\\(dashboard)';

// Helper: add withPermission wrap if missing
function addWithPermission(content, moduleName) {
    if (content.includes('withPermission')) return content;
    const importLine = `import withPermission from '../../../components/withPermission';\n`;
    // Add after the last import
    content = content.replace(
        /^import .+;\s*$/m,
        (m) => m,
    );
    // add import at top section
    content = importLine + content;
    
    // Change export default function X() => function X()
    content = content.replace(/^export default function (\w+)/m, (m, name) => {
        // Add export at bottom
        content = content + `\nexport default withPermission(${name}, '${moduleName}');\n`;
        return `function ${name}`;
    });
    return content;
}

// ============================================================
// 1. ORDERS PAGE - add withPermission
// ============================================================
const ordersPath = path.join(BASE, 'orders', 'page.js');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

if (!ordersContent.includes('withPermission')) {
    // Replace import and add permission wrapping
    ordersContent = ordersContent.replace(
        `import { getAuthToken } from '../../../utils/auth';`,
        `import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';\nimport withPermission from '../../../components/withPermission';`
    );
    // Change export default function to named function
    ordersContent = ordersContent.replace(
        'export default function Orders()',
        'function Orders()'
    );
    // Remove the last closing and add export
    ordersContent = ordersContent.trimEnd();
    ordersContent += '\n\nexport default withPermission(Orders, \'orders\');\n';
    
    // Add user/canEdit after function opening
    ordersContent = ordersContent.replace(
        'function Orders() {\n    const [orders',
        'function Orders() {\n    const user = getAuthUser();\n    const canEdit = hasPermission(user, \'orders\', \'edit\');\n\n    const [orders'
    );
    
    fs.writeFileSync(ordersPath, ordersContent, 'utf8');
    console.log('✅ orders/page.js — added withPermission + hasPermission');
} else {
    console.log('⏭️  orders/page.js — already has withPermission');
}

// ============================================================
// 2. REVIEWS PAGE - check and update
// ============================================================
const reviewsPath = path.join(BASE, 'reviews', 'page.js');
if (fs.existsSync(reviewsPath)) {
    let reviewsContent = fs.readFileSync(reviewsPath, 'utf8');
    const needsUpdate = !reviewsContent.includes('withPermission');
    
    if (needsUpdate) {
        // Add import
        reviewsContent = reviewsContent.replace(
            /^import \{ getAuthToken[^}]*\} from '\.\.\/\.\.\/\.\.\/utils\/auth';/m,
            `import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';\nimport withPermission from '../../../components/withPermission';`
        );
        if (!reviewsContent.includes('withPermission')) {
            reviewsContent = `import withPermission from '../../../components/withPermission';\nimport { getAuthUser, hasPermission } from '../../../utils/auth';\n` + reviewsContent;
        }
        // Change export default
        reviewsContent = reviewsContent.replace(
            /export default function (\w+Reviews?\w*)\(\)/,
            (m, name) => {
                reviewsContent += `\nexport default withPermission(${name}, 'reviews');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(reviewsPath, reviewsContent, 'utf8');
        console.log('✅ reviews/page.js — added withPermission');
    } else {
        console.log('⏭️  reviews/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  reviews/page.js — NOT FOUND');
}

// ============================================================
// 3. STAFF PAGE - check and update
// ============================================================
const staffPath = path.join(BASE, 'staff', 'page.js');
if (fs.existsSync(staffPath)) {
    let content = fs.readFileSync(staffPath, 'utf8');
    if (!content.includes('withPermission')) {
        content = `import withPermission from '../../../components/withPermission';\n` + content;
        content = content.replace(
            /export default function (\w+)\(\)/,
            (m, name) => {
                content += `\nexport default withPermission(${name}, 'staff');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(staffPath, content, 'utf8');
        console.log('✅ staff/page.js — added withPermission(staff)');
    } else {
        console.log('⏭️  staff/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  staff/page.js — NOT FOUND');
}

// ============================================================
// 4. USERS (Customers) PAGE - check and update
// ============================================================
const usersPath = path.join(BASE, 'users', 'page.js');
if (fs.existsSync(usersPath)) {
    let content = fs.readFileSync(usersPath, 'utf8');
    if (!content.includes('withPermission')) {
        content = `import withPermission from '../../../components/withPermission';\n` + content;
        content = content.replace(
            /export default function (\w+)\(\)/,
            (m, name) => {
                content += `\nexport default withPermission(${name}, 'users');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(usersPath, content, 'utf8');
        console.log('✅ users/page.js — added withPermission(users)');
    } else {
        console.log('⏭️  users/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  users/page.js — NOT FOUND');
}

// ============================================================
// 5. PAYMENTS PAGE - check and update
// ============================================================
const paymentsPath = path.join(BASE, 'payments', 'page.js');
if (fs.existsSync(paymentsPath)) {
    let content = fs.readFileSync(paymentsPath, 'utf8');
    if (!content.includes('withPermission')) {
        content = `import withPermission from '../../../components/withPermission';\n` + content;
        content = content.replace(
            /export default function (\w+)\(\)/,
            (m, name) => {
                content += `\nexport default withPermission(${name}, 'payments');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(paymentsPath, content, 'utf8');
        console.log('✅ payments/page.js — added withPermission(payments)');
    } else {
        console.log('⏭️  payments/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  payments/page.js — NOT FOUND');
}

// ============================================================
// 6. SEO PAGE - check and update
// ============================================================
const seoPath = path.join(BASE, 'seo', 'page.js');
if (fs.existsSync(seoPath)) {
    let content = fs.readFileSync(seoPath, 'utf8');
    if (!content.includes('withPermission')) {
        content = `import withPermission from '../../../components/withPermission';\n` + content;
        content = content.replace(
            /export default function (\w+)\(\)/,
            (m, name) => {
                content += `\nexport default withPermission(${name}, 'seo');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(seoPath, content, 'utf8');
        console.log('✅ seo/page.js — added withPermission(seo)');
    } else {
        console.log('⏭️  seo/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  seo/page.js — NOT FOUND');
}

// ============================================================
// 7. MASTER DATA PAGE - check and update
// ============================================================
const masterDataPath = path.join(BASE, 'master-data', 'page.js');
if (fs.existsSync(masterDataPath)) {
    let content = fs.readFileSync(masterDataPath, 'utf8');
    if (!content.includes('withPermission')) {
        content = `import withPermission from '../../../components/withPermission';\n` + content;
        content = content.replace(
            /export default function (\w+)\(\)/,
            (m, name) => {
                content += `\nexport default withPermission(${name}, 'master_data');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(masterDataPath, content, 'utf8');
        console.log('✅ master-data/page.js — added withPermission(master_data)');
    } else {
        console.log('⏭️  master-data/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  master-data/page.js — NOT FOUND');
}

// ============================================================
// 8. SETTINGS PAGE - check and update
// ============================================================
const settingsPath = path.join(BASE, 'settings', 'page.js');
if (fs.existsSync(settingsPath)) {
    let content = fs.readFileSync(settingsPath, 'utf8');
    if (!content.includes('withPermission')) {
        content = `import withPermission from '../../../components/withPermission';\n` + content;
        content = content.replace(
            /export default function (\w+)\(\)/,
            (m, name) => {
                content += `\nexport default withPermission(${name}, 'settings');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(settingsPath, content, 'utf8');
        console.log('✅ settings/page.js — added withPermission(settings)');
    } else {
        console.log('⏭️  settings/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  settings/page.js — NOT FOUND');
}

// ============================================================
// 9. AUDIT LOGS PAGE - replace with Gone notice
// ============================================================
const auditPath = path.join(BASE, 'audit-logs', 'page.js');
if (fs.existsSync(auditPath)) {
    const auditContent = `"use client";
import AdminLayout from '../../../components/AdminLayout';

export default function AuditLogsPage() {
    return (
        <AdminLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl max-w-lg w-full shadow-2xl text-center px-6 py-16">
                    <div className="text-4xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-white mb-3">Audit Logs Removed</h1>
                    <p className="text-gray-400 text-sm">Audit log functionality has been removed from this system.</p>
                </div>
            </div>
        </AdminLayout>
    );
}
`;
    fs.writeFileSync(auditPath, auditContent, 'utf8');
    console.log('✅ audit-logs/page.js — replaced with Gone notice');
}

// ============================================================
// 10. BLOG CATEGORIES PAGE - check and update
// ============================================================
const blogCatPath = path.join(BASE, 'blog-categories', 'page.js');
if (fs.existsSync(blogCatPath)) {
    let content = fs.readFileSync(blogCatPath, 'utf8');
    if (!content.includes('withPermission')) {
        content = `import withPermission from '../../../components/withPermission';\n` + content;
        content = content.replace(
            /export default function (\w+)\(\)/,
            (m, name) => {
                content += `\nexport default withPermission(${name}, 'blog_categories');\n`;
                return `function ${name}()`;
            }
        );
        fs.writeFileSync(blogCatPath, content, 'utf8');
        console.log('✅ blog-categories/page.js — added withPermission(blog_categories)');
    } else {
        console.log('⏭️  blog-categories/page.js — already has withPermission');
    }
} else {
    console.log('⚠️  blog-categories/page.js — NOT FOUND');
}

// ============================================================
// Summary
// ============================================================
console.log('\n=== Frontend permission gating batch update complete ===\n');
