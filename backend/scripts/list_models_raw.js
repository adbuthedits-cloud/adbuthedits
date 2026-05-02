const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                const fs = require('fs');
                const list = json.models.map(m => m.name).join('\n');
                fs.writeFileSync('models_list.txt', list);
                console.log("Written to models_list.txt");
            } else {
                console.log("No models found or error:", json);
            }
        } catch (e) {
            console.error("Parse Error:", e);
            console.log("Raw Response:", data);
        }
    });

}).on('error', (err) => {
    console.error("Error:", err.message);
});
