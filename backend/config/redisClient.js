const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

(async () => {
    try {
        await client.connect();
        // Disable strict blocking on background save failures (useful for local dev and Windows environments)
        try {
            await client.configSet('stop-writes-on-bgsave-error', 'no');
            console.log('Redis Config: Set stop-writes-on-bgsave-error = no successfully.');
        } catch (configErr) {
            // Silently ignore if configuration setting commands are disabled/restricted (e.g. on managed Redis hosting)
            console.warn('Redis Config: CONFIG SET stop-writes-on-bgsave-error not supported or restricted:', configErr.message);
        }
    } catch (err) {
        console.error('Could not connect to Redis:', err);
    }
})();

module.exports = client;
