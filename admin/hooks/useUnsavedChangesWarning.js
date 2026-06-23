import { useEffect } from 'react';

/**
 * Custom hook to show confirmation dialog before navigating away from a page with unsaved changes.
 * Handles both browser refresh/tab close events and Next.js client-side link navigation.
 * 
 * @param {boolean} isDirty - True if there are unsaved changes
 * @param {string} customMessage - Message to display in the confirm dialog
 */
export function useUnsavedChangesWarning(isDirty, customMessage = "You have unsaved changes. Are you sure you want to leave?") {
    useEffect(() => {
        // 1. Intercept browser refresh, close, reload (beforeunload event)
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = customMessage;
                return customMessage;
            }
        };

        // 2. Intercept client-side Next.js layout links clicks
        const handleAnchorClick = (e) => {
            if (!isDirty) return;

            const target = e.target.closest('a');
            if (target && target.href) {
                // Ignore hash links, mailto, tel, etc.
                if (target.getAttribute('href')?.startsWith('#')) return;
                if (target.href.startsWith('mailto:') || target.href.startsWith('tel:')) return;
                
                try {
                    const targetUrl = new URL(target.href);
                    const currentUrl = new URL(window.location.href);
                    
                    // Only intercept client-side links inside our app (same origin, different path/search)
                    if (targetUrl.origin === currentUrl.origin) {
                        const isSamePage = targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search;
                        if (!isSamePage) {
                            const confirmed = window.confirm(customMessage);
                            if (!confirmed) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error parsing anchor href in unsaved changes warning:", err);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleAnchorClick, true); // Use event capture to intercept before Next.js transitions

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleAnchorClick, true);
        };
    }, [isDirty, customMessage]);
}
