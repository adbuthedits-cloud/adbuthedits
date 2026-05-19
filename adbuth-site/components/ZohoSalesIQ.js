import { useEffect } from 'react';
import Script from 'next/script';
import { useAuth } from '../context/AuthContext';

const ZohoSalesIQ = () => {
    const { user } = useAuth();

    useEffect(() => {
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

    }, [user]);

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
