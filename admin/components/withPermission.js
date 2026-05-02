"use client";
import React, { useEffect, useState } from 'react';
import { getAuthUser, hasPermission } from '../utils/auth';
import AccessDenied from './AccessDenied';

/**
 * Higher-Order Component to protect pages based on RBAC permissions.
 * 
 * @param {React.Component} WrappedComponent - The page component to protect
 * @param {string} module - The module name (e.g., 'blogs', 'products')
 * @param {string} action - The required action (default: 'view')
 */
const withPermission = (WrappedComponent, module, action = 'view') => {
    return function WithPermissionWrapper(props) {
        const [isAllowed, setIsAllowed] = useState(null); // null = loading
        const [user, setUser] = useState(null);

        useEffect(() => {
            const currentUser = getAuthUser();
            setUser(currentUser);
            
            if (hasPermission(currentUser, module, action)) {
                setIsAllowed(true);
            } else {
                setIsAllowed(false);
            }
        }, []);

        // Show a loader while checking permissions
        if (isAllowed === null) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a78bfa]"></div>
                    <div className="text-gray-400 font-medium text-sm animate-pulse">Checking Access...</div>
                </div>
            );
        }

        // Show Access Denied if not allowed
        if (isAllowed === false) {
            return (
                <div className="p-8">
                    <AccessDenied 
                        module={module}
                        action={action}
                    />
                </div>
            );
        }

        // Render the actual page if allowed
        return <WrappedComponent {...props} user={user} />;
    };
};

export default withPermission;
