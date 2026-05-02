const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const test = async () => {
    try {
        console.log("Testing gemini-1.5-flash with v1beta...");
        const m1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash", apiVersion: "v1beta" });
        await m1.generateContent("Hi");
        console.log("SUCCESS: v1beta gemini-1.5-flash");
        process.exit(0);
    } catch (e) { console.log("Failed v1beta:", e.message); }

    try {
        console.log("Testing gemini-1.5-flash-8b...");
        const m2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
        await m2.generateContent("Hi");
        console.log("SUCCESS: gemini-1.5-flash-8b");
        process.exit(0);
    } catch (e) { console.log("Failed 8b:", e.message); }

    try {
        console.log("Testing gemini-pro v1...");
        const m3 = genAI.getGenerativeModel({ model: "gemini-pro", apiVersion: "v1" });
        await m3.generateContent("Hi");
        console.log("SUCCESS: gemini-pro v1");
        process.exit(0);
    } catch (e) { console.log("Failed pro v1:", e.message); }

    console.log("ALL FAILED.");
};

test();
