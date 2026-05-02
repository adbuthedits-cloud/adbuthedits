/**
 * Final cleanup: remove duplicate imports, fix 'use client' placement,
 * fix batch-added withPermission wraps for pages that had export default function
 */

const fs = require('fs');
const path = require('path');
const BASE = 'app/(dashboard)';

const PAGES = [
    { dir: 'master-data',    module: 'master_data' },
    { dir: 'orders',         module: 'orders' },
    { dir: 'reviews',        module: 'reviews' },
    { dir: 'staff',          module: 'staff' },
    { dir: 'users',          module: 'users' },
    { dir: 'payments',       module: 'payments' },
    { dir: 'seo',            module: 'seo' },
    { dir: 'settings',       module: 'settings' },
    { dir: 'blog-categories',module: 'blog_categories' },
];

for (const page of PAGES) {
    const filePath = path.join(BASE, page.dir, 'page.js');
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filePath} not found`);
        continue;
    }

    let c = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Remove duplicate withPermission imports
    const dupPattern = /(import withPermission from '\.\.\/\.\.\/\.\.\/components\/withPermission';\n)(?=[\s\S]*import withPermission from)/;
    if (dupPattern.test(c)) {
        c = c.replace(dupPattern, '');
        changed = true;
        console.log(`  🔧 Removed duplicate withPermission import`);
    }

    // 2. Remove duplicate getAuthUser imports
    const dupAuthPattern = /(import \{ getAuthToken, getAuthUser, hasPermission \} from '\.\.\/\.\.\/\.\.\/utils\/auth';\n)(?=[\s\S]*import \{ getAuthToken, getAuthUser, hasPermission \})/;
    if (dupAuthPattern.test(c)) {
        c = c.replace(dupAuthPattern, '');
        changed = true;
        console.log(`  🔧 Removed duplicate auth import`);
    }

    // 3. Ensure 'use client' is on first line
    if (!c.trimStart().startsWith('"use client"') && !c.trimStart().startsWith("'use client'")) {
        // It might be buried — find and move it
        c = c.replace(/^(import withPermission[^\n]*\n)('use client';)/, `$2\n$1`);
        changed = true;
        console.log(`  🔧 Fixed 'use client' placement`);
    }

    // 4. Check withPermission is used (export at bottom)
    if (!c.includes(`export default withPermission`)) {
        // Find the default export function name and wrap it
        const match = c.match(/^export default function (\w+)/m);
        if (match) {
            const name = match[1];
            c = c.replace(`export default function ${name}`, `function ${name}`);
            c = c.trimEnd() + `\n\nexport default withPermission(${name}, '${page.module}');\n`;
            changed = true;
            console.log(`  🔧 Wrapped ${name} with withPermission('${page.module}')`);
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, c, 'utf8');
        console.log(`✅ ${page.dir}/page.js — fixed`);
    } else {
        console.log(`⏭️  ${page.dir}/page.js — no changes needed`);
    }
}

console.log('\n=== Final cleanup complete ===');
