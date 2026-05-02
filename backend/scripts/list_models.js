const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const test = async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // getting just to use listModels? No.
        // Actually usually genAI.getGenerativeModel is factory.
        // Are there manager methods?
        // Node SDK might not have listModels exposed easily on the main class in older versions, 
        // but let's try to see if we can just infer from docs or try a standard one.
        // Wait, standard is `gemini-1.5-flash` or `gemini-pro`.
        // If 404, it might be the Endpoint?

        console.log("Checking API Key validity...");
        // Let's try a very simple generation with 'gemini-pro' using the most basic syntax
        const m = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await m.generateContent("Hello");
        console.log("Gemini-Pro Response:", result.response.text());

    } catch (e) {
        console.error("Error:", e);
        if (e.response) console.error("Details:", JSON.stringify(e.response, null, 2));
    }
};

test();
