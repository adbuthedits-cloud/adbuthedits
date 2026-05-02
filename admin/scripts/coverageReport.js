const fs = require('fs');
const path = require('path');

const BASE = 'app/(dashboard)';
const dirs = fs.readdirSync(BASE).filter(d => fs.statSync(path.join(BASE, d)).isDirectory());

console.log('=== Frontend Permission Coverage Report ===\n');
let score = 0, total = 0;

dirs.forEach(dir => {
    const file = path.join(BASE, dir, 'page.js');
    if (!fs.existsSync(file)) return;
    const c = fs.readFileSync(file, 'utf8');
    total++;
    
    const hasHOC = c.includes('withPermission');
    const hasButtonGating = c.includes('canEdit') || c.includes('canDelete');
    const firstLine = c.split('\n')[0].trim();
    const hasUseClient = firstLine === '"use client";' || firstLine === "'use client';";
    
    if (hasHOC) score++;
    
    const status = hasHOC ? '✅' : '❌';
    const btns = hasButtonGating ? '  [+button gating]' : '';
    const clientWarning = !hasUseClient ? '  ⚠️  MISSING use client' : '';
    
    console.log(status + ' /' + dir + btns + clientWarning);
});

console.log('\nScore: ' + score + '/' + total + ' pages protected');
