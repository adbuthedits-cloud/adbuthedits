import axios from 'axios';
import toast from 'react-hot-toast';

// Avoid duplicate toast notifications within a short window
let lastToastTime = 0;
const TOAST_COOLDOWN = 3000;

const setupAxiosInterceptors = () => {
    // Prevent multiple interceptors from being added if this is called multiple times
    if (axios.interceptors.response.handlers.length > 0) {
        // Technically this might clear other interceptors if we are not careful, 
        // but usually we just want one global error handler.
        // Better: Check if we've already initialized.
    }
    
    // We'll use a flag to prevent double initialization during HMR or re-renders
    if (typeof window !== 'undefined' && window.__AXIOS_INTERCEPTOR_INITIALIZED__) {
        return;
    }

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            const status = error.response ? error.response.status : null;

            if (status === 403) {
                const now = Date.now();
                if (now - lastToastTime > TOAST_COOLDOWN) {
                    toast.error("Access Denied: You don't have permission to perform this action.", {
                        id: 'access-denied-toast',
                        duration: 4000,
                        style: {
                            background: '#150e24',
                            color: '#fff',
                            border: '1px solid #7D287E',
                            fontSize: '14px',
                            fontWeight: '500'
                        },
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    });
                    lastToastTime = now;
                }
                console.warn("[RBAC] 403 Forbidden - Access Denied:", {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: status
                });
            }
            
            return Promise.reject(error);
        }
    );

    if (typeof window !== 'undefined') {
        window.__AXIOS_INTERCEPTOR_INITIALIZED__ = true;
    }
};

export default setupAxiosInterceptors;
