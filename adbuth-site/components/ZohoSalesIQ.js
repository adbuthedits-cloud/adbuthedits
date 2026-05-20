import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useAuth } from '../context/AuthContext';

const ZohoSalesIQ = () => {
    const { user } = useAuth();
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        // Trigger loading of script
        const triggerLoad = () => {
            setShouldLoad(true);
            cleanup();
        };

        // Event listeners for interaction
        const events = ['mousemove', 'scroll', 'touchstart', 'keydown', 'click'];
        
        const cleanup = () => {
            events.forEach(event => {
                if (typeof window !== 'undefined') {
                    window.removeEventListener(event, triggerLoad);
                }
            });
        };

        // Add listeners
        if (typeof window !== 'undefined') {
            events.forEach(event => {
                window.addEventListener(event, triggerLoad, { passive: true, once: true });
            });
        }

        // Fallback timeout: load after 4 seconds if no interaction
        const timer = setTimeout(triggerLoad, 4000);

        return () => {
            cleanup();
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (!shouldLoad) return;

        const updateZohoVisitor = () => {
            if (window.$zoho && window.$zoho.salesiq && window.$zoho.salesiq.visitor) {
                if (user) {
                    // Identify the user to Zoho
                    const fullName = user.name || (user.first_name ? `${user.first_name} ${user.last_name}` : '');
                    if (fullName && typeof window.$zoho.salesiq.visitor.name === 'function') {
                        window.$zoho.salesiq.visitor.name(fullName);
                    }
                    if (user.email && typeof window.$zoho.salesiq.visitor.email === 'function') {
                        window.$zoho.salesiq.visitor.email(user.email);
                    }
                }
            }
        };

        // If Zoho is already ready, update now
        updateZohoVisitor();

        // Also hook into the ready event if it hasn't fired yet
        window.$zoho = window.$zoho || {};
        window.$zoho.salesiq = window.$zoho.salesiq || { ready: function() {} };
        const originalReady = window.$zoho.salesiq.ready;
        window.$zoho.salesiq.ready = function() {
            if (originalReady) originalReady();
            updateZohoVisitor();
        };

    }, [user, shouldLoad]);

    if (!shouldLoad) return null;

    return (
        <>
            <Script
                id="zoho-salesiq-init"
                strategy="afterInteractive"
            >
                {`
                    window.$zoho = window.$zoho || {};
                    $zoho.salesiq = $zoho.salesiq || { ready: function() {} };
                `}
            </Script>
            <Script
                id="zsiqscript"
                src="https://salesiq.zohopublic.in/widget?wc=siq73ed13296d6787b5c7cd801e31df38abb1cd60eda246195b001e45db98120d65efd9a5957b15c7d852e21e95f965d89f"
                strategy="afterInteractive"
                defer
            />
        </>
    );
};

export default ZohoSalesIQ;
