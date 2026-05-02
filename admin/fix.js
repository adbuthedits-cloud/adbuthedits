const fs = require('fs');
const file = 'app/(dashboard)/products/view/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add timestamps
content = content.replace(/canonical_url:\s*product\.canonical_url\s*\|\|\s*''/g, "canonical_url: product.canonical_url || '',\n                        createdAt: product.createdAt,\n                        updatedAt: product.updatedAt");

// 2. Change Headers
content = content.replace(/>Edit Product<\/h1>/g, '>View Product</h1>');
content = content.replace(/>Update product details<\/p>/g, '>Viewing read-only product details</p>');

// 3. Remove fixed button
content = content.replace(/<div className="fixed bottom-0 left-0 right-0[\s\S]*?<\/div>/g, '');

fs.writeFileSync(file, content);
console.log('Fixes applied successfully!');
