import { createContext, useState, useEffect, useContext, useCallback } from 'react';
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
        setProfileModalPrefill(prefill);
        setShowProfileModal(true);
    }, []);

    /** Called when profile is successfully completed */
    const handleProfileComplete = useCallback(async (updatedUser) => {
        setShowProfileModal(false);
        // Re-fetch full user to get all fields
        const fresh = await refreshUser();
        const finalUser = fresh || updatedUser;
        setUser(finalUser);

        toast.success('Profile complete! Welcome to Adbuth Edits 🎉', {
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
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Login failed');
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
        }}>
            {children}

            {/* Global Profile Completion Modal — rendered here so it works on any page */}
            <ProfileCompleteModal
                isOpen={showProfileModal}
                prefill={profileModalPrefill}
                onComplete={handleProfileComplete}
                onClose={() => setShowProfileModal(false)}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
