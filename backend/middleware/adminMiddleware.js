const { Admin, Role } = require('../models');

/**
 * adminMiddleware.js
 *
 * Verifies the request comes from an authenticated admin-type user.
 * Fetches the absolute freshest role permissions from the database to prevent stale JWT issues.
 */
const adminMiddleware = async (req, res, next) => {
    // Requires authMiddleware to run first to populate req.user
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: No user found' });
    }

    if (req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin area access required' });
    }

    try {
        // Enforce Real-Time Sync: The JWT might hold stale permissions from an hour ago
        // This query ensures that if a Super Admin changes a role matrix, it takes effect instantly.
        const admin = await Admin.findByPk(req.user.id, {
            include: [{
                model: Role,
                as: 'roleDetails',
                required: false
            }]
        });

        if (!admin || !admin.is_active) {
            return res.status(401).json({ error: 'Unauthorized: Admin account inactive or deleted' });
        }

        // Live patch the request payload with absolute database truth
        req.user.permissions = admin.roleDetails?.permissions || admin.permissions || {};
        req.user.is_super_admin = admin.roleDetails?.is_system === true;

        next();
    } catch (err) {
        console.error('[adminMiddleware] Integrity check failed:', err.message);
        res.status(500).json({ error: 'Server authentication verification failed' });
    }
};

module.exports = adminMiddleware;
