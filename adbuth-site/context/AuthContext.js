import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import ProfileCompleteModal from '../components/auth/ProfileCompleteModal';

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Returns true when the user has all required profile fields */
export const isProfileComplete = (user) =>
    !!(user && user.first_name && user.email && user.phone_number);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileModalPrefill, setProfileModalPrefill] = useState({});
    const router = useRouter();
    const modalDismissedThisSession = useRef(false);

    /** Re-fetch the full user record from /api/auth/verify */
    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const res = await fetch(`${API_URL}/api/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return data.user;
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                return null;
            }
        } catch (error) {
            console.error('refreshUser error:', error);
            return null;
        }
    }, []);

    const DEFAULT_LOGO = 'https://assets.adbuthverse.com/brand/AdbuthVerse%20(1)_1785841733705.png';
    const [brandLogo, setBrandLogo] = useState(DEFAULT_LOGO);

    useEffect(() => {
        const fetchPublicSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/api/settings/public`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.brand_logo) {
                        setBrandLogo(data.brand_logo);
                    }
                }
            } catch (e) {
                /* fallback to default */
            }
        };
        fetchPublicSettings();
    }, []);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/auth/verify`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            } catch (error) {
                console.error('Verify token error:', error);
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, []);

    /**
     * Open the ProfileCompleteModal with optional prefill data.
     * @param {object} prefill  e.g. { email: 'a@b.com' } or { phone: { code: '+91', number: '...' } }
     */
    const openProfileModal = useCallback((prefill = {}) => {
        const merged = { ...prefill };
        if (typeof window !== 'undefined') {
            const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
            const currentUser = storedUser || user;
            if (currentUser) {
                if (!merged.email && currentUser.email) {
                    merged.email = currentUser.email;
                }
                if (!merged.phone && currentUser.phone_number) {
                    try {
                        const parsed = typeof currentUser.phone_number === 'string'
                            ? JSON.parse(currentUser.phone_number)
                            : currentUser.phone_number;
                        if (parsed && parsed.number) {
                            merged.phone = parsed;
                        } else if (typeof currentUser.phone_number === 'string') {
                            merged.phone = { code: '+91', number: currentUser.phone_number };
                        }
                    } catch (e) {
                        merged.phone = { code: '+91', number: currentUser.phone_number };
                    }
                }
            }
        }
        setProfileModalPrefill(merged);
        setShowProfileModal(true);
    }, [user]);

    /** Called when profile is successfully completed */
    const handleProfileComplete = useCallback(async (updatedUser) => {
        setShowProfileModal(false);
        modalDismissedThisSession.current = true;
        // Re-fetch full user to get all fields
        const fresh = await refreshUser();
        const finalUser = fresh || updatedUser;
        setUser(finalUser);

        toast.success('Profile complete! Welcome to Adbuth Verse 🎉', {
            style: { borderRadius: '12px', background: '#1a0b2e', color: '#fff', border: '1px solid #7c3aed' },
            iconTheme: { primary: '#7c3aed', secondary: '#fff' },
            duration: 4000,
        });

        // If there was an intended destination (e.g., /checkout), go there
        const intended = localStorage.getItem('intendedDestination');
        if (intended) {
            localStorage.removeItem('intendedDestination');
            router.push(intended);
        }
    }, [refreshUser, router]);

    const login = async (email, password, preventRedirect = false) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, loginIdentifier: email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.msg || 'Login failed', isDeactivated: data.isDeactivated };
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);

            // Fetch full user data (the login endpoint may not return all fields)
            const fresh = await refreshUser();
            const finalUser = fresh || data.user;

            const intendedDestination = localStorage.getItem('intendedDestination');
            if (intendedDestination) {
                localStorage.removeItem('intendedDestination');
                await router.push(intendedDestination);
            } else if (!preventRedirect) {
                router.push('/');
            }
            return { success: true, user: finalUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (firstName, lastName, email, password, phone) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password,
                    phone_number: phone
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Signup failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            router.push('/');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Logged out successfully!', {
            style: { borderRadius: '10px', background: '#333', color: '#fff' },
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
        });
    };

    // Automatically trigger ProfileCompleteModal after a delay of landing on non-auth pages
    useEffect(() => {
        const isAuthPage = router.pathname === '/login' || router.pathname === '/signup';
        if (!loading && user && !isProfileComplete(user) && !showProfileModal && !modalDismissedThisSession.current && !isAuthPage) {
            const timer = setTimeout(() => {
                openProfileModal();
            }, 3000); // 3 seconds delay
            return () => clearTimeout(timer);
        }
    }, [loading, user, showProfileModal, openProfileModal, router.pathname]);

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            login,
            signup,
            logout,
            loading,
            refreshUser,
            openProfileModal,
            isProfileComplete,
            brandLogo,
            setBrandLogo,
        }}>
            {children}

            {/* Global Profile Completion Modal — rendered here so it works on any page */}
            <ProfileCompleteModal
                isOpen={showProfileModal}
                prefill={profileModalPrefill}
                onComplete={handleProfileComplete}
                onClose={() => {
                    setShowProfileModal(false);
                    modalDismissedThisSession.current = true;
                }}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
