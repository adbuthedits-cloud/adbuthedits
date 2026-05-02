const fs = require('fs');
const f = 'app/(dashboard)/users/edit/[id]/page.js';
let c = fs.readFileSync(f, 'utf8');

// Fix: from [id] folder deep in users/edit/[id]/, utils is at ../../../../../../utils
// Path: app/(dashboard)/users/edit/[id]/page.js
// To reach admin/utils: go up 5 dirs (page.js -> [id] -> edit -> users -> (dashboard) -> app -> admin root)
// So: ../../../../../utils/auth

c = c.split('../../../../utils/auth').join('../../../../../utils/auth');
c = c.split('../../../../utils/').join('../../../../../utils/');
c = c.split('../../../../components/').join('../../../../../components/');

fs.writeFileSync(f, c, 'utf8');

const lines = c.split('\n').slice(0, 12);
lines.forEach((l, i) => console.log((i+1) + ': ' + l));
