const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function testModels() {
    console.log("Testing API Key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");

    for (const modelName of models) {
        try {
            console.log(`\nTesting model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'OK'");
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}:`, response.text());
            return; // Exit on first success
        } catch (error) {
            console.log(`❌ FAILED ${modelName}: ${error.message.split('\n')[0]}`);
        }
    }
}

testModels();
