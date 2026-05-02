const sequelize = require('../config/database');
const BotKnowledge = require('../models/BotKnowledge');
const { generateEmbedding } = require('../utils/geminiService');

const knowledgeData = [
    {
        source: "Pricing Page",
        content: "Our video editing packages start at $50 for basic edits (up to 2 minutes). Advanced styling and motion graphics packages start at $150. Commercial ads are quoted based on complexity."
    },
    {
        source: "Delivery Times",
        content: "Standard delivery time is 48 hours for the Basic package. Advanced packages take 3-5 business days. Express 24-hour delivery is available for an extra $30."
    },
    {
        source: "Contact Info",
        content: "You can reach our support team via email at support@adbuth.com or call us at +1-555-0199. Our office hours are 9 AM to 6 PM IST."
    },
    {
        source: "Services",
        content: "We offer Wedding Video Editing, Corporate Commercials, YouTube Video Editing, and 'Save the Date' E-Invitation designs."
    }
];

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Sync to ensure table exists
        await BotKnowledge.sync();

        console.log('Seeding Knowledge Base...');

        for (const item of knowledgeData) {
            console.log(`Processing: ${item.source}`);
            // Rate limit protection
            await new Promise(resolve => setTimeout(resolve, 2000));

            const embedding = await generateEmbedding(item.content);

            await BotKnowledge.create({
                source: item.source,
                content: item.content,
                // Ensure embedding is passed as array, Sequelize/PG driver handles it if column is vector type
                // But specifically for pgvector helper usage, passing array usually works.
                // If using 'vector' type in raw SQL, inserting array string '[...]' or array literal is key.
                // Sequelize might need `Sequelize.literal` if it doesn't support vector casting natively.
                // But let's try direct array first.
                embedding: embedding
            });
        }

        console.log('Seeding Complete! Brain is ready.');
        process.exit(0);
    } catch (e) {
        console.error('Seeding Failed:', e);
        process.exit(1);
    }
};

seed();
