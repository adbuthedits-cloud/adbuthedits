const fs = require('fs');
const file = 'app/(dashboard)/products/view/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

// Use a RegExp to cleanly locate and obliterate the fractured Update Button HTML at the end of the form
content = content.replace(/\s*Updating Product\.\.\.[\s\S]*?<\/button>\s*<\/div>/, '');

fs.writeFileSync(file, content);
console.log('Fractured HTML obliteration completed successfully.');
