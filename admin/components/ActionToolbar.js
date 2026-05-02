"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { hasPermission } from '../utils/auth';

/**
 * ActionToolbar Component
 * Standardized toolbar for detail views, displaying appropriate action buttons
 * based on the user's permissions and role.
 * 
 * @param {Object} user - The current authenticated user object
 * @param {string} module - The module name (e.g., 'products', 'blogs')
 * @param {function} onEdit - Callback for edit action
 * @param {function} onDelete - Callback for delete action
 * @param {string} backUrl - Optional URL to go back to instead of using router.back()
 */
export default function ActionToolbar({ user, module, onEdit, onDelete, backUrl }) {
    const router = useRouter();
    
    const canView = hasPermission(user, module, 'view');
    const canEdit = hasPermission(user, module, 'edit');
    const canDelete = hasPermission(user, module, 'delete');
    
    // Super Admin check is handled within hasPermission conceptually if it returns true for any action, 
    // but we can explicitly show it if helpful, though hasPermission already accounts for it.
    
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1E1628] border border-[#2d1b4e] rounded-xl p-4 shadow-md mb-6 gap-4">
            <button 
                onClick={() => backUrl ? router.push(backUrl) : router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-[#2d1b4e]"
            >
                <FontAwesomeIcon icon={faArrowLeft} /> Back to List
            </button>
            
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {canView && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#2d1b4e]/50 border border-[#3b2a5f] rounded-lg text-gray-300 text-sm font-medium">
                        <FontAwesomeIcon icon={faEye} className="text-[#a78bfa]" /> Read-Only View
                    </div>
                )}
                
                {canEdit && onEdit && (
                    <button 
                        onClick={onEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-bold whitespace-nowrap"
                    >
                        <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                )}
                
                {canDelete && onDelete && (
                    <button 
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-bold whitespace-nowrap"
                    >
                        <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                )}
            </div>
        </div>
    );
}
