export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        const localToken = localStorage.getItem('admin_token');
        if (localToken) {
            const expiry = localStorage.getItem('admin_token_expiry');
            if (expiry && Date.now() > parseInt(expiry, 10)) {
                console.warn("AuthUtils: Token Expired! Logging out.");
                logout();
                return null;
            }
            return localToken;
        }
    }
    return null;
};

export const getAuthUser = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};

/**
 * Evaluates if the current user has permission to perform an action on a module.
 * Super Admin (role_id === 1) bypasses all permission checks.
 * All other access is controlled by the permissions object inherited from the Role table.
 *
 * @param {Object} user
 * @param {string} module - e.g. 'products', 'orders', 'blogs'
 * @param {string} action - 'view', 'edit', 'delete'
 * @returns {boolean}
 */
export const hasPermission = (user, module, action = 'view') => {
    if (!user) return false;

    // Super Admin bypass — is_super_admin is set at login from Role.is_system (UUID-safe)
    if (user.is_super_admin === true) return true;

    const permissions = user.permissions || {};
    const allowed = permissions[module];

    return Array.isArray(allowed) && allowed.includes(action);
};

/**
 * Returns true if the user has ANY permission on the module.
 * Used to decide whether to show a nav item at all.
 */
export const canAccessModule = (user, module) => {
    if (!user) return false;
    if (user.is_super_admin === true) return true; // Super Admin sees everything
    const permissions = user.permissions || {};
    const allowed = permissions[module];
    return Array.isArray(allowed) && allowed.length > 0;
};

export const logout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token_expiry');
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_user');
        document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "admin_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
};
