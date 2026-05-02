const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-pro"
];

const test = async () => {
    console.log("Testing API Key with Flash/Preview models...");
    let workingModel = null;

    for (const mName of models) {
        process.stdout.write(`Testing ${mName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: mName });
            const result = await model.generateContent("Hello, are you online?");
            console.log(`✅ SUCCESS!`);
            // console.log("Response:", result.response.text());
            workingModel = mName;
            break; // Stop at first success? Or test all? Let's stop to save time/quota if user just wants one working.
            // Actually user asked for "flash preview", so if 1.5-flash works, great. If 2.0 works, great.
        } catch (e) {
            console.log(`❌ FAILED.`);
            // console.log(e.message);
        }
    }

    if (workingModel) {
        console.log(`\nFound working model: ${workingModel}`);
    } else {
        console.log("\nAll models failed. API Key might still be restricted.");
    }
};

test();
