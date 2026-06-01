import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSave, faShieldAlt, faEnvelope, faPhone, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Settings() {
    const { seoData } = useSeo('settings');
    const { user, login } = useAuth(); // We might need to update user context after profile change
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Profile State
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Password change method: 'password' | 'email' | 'phone'
    const [changeMethod, setChangeMethod] = useState('password');
    const [emailOtp, setEmailOtp] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const recaptchaContainerRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);

    useEffect(() => {
        if (user) {
            // Split name if first/last aren't separate in context (depends on auth provider implementation)
            // Assuming user object might just have 'name'. If it has first_name etc use that.
            // Adjusting based on common patterns; ideally we fetch fresh user data here.
            // For now, let's use what we have or empty defaults.
            const names = user.name ? user.name.split(' ') : ['', ''];
            setProfileData({
                first_name: user.first_name || names[0] || '',
                last_name: user.last_name || names.slice(1).join(' ') || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }

            if (res.ok) {
                setMessage({ text: 'Profile updated successfully', type: 'success' });
                // Optionally update context if we had a method for it, or rely on next refresh
                // For immediate feedback, we could force a reload or re-fetch user
            } else {
                setMessage({ text: data.msg || 'Update failed', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Something went wrong', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // OTP Timer countdown
    useEffect(() => {
        let interval;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpTimer]);

    const cleanupRecaptcha = () => {
        try {
            if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
                recaptchaVerifierRef.current = null;
            }
        } catch (e) { /* ignore */ }
    };

    const setupRecaptcha = async () => {
        try {
            if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;

            const { RecaptchaVerifier } = await import('firebase/auth');
            const { auth } = await import('../lib/firebase');

            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => { /* reCAPTCHA solved */ },
                'expired-callback': () => {
                    setMessage({ text: 'reCAPTCHA expired. Please try again.', type: 'error' });
                    cleanupRecaptcha();
                }
            });

            await verifier.render();
            recaptchaVerifierRef.current = verifier;
            return verifier;
        } catch (err) {
            console.error('[reCAPTCHA] Setup error:', err);
            throw new Error('reCAPTCHA setup failed. Please refresh the page.');
        }
    };

    useEffect(() => {
        return () => {
            cleanupRecaptcha();
        };
    }, []);

    const handleSendEmailOtp = async () => {
        if (!user || !user.email) {
            setMessage({ text: 'No registered email found on your account.', type: 'error' });
            return;
        }
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await fetch(`${API_URL}/api/otp/send-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, purpose: 'change_password_settings' })
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Failed to send OTP');
            setOtpSent(true);
            setOtpTimer(600);
            setEmailOtp('');
            setMessage({ text: 'OTP sent to your registered email!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        }
        setLoading(false);
    };

    const handleSendPhoneOtp = async () => {
        if (!user || !user.phone_number) {
            setMessage({ text: 'No registered phone number found on your account.', type: 'error' });
            return;
        }
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const { signInWithPhoneNumber } = await import('firebase/auth');
            const { auth } = await import('../lib/firebase');

            const appVerifier = await setupRecaptcha();
            const phoneObj = typeof user.phone_number === 'string' ? JSON.parse(user.phone_number) : user.phone_number;
            const fullPhone = `${phoneObj.code}${phoneObj.number.replace(/[\s\-()]/g, '')}`;

            const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
            setConfirmationResult(result);
            setOtpSent(true);
            setOtpTimer(120);
            setPhoneOtp('');
            setMessage({ text: `SMS OTP code sent to ${fullPhone}`, type: 'success' });
        } catch (err) {
            console.error('[Firebase Settings Phone] Send error:', err);
            cleanupRecaptcha();
            const fbErrors = {
                'auth/invalid-phone-number': 'Invalid phone number format.',
                'auth/too-many-requests': 'Too many attempts. Please wait.',
                'auth/quota-exceeded': 'SMS quota exceeded.',
                'auth/network-request-failed': 'Network error.',
                'auth/internal-error': 'Phone authentication is not configured yet.',
            };
            setMessage({ text: fbErrors[err.code] || err.message || 'Failed to send SMS. Try again.', type: 'error' });
        }
        setLoading(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            let payload = { newPassword: passwordData.newPassword };

            if (changeMethod === 'password') {
                payload.currentPassword = passwordData.currentPassword;
            } else if (changeMethod === 'email') {
                if (emailOtp.length < 6) {
                    setMessage({ text: 'Please enter the complete 6-digit email OTP.', type: 'error' });
                    setLoading(false);
                    return;
                }
                payload.otp = emailOtp;
            } else if (changeMethod === 'phone') {
                if (phoneOtp.length < 6) {
                    setMessage({ text: 'Please enter the complete 6-digit SMS OTP.', type: 'error' });
                    setLoading(false);
                    return;
                }
                if (!confirmationResult) {
                    setMessage({ text: 'SMS session expired. Please resend.', type: 'error' });
                    setLoading(false);
                    return;
                }
                const firebaseResult = await confirmationResult.confirm(phoneOtp);
                const idToken = await firebaseResult.user.getIdToken();
                payload.idToken = idToken;
            }

            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }

            if (res.ok) {
                setMessage({ text: 'Password changed successfully', type: 'success' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setEmailOtp('');
                setPhoneOtp('');
                setOtpSent(false);
                setOtpTimer(0);
                setConfirmationResult(null);
            } else {
                setMessage({ text: data.msg || 'Change failed', type: 'error' });
            }
        } catch (error) {
            console.error('[Settings Change Password] Error:', error);
            const fbErrors = {
                'auth/invalid-verification-code': 'Incorrect SMS OTP. Please try again.',
                'auth/code-expired': 'SMS OTP has expired. Please resend.',
            };
            setMessage({ text: fbErrors[error.code] || error.message || 'Something went wrong', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Account Settings | Adbuth Edits"}
                description={seoData?.meta_description || seoData?.description || "Manage your account settings."}
                data={seoData}
            />
            <Navbar isdark={false} />

            <main className="flex-grow pt-32 pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar Tabs */}
                        <div className="md:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-white p-2">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'profile' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faUser} /> Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('password')}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'password' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faLock} /> Security
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-3">
                            <div className="bg-white rounded-3xl shadow-sm border border-white p-8">
                                {message.text && (
                                    <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                {activeTab === 'profile' ? (
                                    <motion.form
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={handleProfileUpdate}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl">
                                                <FontAwesomeIcon icon={faUser} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                                <p className="text-gray-500 text-sm">Update your personal details here.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.first_name}
                                                    onChange={e => setProfileData({ ...profileData, first_name: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="John"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.last_name}
                                                    onChange={e => setProfileData({ ...profileData, last_name: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                            >
                                                {loading ? 'Saving...' : <><FontAwesomeIcon icon={faSave} /> Save Changes</>}
                                            </button>
                                        </div>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={handlePasswordChange}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
                                                <FontAwesomeIcon icon={faShieldAlt} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Security</h2>
                                                <p className="text-gray-500 text-sm">Manage your password and security settings.</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
                                            <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200/50 max-w-md">
                                                <button
                                                    type="button"
                                                    onClick={() => { setChangeMethod('password'); setOtpSent(false); setMessage({ text: '', type: '' }); }}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${changeMethod === 'password' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                                >
                                                    <FontAwesomeIcon icon={faLock} className="mr-1.5" /> Password
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setChangeMethod('email'); setOtpSent(false); setMessage({ text: '', type: '' }); }}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${changeMethod === 'email' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                                >
                                                    <FontAwesomeIcon icon={faEnvelope} className="mr-1.5" /> Email OTP
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setChangeMethod('phone'); setOtpSent(false); setMessage({ text: '', type: '' }); }}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${changeMethod === 'phone' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                                >
                                                    <FontAwesomeIcon icon={faPhone} className="mr-1.5" /> Phone OTP
                                                </button>
                                            </div>
                                        </div>

                                        {changeMethod === 'password' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.currentPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="Enter current password"
                                                />
                                            </div>
                                        )}

                                        {changeMethod === 'email' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Registered Email Address</label>
                                                    <div className="flex gap-4">
                                                        <input
                                                            type="email"
                                                            value={user?.email || ''}
                                                            disabled
                                                            className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-500 outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleSendEmailOtp}
                                                            disabled={loading || (otpSent && otpTimer > 0)}
                                                            className="px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {otpSent && otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Send OTP'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {otpSent && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit Email OTP</label>
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={emailOtp}
                                                            onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                                                            className="w-full max-w-xs px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-center font-mono text-xl tracking-widest"
                                                            placeholder="000000"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {changeMethod === 'phone' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Registered Phone Number</label>
                                                    <div className="flex gap-4">
                                                        <input
                                                            type="text"
                                                            value={user?.phone_number ? `${(typeof user.phone_number === 'string' ? JSON.parse(user.phone_number) : user.phone_number).code} ${(typeof user.phone_number === 'string' ? JSON.parse(user.phone_number) : user.phone_number).number}` : ''}
                                                            disabled
                                                            className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-500 outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleSendPhoneOtp}
                                                            disabled={loading || (otpSent && otpTimer > 0)}
                                                            className="px-5 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {otpSent && otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Send SMS'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {otpSent && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit SMS OTP</label>
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={phoneOtp}
                                                            onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                                                            className="w-full max-w-xs px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-center font-mono text-xl tracking-widest"
                                                            placeholder="000000"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="Minimum 6 characters"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                            >
                                                {loading ? 'Updating...' : <><FontAwesomeIcon icon={faLock} /> Update Password</>}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            {/* Firebase Recaptcha Container */}
            <div id="recaptcha-container"></div>
        </div>
    );
}