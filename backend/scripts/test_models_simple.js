const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = ["gemini-1.5-flash", "gemini-pro"];

const test = async () => {
    console.log("Testing API Key with specific models...");
    let success = false;

    for (const mName of models) {
        process.stdout.write(`Testing ${mName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: mName });
            const result = await model.generateContent("Test");
            console.log(`✅ SUCCESS!`);
            // console.log("Response:", result.response.text());
            success = true;
        } catch (e) {
            console.log(`❌ FAILED.`);
            // console.log(e.message);
        }
    }

    if (!success) {
        console.log("\nBoth models failed. Check your API Key permissions.");
    }
};

test();
