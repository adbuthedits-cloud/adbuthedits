const fs = require('fs');
const file = 'app/(dashboard)/master-data/page.js';
let c = fs.readFileSync(file, 'utf8');

// Fix 'use client' directive - must be first line
if (c.startsWith("import withPermission")) {
    // Remove the misplaced withPermission import at top
    c = c.replace("import withPermission from '../../../components/withPermission';\n", '');
    // Fix 'use client' to be at top (it's currently after the removed line)
    if (!c.startsWith("'use client'")) {
        c = "'use client';\n" + c.replace("'use client';", '').trim() + '\n';
    }
}

// Add getAuthUser and hasPermission to auth import if not present
if (!c.includes('getAuthUser')) {
    c = c.replace(
        "import { getAuthToken } from '../../../utils/auth';",
        "import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';\nimport withPermission from '../../../components/withPermission';"
    );
}

// Add export at end if missing
if (!c.includes('export default withPermission')) {
    c = c.trimEnd() + '\n\nexport default withPermission(MasterDataPage, "master_data");\n';
}

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed! First 300 chars:\n', c.substring(0, 300));
console.log('\nLast 100 chars:\n', c.slice(-100));
