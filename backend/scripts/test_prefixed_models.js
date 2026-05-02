const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
    "models/gemini-1.5-flash",
    "models/gemini-pro",
    "gemini-1.0-pro-latest"
];

const test = async () => {
    for (const mName of models) {
        console.log(`Testing: ${mName}`);
        try {
            const model = genAI.getGenerativeModel({ model: mName });
            const result = await model.generateContent("Hi");
            console.log(`SUCCESS: ${mName}`);
            process.exit(0);
        } catch (e) {
            console.log(`FAILED: ${mName} -> ${e.message}`);
        }
    }
};

test();
