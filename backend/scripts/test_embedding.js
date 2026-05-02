const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const test = async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent("Test");
        console.log("Embedding Success. Length:", result.embedding.values.length);
    } catch (e) {
        console.error("Embedding Failed:", e.message);
    }
};

test();
