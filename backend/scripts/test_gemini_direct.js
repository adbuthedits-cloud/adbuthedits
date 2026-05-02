require('dotenv').config();
const { generateChatResponse } = require('../utils/geminiService');

const test = async () => {
    try {
        console.log('Testing generateChatResponse...');
        const history = [
            { role: 'user', parts: [{ text: 'Hello' }] }
        ];
        const context = "This is a test context.";

        const reply = await generateChatResponse(history, context);
        console.log('Reply:', reply);
    } catch (e) {
        console.error('Direct Test Failed:', e);
    }
};

test();
