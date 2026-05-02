const fs = require('fs');
const file = 'routes/adminRoutes.js';
let c = fs.readFileSync(file, 'utf8');

const fixes = [
    // 1. Staff PUT — wasAdmin/willBeAdmin name checks → role_id
    [
        `            const wasAdmin = (staff.role || '').toLowerCase().includes('admin');\r\n            const willBeAdmin = roleRecord.name.toLowerCase().includes('admin');\r\n            if (wasAdmin && !willBeAdmin) {\r\n                const adminCount = await Admin.count({ where: { role: staff.role, is_active: true } });\r\n                if (adminCount <= 1) return res.status(400).json({ error: 'Cannot change role: at least one Super Admin must exist.' });\r\n            }`,
        `            // Protect the last Super Admin — check by role_id (ID is immutable, names can change)\r\n            const wasAdmin = staff.role_id === 1;\r\n            const willBeAdmin = roleRecord.role_id === 1;\r\n            if (wasAdmin && !willBeAdmin) {\r\n                const adminCount = await Admin.count({ where: { role_id: 1, is_active: true } });\r\n                if (adminCount <= 1) return res.status(400).json({ error: 'Cannot change role: at least one Super Admin must exist.' });\r\n            }`
    ],
    // 2. Staff DELETE — name check → role_id
    [
        `        if ((staff.role || '').toLowerCase().includes('admin')) {\r\n            const adminCount = await Admin.count({ where: { role: staff.role, is_active: true } });\r\n            if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last Super Admin account.' });\r\n        }`,
        `        // Protect the last Super Admin — use role_id = 1, not role name\r\n        if (staff.role_id === 1) {\r\n            const adminCount = await Admin.count({ where: { role_id: 1, is_active: true } });\r\n            if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last Super Admin account.' });\r\n        }`
    ],
    // 3. Roles POST — create guard
    [
        `        // Only admin role can create roles\r\n        if (req.user.role !== 'admin') {\r\n            return res.status(403).json({ error: 'Only Super Admins can create roles.' });\r\n        }`,
        `        // Only Super Admin (role_id === 1) can create roles\r\n        if (req.user.role_id !== 1) {\r\n            return res.status(403).json({ error: 'Only Super Admins can create roles.' });\r\n        }`
    ],
    // 4. Roles PUT — edit guard
    [
        `        if (req.user.role !== 'admin') {\r\n            return res.status(403).json({ error: 'Only Super Admins can edit roles.' });\r\n        }`,
        `        if (req.user.role_id !== 1) {\r\n            return res.status(403).json({ error: 'Only Super Admins can edit roles.' });\r\n        }`
    ],
    // 5. Roles DELETE — delete guard
    [
        `        if (req.user.role !== 'admin') {\r\n            return res.status(403).json({ error: 'Only Super Admins can delete roles.' });\r\n        }`,
        `        if (req.user.role_id !== 1) {\r\n            return res.status(403).json({ error: 'Only Super Admins can delete roles.' });\r\n        }`
    ],
    // 6. Roles seed — seed guard
    [
        `        if (req.user.role !== 'admin') {\r\n            return res.status(403).json({ error: 'Only Super Admins can seed roles.' });\r\n        }`,
        `        if (req.user.role_id !== 1) {\r\n            return res.status(403).json({ error: 'Only Super Admins can seed roles.' });\r\n        }`
    ],
];

let applied = 0;
for (const [find, replace] of fixes) {
    if (c.includes(find)) {
        c = c.replace(find, replace);
        applied++;
        console.log(`✅ Applied fix ${applied}`);
    } else {
        // Try LF-only version
        const findLF = find.replace(/\r\n/g, '\n');
        const replaceLF = replace.replace(/\r\n/g, '\n');
        if (c.includes(findLF)) {
            c = c.replace(findLF, replaceLF);
            applied++;
            console.log(`✅ Applied fix ${applied} (LF)`);
        } else {
            console.log(`❌ MISS on fix ${applied + 1}: ${find.substring(0, 60)}`);
        }
    }
}

fs.writeFileSync(file, c, 'utf8');
console.log(`\nDone. ${applied}/6 fixes applied.`);

// Verify no name-based admin checks remain in key areas
const remaining = (c.match(/role !== 'admin'|role === 'admin'|\.includes\('admin'\)/g) || []);
console.log(`Remaining name-based checks: ${remaining.length}`);
if (remaining.length > 0) console.log(remaining.slice(0, 5));
