const { AuditLog, AdminSession } = require('../models');

/**
 * auditMiddleware.js
 *
 * Automatically logs every CREATE, UPDATE, DELETE action to the AuditLog table.
 * Also increments the action_count on the admin's active session.
 *
 * Usage: Apply to individual routes or globally to all mutating routes.
 *   router.post('/products', auditLog('products', 'CREATE'), handler)
 *   router.put('/products/:id', auditLog('products', 'UPDATE'), handler)
 *   router.delete('/products/:id', auditLog('products', 'DELETE'), handler)
 */
const auditLog = (module, action, getEntityInfo) => {
    return async (req, res, next) => {
        // Intercept res.json to capture the response before it goes out
        const originalJson = res.json.bind(res);

        res.json = async (data) => {
            // Only log successful responses (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                try {
                    const adminName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.email;

                    let entityId = null;
                    let entityName = null;
                    let changes = null;

                    if (typeof getEntityInfo === 'function') {
                        const info = getEntityInfo(req, data);
                        entityId = info?.id || entityId;
                        entityName = info?.name || null;
                        // Detailed changes snippet (Before/After)
                        changes = {
                            before: info?.before || null,
                            after: info?.after || req.body || null,
                            metadata: {
                                method: req.method,
                                url: req.originalUrl,
                                ip: req.ip || req.connection?.remoteAddress,
                                timestamp: new Date().toISOString()
                            }
                        };
                    } else {
                        if (req.body && Object.keys(req.body).length > 0) {
                            // Sanitize — don't log passwords
                            const sanitized = { ...req.body };
                            delete sanitized.password;
                            delete sanitized.password_hash;
                            changes = { 
                                body: sanitized,
                                metadata: {
                                    method: req.method,
                                    url: req.originalUrl,
                                    ip: req.ip || req.connection?.remoteAddress,
                                    timestamp: new Date().toISOString()
                                }
                            };
                        }
                    }

                    // Create audit log entry
                    await AuditLog.create({
                        admin_id: req.user.id,
                        admin_name: adminName,
                        admin_role: req.user.role,
                        action,
                        module,
                        entity_id: String(entityId || ''),
                        entity_name: entityName || String(entityId || 'N/A'),
                        changes,
                        ip_address: req.ip || req.connection?.remoteAddress,
                        user_agent: req.get('user-agent'),
                        status: 'success'
                    });

                    // Increment action count on active session
                    if (req.user.session_id) {
                        AdminSession.increment('action_count', {
                            where: { session_id: req.user.session_id, status: 'active' }
                        }).catch(() => {}); // Non-blocking
                    }
                } catch (auditErr) {
                    // Never let audit failures break the actual API response
                    console.error('[AuditLog Error]', auditErr.message);
                }
            }

            return originalJson(data);
        };

        next();
    };
};

module.exports = { auditLog };
