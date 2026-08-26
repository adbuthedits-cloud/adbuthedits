import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useAuth } from '../context/AuthContext';

const ZohoSalesIQ = () => {
    const { user } = useAuth();
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        // Trigger loading of script on interaction
        const triggerLoad = () => {
            setShouldLoad(true);
            cleanup();
        };

        const events = ['mousemove', 'scroll', 'touchstart', 'keydown', 'click'];
        
        const cleanup = () => {
            events.forEach(event => {
                if (typeof window !== 'undefined') {
                    window.removeEventListener(event, triggerLoad);
                }
            });
        };

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

        // Force minimize bot window on initial script load so it never pops open automatically
        const minimizeOnLoad = () => {
            try {
                if (window.$zoho && window.$zoho.salesiq && window.$zoho.salesiq.floatwindow) {
                    if (typeof window.$zoho.salesiq.floatwindow.minimize === 'function') {
                        window.$zoho.salesiq.floatwindow.minimize();
                    }
                    if (typeof window.$zoho.salesiq.floatwindow.visible === 'function') {
                        window.$zoho.salesiq.floatwindow.visible('hide');
                    }
                }
            } catch (_) {}
        };

        const updateZohoVisitor = () => {
            if (window.$zoho && window.$zoho.salesiq && window.$zoho.salesiq.visitor) {
                if (user) {
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

        // Execute visitor sync and force minimize on load
        updateZohoVisitor();
        minimizeOnLoad();

        window.$zoho = window.$zoho || {};
        window.$zoho.salesiq = window.$zoho.salesiq || { ready: function() {} };
        const originalReady = window.$zoho.salesiq.ready;
        window.$zoho.salesiq.ready = function() {
            if (originalReady) originalReady();
            updateZohoVisitor();
            minimizeOnLoad();
        };

        // Safety fallback: force minimize 1s after load to prevent auto-popup
        const loadTimer = setTimeout(minimizeOnLoad, 1000);
        return () => clearTimeout(loadTimer);

    }, [user, shouldLoad]);

    // ── Close / Minimize chat on click outside the Zoho widget container ──────
    useEffect(() => {
        if (!shouldLoad) return;

        // Check if an element or any parent belongs to Zoho SalesIQ
        const isZohoElement = (el) => {
            if (!el) return false;
            let curr = el;
            while (curr && curr !== document.body && curr !== document.documentElement) {
                const id = (curr.id || '').toLowerCase();
                const className = (typeof curr.className === 'string' ? curr.className : '').toLowerCase();
                const tag = (curr.tagName || '').toLowerCase();

                if (id.includes('zsiq') || id.includes('salesiq') || id.includes('siq') ||
                    className.includes('zsiq') || className.includes('salesiq') || className.includes('siq') ||
                    (tag === 'iframe' && (curr.src?.includes('salesiq') || curr.src?.includes('zoho')))) {
                    return true;
                }
                curr = curr.parentElement;
            }
            return false;
        };

        // Check if Zoho chat box is currently open on screen (height > 150px or SDK reports visible)
        const isChatOpen = () => {
            try {
                if (window.$zoho && window.$zoho.salesiq) {
                    if (window.$zoho.salesiq.chat && typeof window.$zoho.salesiq.chat.isopen === 'function') {
                        if (window.$zoho.salesiq.chat.isopen()) return true;
                    }
                    if (window.$zoho.salesiq.floatwindow && typeof window.$zoho.salesiq.floatwindow.visible === 'function') {
                        const status = window.$zoho.salesiq.floatwindow.visible();
                        if (status === 'show' || status === 'open' || status === true) return true;
                    }
                }
            } catch (_) {}

            // Foolproof DOM check: Any Zoho element / container / iframe with height > 150px means chat box is OPEN
            const zohoElements = document.querySelectorAll('[id*="zsiq"], [id*="siq"], [class*="zsiq"], iframe[src*="salesiq"]');
            for (const el of zohoElements) {
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.height > 150 && rect.width > 150 && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden') {
                        return true;
                    }
                }
            }

            return false;
        };

        // Close / Minimize Zoho chat box
        const minimizeZohoChat = () => {
            try {
                if (window.$zoho && window.$zoho.salesiq) {
                    if (window.$zoho.salesiq.floatwindow && typeof window.$zoho.salesiq.floatwindow.minimize === 'function') {
                        window.$zoho.salesiq.floatwindow.minimize();
                    }
                    if (window.$zoho.salesiq.floatwindow && typeof window.$zoho.salesiq.floatwindow.visible === 'function') {
                        window.$zoho.salesiq.floatwindow.visible('hide');
                    }
                    if (window.$zoho.salesiq.chat && typeof window.$zoho.salesiq.chat.close === 'function') {
                        window.$zoho.salesiq.chat.close();
                    }
                }
            } catch (_) {}

            // DOM fallback: click minimize/close button
            try {
                const minimizeBtns = document.querySelectorAll('.zsiq_close, .zsiq_min, [title="Minimize"], [aria-label="Minimize Chat"], [title="Close"]');
                minimizeBtns.forEach(btn => {
                    if (btn && typeof btn.click === 'function') btn.click();
                });
            } catch (_) {}
        };

        const handleClickOutside = (e) => {
            if (!isZohoElement(e.target) && isChatOpen()) {
                minimizeZohoChat();
            }
        };

        window.addEventListener('click', handleClickOutside, true);
        window.addEventListener('mousedown', handleClickOutside, true);
        window.addEventListener('touchstart', handleClickOutside, { passive: true, capture: true });

        return () => {
            window.removeEventListener('click', handleClickOutside, true);
            window.removeEventListener('mousedown', handleClickOutside, true);
            window.removeEventListener('touchstart', handleClickOutside, true);
        };
    }, [shouldLoad]);


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
