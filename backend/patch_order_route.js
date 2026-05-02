const fs = require('fs');
let content = fs.readFileSync('./routes/adminRoutes.js', 'utf8');

// Fix GET /orders/:id to include assignedEmployee
const oldSnippet = "                {\r\n                    model: Payment,\r\n                    as: 'payment'\r\n                }\r\n            ]\r\n        });\r\n\r\n        if (!order) return res.status(404).json({ error: 'Order not found' });";
const newSnippet = "                {\r\n                    model: Payment,\r\n                    as: 'payment'\r\n                },\r\n                {\r\n                    model: Admin,\r\n                    as: 'assignedEmployee',\r\n                    attributes: ['admin_id', 'first_name', 'last_name', 'role'],\r\n                    required: false\r\n                }\r\n            ]\r\n        });\r\n\r\n        if (!order) return res.status(404).json({ error: 'Order not found' });";

if (content.includes(oldSnippet)) {
    content = content.replace(oldSnippet, newSnippet);
    fs.writeFileSync('./routes/adminRoutes.js', content);
    console.log('SUCCESS: assignedEmployee added to GET /orders/:id');
} else {
    // Try unix line endings fallback
    const oldLf = oldSnippet.replace(/\r\n/g, '\n');
    if (content.includes(oldLf)) {
        content = content.replace(oldLf, newSnippet.replace(/\r\n/g, '\n'));
        fs.writeFileSync('./routes/adminRoutes.js', content);
        console.log('SUCCESS (LF): assignedEmployee added to GET /orders/:id');
    } else {
        console.log('NOT FOUND - snippet does not match. Inspecting area...');
        const idx = content.indexOf("as: 'payment'");
        console.log('Context around as:payment:', JSON.stringify(content.slice(Math.max(0,idx-80), idx+150)));
    }
}
