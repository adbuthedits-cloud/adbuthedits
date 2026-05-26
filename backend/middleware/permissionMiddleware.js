/**
 * permissionMiddleware.js
 *
 * Granular RBAC authorization guard.
 *
 * Usage: checkPermission('products', 'edit')
 *
 * Permissions structure stored in JWT / Admin.permissions (from Role table):
 *   { "products": ["view","edit","delete"], "orders": ["view"], ... }
 *
 * Module keys (must match exactly):
 *   dashboard | seo | orders | products | master_data | blogs | blog_categories
 *   reviews | payments | marketing | users | staff | settings | order_tracking | my_tasks
 *   media_manager
 *
 * Action keys:
 *   view | edit | delete
 *
 * Super Admin (role === 'admin') always bypasses all checks.
 */
const checkPermission = (module, action) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: No session found.' });
        }

        // Super Admin bypass — is_super_admin is embedded in JWT from Role.is_system flag
        // Using a boolean flag is UUID-safe (no integer ID dependency)
        if (user.is_super_admin === true) {
            return next();
        }

        const permissions = user.permissions || {};
        const allowed = permissions[module];

        if (!Array.isArray(allowed) || !allowed.includes(action)) {
            return res.status(403).json({
                error: `Access Denied: You do not have '${action}' permission for '${module}'. Please contact your administrator.`,
                required: { module, action },
                your_role: user.role || 'unknown'
            });
        }

        next();
    };
};

module.exports = { checkPermission };
