const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-ultra" // Unlikely free, but checking.
];

const test = async () => {
    console.log("Testing 'Latest' Model Aliases...");

    for (const mName of models) {
        process.stdout.write(`Testing ${mName}... `);
        try {
            const model = genAI.getGenerativeModel({ model: mName });
            const result = await model.generateContent("Hello?");
            console.log(`✅ SUCCESS!`);
            console.log("Response:", result.response.text());
            process.exit(0);
        } catch (e) {
            console.log(`❌ FAILED.`);
            // console.log(e.message);
        }
    }
    console.log("\nAll latest model aliases failed.");
};

test();
