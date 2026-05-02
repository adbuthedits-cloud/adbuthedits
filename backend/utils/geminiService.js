const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateEmbedding = async (text) => {
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};

const generateChatResponse = async (history, context = "") => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `You are 'VideoAssist', the AI support bot for Adbuth Media Works.
        Your goal is to help users with video editing services, pricing, and order status.
        
        CONTEXT FROM KNOWLEDGE BASE:
        ${context}
        
        INSTRUCTIONS:
        1. Use the Context above to answer.
        2. Be professional, concise, and helpful.
        3. If the user asks for human help, or is angry, or the context doesn't cover the query, reply with exactly: "HANDOVER_TO_AGENT".
        4. If outside business hours (9 AM - 6 PM IST) and you can't help, mention that agents will reply later (only if handing over).
        5. Format your response with Markdown if needed.
        `;

        // Configure generation config if needed
        const chat = model.startChat({
            history: history, // Array of { role: 'user'|'model', parts: [{ text: ... }] }
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        // We send the system prompt as the first message or prepend it? 
        // Gemini Pro doesn't have system prompt param yet in node SDK consistently (use 1.5-pro for that).
        // For gemini-pro, we prepend context to the valid user message or keep it in history.
        // Actually, let's just send the message with context if history is empty, or rely on system instruction logic if available.
        // Simple approach: Prepend context to the *current* message prompt.

        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${history[history.length - 1]?.parts[0]?.text || "Hello"}`);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating chat response:", error);
        if (error.response) console.error("Gemini Response Error:", JSON.stringify(error.response, null, 2));
        throw error; // Throw so route can handle fallback
    }
};

module.exports = {
    generateEmbedding,
    generateChatResponse
};
