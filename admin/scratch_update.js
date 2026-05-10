const fs = require('fs');
const file = 'c:/Users/DINESH/Desktop/adbut/adbuth-site/admin/app/(dashboard)/products/view/[id]/page.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
    '<fieldset disabled className="space-y-8 opacity-90 pointer-events-none">',
    '<fieldset disabled className="space-y-8 opacity-90">'
);

c = c.replace(
    /<div className="relative mt-2 w-32 h-32 rounded-xl border border-\\[#2d1b4e\\] overflow-hidden">/g,
    '<div className="relative mt-2 w-32 h-32 rounded-xl border border-[#2d1b4e] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(formData.thumbnail instanceof File ? URL.createObjectURL(formData.thumbnail) : formData.thumbnail, \'_blank\')}>'
);

c = c.replace(
    /<div className="relative w-20 h-20 rounded-lg border border-\\[#2d1b4e\\] overflow-hidden">/g,
    '<div className="relative w-20 h-20 rounded-lg border border-[#2d1b4e] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(src, \'_blank\')}>'
);

fs.writeFileSync(file, c);
console.log('Done');
