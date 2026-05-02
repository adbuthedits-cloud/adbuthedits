const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../routes/adminRoutes.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add GET /products list route before the POST /products route
// Currently there is only a public /api/products route — admin needs its own
const insertAfterProducts = `// --- PRODUCT MANAGEMENT (Admin specific Create/Update/Delete) ---\r\n// Note: We already have public GET routes in productRoutes. These are protected write ops.\r\n`;

const addProductsGet = `// --- PRODUCT MANAGEMENT (Admin specific Create/Update/Delete) ---\r\n// Note: Admin GET /products list for dashboard use\r\n\r\nrouter.get('/products', checkPermission('products', 'view'), async (req, res) => {\r\n    try {\r\n        const { page = 1, limit = 50, search, category } = req.query;\r\n        const offset = (parseInt(page) - 1) * parseInt(limit);\r\n        const where = {};\r\n        if (search) where[Op.or] = [\r\n            { title: { [Op.like]: \`%\${search}%\` } },\r\n            { internal_sku: { [Op.like]: \`%\${search}%\` } }\r\n        ];\r\n        if (category) where.parent_category_id = category;\r\n\r\n        const { count, rows } = await Product.findAndCountAll({\r\n            where,\r\n            include: [{ model: Category, as: 'parentCategory', attributes: ['category_name'] }],\r\n            order: [['createdAt', 'DESC']],\r\n            limit: parseInt(limit),\r\n            offset\r\n        });\r\n        res.json({ total: count, page: parseInt(page), products: rows });\r\n    } catch (err) {\r\n        res.status(500).json({ error: err.message });\r\n    }\r\n});\r\n\r\n`;

content = content.replace(insertAfterProducts, addProductsGet);

// Fix 2: Update editor permissions in DB - add dashboard:view and reviews:edit
// This is done via DB update script (handled separately)

// Fix 3: Fix coupons list - it currently uses 'marketing' view which editor has
// The test expectation was wrong. Editor HAS marketing:view so coupons list returning 200 is CORRECT.
// We should NOT block GET /coupons for those with marketing:view - it's working as intended.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed: Added GET /products admin route');
console.log('File size:', fs.statSync(filePath).size, 'bytes');
