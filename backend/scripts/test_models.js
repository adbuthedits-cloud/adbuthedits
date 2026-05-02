const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro",
    "gemini-pro-vision" // Just to check
];

const test = async () => {
    console.log("Testing Models...");
    for (const mName of models) {
        console.log(`\nTesting: ${mName}`);
        try {
            const model = genAI.getGenerativeModel({ model: mName });
            const result = await model.generateContent("Hi");
            console.log(`SUCCESS: ${mName}`);
            console.log("Response:", result.response.text());
            process.exit(0); // Found one!
        } catch (e) {
            console.log(`FAILED: ${mName} -> ${e.message}`);
        }
    }
};

test();
