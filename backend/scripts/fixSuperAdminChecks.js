const fs = require('fs');
const file = 'routes/adminRoutes.js';
let c = fs.readFileSync(file, 'utf8');

// Replace all role_id === 1 / !== 1 checks with is_super_admin boolean
const fixes = [
    // Dashboard: isSuperAdmin = role_id === 1
    ['const isSuperAdmin = role_id === 1;', 'const isSuperAdmin = req.user.is_super_admin === true;'],
    // Staff PUT: wasAdmin = staff.role_id === 1
    ['const wasAdmin = staff.role_id === 1;', 'const wasAdmin = staff.role_id != null && staff.is_super_admin_role === true; // checked via DB'],
    // Simpler approach for staff PUT — check if the role_id being changed IS the first system role
    // Actually staff.role_id is from DB, not JWT. Use: check if the role record being left is_system
    // Roles POST guard
    ['if (req.user.role_id !== 1) {\n            return res.status(403).json({ error: \'Only Super Admins can create roles.\' });', 
     'if (req.user.is_super_admin !== true) {\n            return res.status(403).json({ error: \'Only Super Admins can create roles.\' });'],
    ['if (req.user.role_id !== 1) {\n            return res.status(403).json({ error: \'Only Super Admins can edit roles.\' });',
     'if (req.user.is_super_admin !== true) {\n            return res.status(403).json({ error: \'Only Super Admins can edit roles.\' });'],
    ['if (req.user.role_id !== 1) {\n            return res.status(403).json({ error: \'Only Super Admins can delete roles.\' });',
     'if (req.user.is_super_admin !== true) {\n            return res.status(403).json({ error: \'Only Super Admins can delete roles.\' });'],
    ['if (req.user.role_id !== 1) {\n            return res.status(403).json({ error: \'Only Super Admins can seed roles.\' });',
     'if (req.user.is_super_admin !== true) {\n            return res.status(403).json({ error: \'Only Super Admins can seed roles.\' });'],
];

let count = 0;
for (const [find, replace] of fixes) {
    const before = c;
    c = c.split(find).join(replace); // replaceAll
    if (c !== before) { count++; console.log('✅ Fixed:', find.substring(0, 50)); }
    else {
        // try CRLF
        const findCR = find.replace(/\n/g, '\r\n');
        const replaceCR = replace.replace(/\n/g, '\r\n');
        c = c.split(findCR).join(replaceCR);
        if (c !== before) { count++; console.log('✅ Fixed (CR):', find.substring(0, 50)); }
        else console.log('❌ Miss:', find.substring(0, 50));
    }
}

// Also handle staff PUT wasAdmin/willBeAdmin — these check staff.role_id from DB
// Replace with is_system check by joining the Role
const staffPutFix = [
    // old
    `            // Protect the last Super Admin — check by role_id (ID is immutable, names can change)\r\n            const wasAdmin = staff.role_id === 1;\r\n            const willBeAdmin = roleRecord.role_id === 1;\r\n            if (wasAdmin && !willBeAdmin) {\r\n                const adminCount = await Admin.count({ where: { role_id: 1, is_active: true } });\r\n                if (adminCount <= 1) return res.status(400).json({ error: 'Cannot change role: at least one Super Admin must exist.' });\r\n            }`,
    // new
    `            // Protect the last Super Admin — is_system flag on the role record (UUID-safe)\r\n            const wasAdmin = staff.role_id != null && (await Role.findByPk(staff.role_id))?.is_system === true;\r\n            const willBeAdmin = roleRecord.is_system === true;\r\n            if (wasAdmin && !willBeAdmin) {\r\n                const superRole = await Role.findOne({ where: { is_system: true } });\r\n                const adminCount = superRole ? await Admin.count({ where: { role_id: superRole.role_id, is_active: true } }) : 0;\r\n                if (adminCount <= 1) return res.status(400).json({ error: 'Cannot change role: at least one Super Admin must exist.' });\r\n            }`,
];
if (c.includes(staffPutFix[0])) {
    c = c.replace(staffPutFix[0], staffPutFix[1]);
    count++; console.log('✅ Fixed staff PUT wasAdmin check');
} else console.log('❌ Miss: staff PUT wasAdmin');

// Fix staff DELETE — replace role_id === 1 with is_system
const staffDelFix = [
    `        // Protect the last Super Admin — use role_id = 1, not role name\r\n        if (staff.role_id === 1) {\r\n            const adminCount = await Admin.count({ where: { role_id: 1, is_active: true } });\r\n            if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last Super Admin account.' });\r\n        }`,
    `        // Protect the last Super Admin — check is_system on staff's role (UUID-safe)\r\n        if (staff.role_id) {\r\n            const staffRole = await require('../models/Role').findByPk(staff.role_id);\r\n            if (staffRole?.is_system === true) {\r\n                const adminCount = await Admin.count({ where: { role_id: staff.role_id, is_active: true } });\r\n                if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last Super Admin account.' });\r\n            }\r\n        }`,
];
if (c.includes(staffDelFix[0])) {
    c = c.replace(staffDelFix[0], staffDelFix[1]);
    count++; console.log('✅ Fixed staff DELETE is_system check');
} else console.log('❌ Miss: staff DELETE');

// Fix dashboard can() helper
const dashFix = [
    'const isSuperAdmin = req.user.is_super_admin === true;',
    'const isSuperAdmin = req.user.is_super_admin === true; // UUID-safe: set from Role.is_system at login'
];
// Already replaced above — skip if already done

fs.writeFileSync(file, c, 'utf8');
console.log(`\nTotal fixes applied: ${count}`);

// Verify none of the old patterns remain
const remaining = [];
['role_id === 1', 'role_id !== 1', "role === 'admin'", "role !== 'admin'"].forEach(p => {
    if (c.includes(p)) remaining.push(p);
});
console.log('Remaining old patterns:', remaining.length === 0 ? 'NONE ✅' : remaining);
