const redisClient = require('../config/redisClient');

const cacheMiddleware = (prefix, duration = 3600) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate a unique key based on the URL and query parameters
        const key = `${prefix}:${req.originalUrl || req.url}`;

        // Skip if Redis is not connected
        if (!redisClient.isOpen) {
            console.warn('Redis is not connected. Skipping cache.');
            return next();
        }

        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                console.log(`Cache Hit: ${key}`);
                return res.json(JSON.parse(cachedData));
            }

            // If not in cache, override res.json to store the result before sending
            const originalJson = res.json;
            res.json = function (data) {
                // Only cache successful responses and if Redis is connected
                if (res.statusCode === 200 && redisClient.isOpen) {
                    redisClient.setEx(key, duration, JSON.stringify(data))
                        .catch(err => console.error('Redis Set Error:', err));
                }
                return originalJson.call(this, data);
            };

            console.log(`Cache Miss: ${key}`);
            next();
        } catch (err) {
            console.error('Cache Middleware Error:', err);
            next(); // Proceed to DB even if cache fails
        }
    };
};

module.exports = cacheMiddleware;
