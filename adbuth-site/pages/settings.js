import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSave, faShieldAlt, faEnvelope, faPhone, faRotateLeft, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';
import { isDisposableEmail } from '../utils/disposableEmails';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Settings() {
    const router = useRouter();
    const { seoData } = useSeo('settings');
    const { user, loading: authLoading, isProfileComplete, openProfileModal, refreshUser } = useAuth(); // We might need to update user context after profile change
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

    // Password change method: 'password' | 'otp'
    const [changeMethod, setChangeMethod] = useState('password');
    const [otpVerifyMethod, setOtpVerifyMethod] = useState(''); // 'email' | 'phone'
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [firebaseIdToken, setFirebaseIdToken] = useState('');
    const [otpTimer, setOtpTimer] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const recaptchaContainerRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);
    const recaptchaWidgetIdRef = useRef(null);

    // Email change state
    const [showEmailChange, setShowEmailChange] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailChangeOtp, setEmailChangeOtp] = useState('');
    const [emailChangeStep, setEmailChangeStep] = useState('input'); // 'input' | 'verify'
    const [emailChangeTimer, setEmailChangeTimer] = useState(0);

    // Phone change state
    const [showPhoneChange, setShowPhoneChange] = useState(false);
    const [newPhoneCode, setNewPhoneCode] = useState('+91');
    const [newPhoneNum, setNewPhoneNum] = useState('');
    const [phoneChangeOtp, setPhoneChangeOtp] = useState('');
    const [phoneChangeStep, setPhoneChangeStep] = useState('input'); // 'input' | 'verify'
    const [phoneChangeConfirmResult, setPhoneChangeConfirmResult] = useState(null);

    const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);

    // Cleanup reCAPTCHA verifier — removes dynamic container from DOM
    const cleanupRecaptcha = () => {
        try {
            if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
            }
        } catch (e) { /* ignore */ }
        recaptchaVerifierRef.current = null;
        try {
            document.querySelectorAll('[data-recaptcha-settings]').forEach(el => el.remove());
        } catch (e) { /* ignore */ }
    };

    // Setup invisible reCAPTCHA verifier
    const getRecaptchaVerifier = async () => {
        cleanupRecaptcha(); // always destroy existing first
        try {
            const { RecaptchaVerifier } = await import('firebase/auth');
            const { auth } = await import('../lib/firebase');

            const container = document.createElement('div');
            container.setAttribute('data-recaptcha-settings', 'true');
            document.body.appendChild(container);

            const verifier = new RecaptchaVerifier(auth, container, {
                size: 'invisible',
                callback: () => { /* reCAPTCHA solved */ },
                'expired-callback': () => { cleanupRecaptcha(); },
            });

            await verifier.render();
            recaptchaVerifierRef.current = verifier;
            return verifier;
        } catch (err) {
            console.error('[reCAPTCHA] Setup error:', err);
            cleanupRecaptcha();
            throw new Error('reCAPTCHA setup failed. Please try again.');
        }
    };

    // Cleanup reCAPTCHA on component unmount
    useEffect(() => {
        return () => { cleanupRecaptcha(); };
    }, []);

    useEffect(() => {
        if (phoneResendCooldown > 0) {
            const timer = setTimeout(() => setPhoneResendCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [phoneResendCooldown]);

    useEffect(() => {
        if (user) {
            setProfileData({
                first_name: user.first_name || '',
                last_name: user.last_name || ''
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
                body: JSON.stringify({
                    first_name: profileData.first_name,
                    last_name: profileData.last_name
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Profile update failed');

            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            await refreshUser();
        } catch (err) {
            console.error('[Settings Update Profile] Error:', err);
            setMessage({ text: err.message || 'Something went wrong', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Account Action Modal state (Deactivate / Delete)
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [accountActionType, setAccountActionType] = useState('select'); // 'select' | 'deactivate' | 'delete'
    const [actionReason, setActionReason] = useState('');
    const [confirmInput, setConfirmInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionDoneMsg, setActionDoneMsg] = useState('');

    const openAccountModal = (type = 'select') => {
        setAccountActionType(type);
        setActionReason('');
        setConfirmInput('');
        setActionDoneMsg('');
        setAccountModalOpen(true);
    };

    const closeAccountModal = () => {
        if (actionLoading) return;
        setAccountModalOpen(false);
        setAccountActionType('select');
        setActionReason('');
        setConfirmInput('');
    };

    // Deactivate Account API Call
    const handleAccountDeactivateSubmit = async (e) => {
        e?.preventDefault();
        if (confirmInput.trim().toUpperCase() !== 'DEACTIVATE MY ACCOUNT') return;
        setActionLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/auth/deactivate-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reason: actionReason.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Deactivation failed');
            setActionDoneMsg('Your account has been deactivated successfully. Logging out...');
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }, 2500);
        } catch (err) {
            setMessage({ text: err.message || 'Failed to deactivate account.', type: 'error' });
            setActionLoading(false);
        }
    };

    // Permanent Account Deletion API Call
    const handleAccountDeleteSubmit = async (e) => {
        e?.preventDefault();
        if (confirmInput.trim().toUpperCase() !== 'DELETE MY ACCOUNT') return;
        setActionLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/auth/delete-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reason: actionReason.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Account deletion failed');
            setActionDoneMsg('Your account and all associated data have been permanently deleted. Logging out...');
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }, 3000);
        } catch (err) {
            setMessage({ text: err.message || 'Failed to delete account.', type: 'error' });
            setActionLoading(false);
        }
    };


    // Password strength validator — same rules enforced on signup
    const validatePasswordStrength = (pw) => {
        if (pw.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
        if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character (e.g. @, #, !, $).';
        return null;
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

        const pwError = validatePasswordStrength(passwordData.newPassword);
        if (pwError) {
            setMessage({ text: pwError, type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            let payload = { newPassword: passwordData.newPassword };

            if (user?.hasPassword !== false) {
                payload.currentPassword = passwordData.currentPassword;
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
                setMessage({ text: user?.hasPassword ? 'Password changed successfully' : 'Password set successfully', type: 'success' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                // Refresh user state so context gets hasPassword updated
                await refreshUser();
            } else {
                setMessage({ text: data.msg || 'Change failed', type: 'error' });
            }
        } catch (error) {
            console.error('[Settings Change Password] Error:', error);
            setMessage({ text: error.message || 'Something went wrong', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-center items-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                <p className="mt-4 text-gray-500 text-sm font-medium">Loading settings...</p>
            </div>
        );
    }

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
                                <button
                                    onClick={() => { setActiveTab('deactivate'); setMessage({ text: '', type: '' }); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'deactivate' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faTrash} /> Deactivate
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

                                {activeTab === 'profile' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Incomplete profile alert */}
                                        {user && !isProfileComplete(user) && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                                <span className="text-amber-500 text-lg mt-0.5">⚠</span>
                                                <div className="flex-1">
                                                    <p className="text-amber-800 font-bold text-sm">Profile Incomplete</p>
                                                    <p className="text-amber-600 text-xs mt-0.5">Complete your profile to place orders. Missing:
                                                        {!user.first_name && ' Name,'}
                                                        {!user.email && ' Email,'}
                                                        {!user.phone_number && ' Phone'}
                                                    </p>
                                                    <button
                                                        onClick={() => openProfileModal({})}
                                                        className="mt-2 text-xs text-amber-700 font-bold underline hover:text-amber-900"
                                                    >
                                                        Complete Now →
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <form onSubmit={handleProfileUpdate} className="space-y-6">
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name (Max 20 chars)</label>
                                                    <input
                                                        type="text"
                                                        maxLength={20}
                                                        value={profileData.first_name}
                                                        onChange={e => {
                                                            const cleaned = e.target.value.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{203C}\u{2049}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '').slice(0, 20);
                                                            setProfileData({ ...profileData, first_name: cleaned });
                                                        }}
                                                        className="w-full px-4 py-3 text-black rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                        placeholder="John"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name (Max 20 chars)</label>
                                                    <input
                                                        type="text"
                                                        maxLength={20}
                                                        value={profileData.last_name}
                                                        onChange={e => {
                                                            const cleaned = e.target.value.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{203C}\u{2049}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '').slice(0, 20);
                                                            setProfileData({ ...profileData, last_name: cleaned });
                                                        }}
                                                        className="w-full px-4 py-3 text-black rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
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
                                                    {loading ? 'Saving...' : <><FontAwesomeIcon icon={faSave} /> Save Name</>}
                                                </button>
                                            </div>
                                        </form>

                                        {/* ─── EMAIL SECTION ─────────────────────────────── */}
                                        <div className="border-t border-gray-100 pt-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faEnvelope} className="text-purple-500" />
                                                        Email Address
                                                    </label>
                                                    <p className="text-gray-500 text-sm mt-1">{user?.email || <span className="text-amber-600">Not set</span>}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowEmailChange(v => !v); setEmailChangeStep('input'); setEmailChangeOtp(''); setMessage({ text: '', type: '' }); }}
                                                    className="text-sm text-purple-600 font-semibold hover:text-purple-800 underline"
                                                >
                                                    {user?.email ? 'Change Email' : 'Add Email'}
                                                </button>
                                            </div>
                                            {showEmailChange && (
                                                <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                                                    {emailChangeStep === 'input' && (
                                                        <>
                                                            <input
                                                                type="email"
                                                                placeholder="Enter new email address"
                                                                value={newEmail}
                                                                onChange={e => setNewEmail(e.target.value)}
                                                                className="w-full px-4 py-3 text-black rounded-xl bg-white border border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none text-sm"
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={loading || !newEmail}
                                                                onClick={async () => {
                                                                    setLoading(true); setMessage({ text: '', type: '' });
                                                                    try {
                                                                        if (newEmail.toLowerCase().trim() === user?.email?.toLowerCase().trim()) {
                                                                            throw new Error('New email address must be different from current email address.');
                                                                        }
                                                                        if (isDisposableEmail(newEmail)) {
                                                                            throw new Error('Temporary or disposable email addresses are not allowed. Please use a permanent email address.');
                                                                        }
                                                                        // Check email availability
                                                                        const checkRes = await fetch(`${API_URL}/api/auth/check-availability`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ email: newEmail })
                                                                        });
                                                                        const checkData = await checkRes.json();
                                                                        if (!checkRes.ok) throw new Error(checkData.msg || 'This email is already registered.');

                                                                        const token = localStorage.getItem('token');
                                                                        const res = await fetch(`${API_URL}/api/otp/send-email-otp`, {
                                                                            method: 'POST',
                                                                            headers: { 
                                                                                'Content-Type': 'application/json',
                                                                                'Authorization': `Bearer ${token}`
                                                                            },
                                                                            body: JSON.stringify({ email: newEmail, purpose: 'email_verify' })
                                                                        });
                                                                        const d = await res.json();
                                                                        if (!res.ok) throw new Error(d.msg);
                                                                        setEmailChangeStep('verify'); setEmailChangeTimer(600);
                                                                        setMessage({ text: 'OTP sent to ' + newEmail, type: 'success' });
                                                                    } catch (e) { setMessage({ text: e.message, type: 'error' }); }
                                                                    setLoading(false);
                                                                }}
                                                                className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50"
                                                            >
                                                                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                                                            </button>
                                                        </>
                                                    )}
                                                    {emailChangeStep === 'verify' && (
                                                        <>
                                                            <p className="text-sm text-purple-700">Enter OTP sent to <strong>{newEmail}</strong></p>
                                                            <input
                                                                type="text"
                                                                maxLength={6}
                                                                placeholder="000000"
                                                                value={emailChangeOtp}
                                                                onChange={e => setEmailChangeOtp(e.target.value.replace(/\D/g, ''))}
                                                                className="w-full px-4 text-black py-3 rounded-xl bg-white border border-purple-200 focus:border-purple-500 outline-none text-center font-mono text-xl tracking-widest"
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={loading || emailChangeOtp.length < 6}
                                                                onClick={async () => {
                                                                    setLoading(true); setMessage({ text: '', type: '' });
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        // Verify OTP then update profile
                                                                        const verifyRes = await fetch(`${API_URL}/api/otp/verify-email-otp`, {
                                                                            method: 'POST',
                                                                            headers: { 
                                                                                'Content-Type': 'application/json',
                                                                                'Authorization': `Bearer ${token}`
                                                                            },
                                                                            body: JSON.stringify({ email: newEmail, otp: emailChangeOtp, purpose: 'email_verify' })
                                                                        });
                                                                        const vd = await verifyRes.json();
                                                                        if (!verifyRes.ok) throw new Error(vd.msg);
                                                                        // Update profile with new email
                                                                        const updateRes = await fetch(`${API_URL}/api/auth/update-profile`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                            body: JSON.stringify({ first_name: profileData.first_name, last_name: profileData.last_name, email: newEmail })
                                                                        });
                                                                        const ud = await updateRes.json();
                                                                        if (!updateRes.ok) throw new Error(ud.msg);
                                                                        setMessage({ text: 'Email updated successfully!', type: 'success' });
                                                                        setShowEmailChange(false); setEmailChangeStep('input'); setNewEmail('');
                                                                        await refreshUser();
                                                                    } catch (e) { setMessage({ text: e.message, type: 'error' }); }
                                                                    setLoading(false);
                                                                }}
                                                                className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50"
                                                            >
                                                                {loading ? 'Verifying...' : 'Verify & Update Email'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* ─── PHONE SECTION ─────────────────────────────── */}
                                        <div className="border-t border-gray-100 pt-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faPhone} className="text-purple-500" />
                                                        Phone Number
                                                    </label>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        {user?.phone_number
                                                            ? (() => { try { const p = typeof user.phone_number === 'string' ? JSON.parse(user.phone_number) : user.phone_number; return `${p.code} ${p.number}`; } catch { return 'Phone set'; } })()
                                                            : <span className="text-amber-600">Not set</span>
                                                        }
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowPhoneChange(v => !v); setPhoneChangeStep('input'); setMessage({ text: '', type: '' }); }}
                                                    className="text-sm text-purple-600 font-semibold hover:text-purple-800 underline"
                                                >
                                                    {user?.phone_number ? 'Change Phone' : 'Add Phone'}
                                                </button>
                                            </div>
                                            {showPhoneChange && (
                                                <div className="bg-purple-50 rounded-xl p-4 space-y-3">

                                                    {phoneChangeStep === 'input' && (
                                                        <>
                                                            <div className="flex gap-2">
                                                                <select
                                                                    value={newPhoneCode}
                                                                    onChange={e => setNewPhoneCode(e.target.value)}
                                                                    className="bg-white text-black border border-purple-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-purple-500 min-w-[90px] [&>option]:text-black"
                                                                >
                                                                    {['+91', '+1', '+44', '+61', '+971', '+65', '+49', '+33', '+81', '+86', '+7', '+55', '+27', '+92', '+880', '+60', '+62', '+63', '+66', '+84', '+90', '+966', '+52', '+94', '+977'].map(c => (
                                                                        <option key={c} value={c}>{c}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    type="tel"
                                                                    placeholder="New phone number"
                                                                    value={newPhoneNum}
                                                                    onChange={e => setNewPhoneNum(e.target.value)}
                                                                    className="flex-1 text-black px-4 py-3 rounded-xl bg-white border border-purple-200 focus:border-purple-500 outline-none text-sm"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                disabled={loading || !newPhoneNum}
                                                                onClick={async () => {
                                                                    setLoading(true); setMessage({ text: '', type: '' });
                                                                    try {
                                                                        const cleanNum = newPhoneNum.replace(/[\s\-()]/g, '');

                                                                        // ── Local validation BEFORE touching reCAPTCHA
                                                                        if (!cleanNum || !/^\d{7,15}$/.test(cleanNum)) {
                                                                            setMessage({ text: 'Invalid phone number. Enter digits only (7–15 digits).', type: 'error' });
                                                                            setLoading(false);
                                                                            return;
                                                                        }

                                                                        // Check if identical to current phone
                                                                        let currentPhone = null;
                                                                        if (user?.phone_number) {
                                                                            currentPhone = typeof user.phone_number === 'string' ? JSON.parse(user.phone_number) : user.phone_number;
                                                                        }
                                                                        if (currentPhone && currentPhone.code === newPhoneCode && currentPhone.number === cleanNum) {
                                                                            throw new Error('New phone number must be different from current phone number.');
                                                                        }

                                                                        // Check availability first
                                                                        const checkRes = await fetch(`${API_URL}/api/auth/check-availability`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ phone_number: { code: newPhoneCode, number: cleanNum } })
                                                                        });
                                                                        const checkData = await checkRes.json();
                                                                        if (!checkRes.ok) throw new Error(checkData.msg || 'This phone number is already registered.');

                                                                        const { signInWithPhoneNumber } = await import('firebase/auth');
                                                                        const { auth } = await import('../lib/firebase');
                                                                        const verifier = await getRecaptchaVerifier(); // only called when phone is valid

                                                                        const full = `${newPhoneCode}${cleanNum}`;
                                                                        const result = await signInWithPhoneNumber(auth, full, verifier);
                                                                        setPhoneChangeConfirmResult(result);
                                                                        setPhoneChangeStep('verify');
                                                                        setPhoneResendCooldown(10);
                                                                        setMessage({ text: 'SMS sent to ' + full, type: 'success' });
                                                                    } catch (e) {
                                                                        cleanupRecaptcha(); // reset so next click is fresh
                                                                        if (e.code === 'auth/invalid-app-credential' || e.code === 'auth/captcha-check-failed') {
                                                                            try {
                                                                                const { signInWithPhoneNumber } = await import('firebase/auth');
                                                                                const { auth } = await import('../lib/firebase');
                                                                                const retryVerifier = await getRecaptchaVerifier();
                                                                                const retryFull = `${newPhoneCode}${cleanNum}`;
                                                                                const retryResult = await signInWithPhoneNumber(auth, retryFull, retryVerifier);
                                                                                setPhoneChangeConfirmResult(retryResult);
                                                                                setPhoneChangeStep('verify');
                                                                                setPhoneResendCooldown(10);
                                                                                setMessage({ text: 'SMS sent to ' + retryFull, type: 'success' });
                                                                                setLoading(false);
                                                                                return;
                                                                            } catch (retryErr) {
                                                                                cleanupRecaptcha();
                                                                            }
                                                                        }
                                                                        if (e.code === 'auth/too-many-requests') setPhoneResendCooldown(300);
                                                                        const errMsg = e.code === 'auth/too-many-requests' ? 'Too many SMS attempts. The Send button is locked for 5 minutes.'
                                                                            : e.code === 'auth/invalid-app-credential' ? 'reCAPTCHA session expired. Please click Send OTP again.'
                                                                            : (e.message || 'Failed to send SMS');
                                                                        setMessage({ text: errMsg, type: 'error' });
                                                                    }
                                                                    setLoading(false);
                                                                }}
                                                                className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50"
                                                            >
                                                                {loading ? 'Sending SMS...' : 'Send SMS OTP'}
                                                            </button>
                                                        </>
                                                    )}
                                                    {phoneChangeStep === 'verify' && (
                                                        <>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-purple-700">Enter OTP sent via SMS</span>
                                                                <button
                                                                    type="button"
                                                                    disabled={loading || phoneResendCooldown > 0}
                                                                    onClick={async () => {
                                                                        setLoading(true); setMessage({ text: '', type: '' });
                                                                        try {
                                                                            const cleanNum = newPhoneNum.replace(/\D/g, '');
                                                                            const { signInWithPhoneNumber } = await import('firebase/auth');
                                                                            const { auth } = await import('../lib/firebase');
                                                                            const verifier = await getRecaptchaVerifier();

                                                                            const full = `${newPhoneCode}${cleanNum}`;
                                                                            const result = await signInWithPhoneNumber(auth, full, verifier);
                                                                            setPhoneChangeConfirmResult(result);
                                                                            setPhoneResendCooldown(10);
                                                                            setMessage({ text: 'New SMS code sent to ' + full, type: 'success' });
                                                                        } catch (e) {
                                                                            cleanupRecaptcha(); // reset so next click is fresh
                                                                            if (e.code === 'auth/too-many-requests') setPhoneResendCooldown(300);
                                                                            const resendErrMsg = e.code === 'auth/too-many-requests' ? 'Too many SMS attempts. The Resend button is locked for 5 minutes.'
                                                                                : e.code === 'auth/invalid-app-credential' ? 'reCAPTCHA session expired. Please click Resend SMS again.'
                                                                                : (e.message || 'Failed to resend SMS');
                                                                            setMessage({ text: resendErrMsg, type: 'error' });
                                                                        }
                                                                        setLoading(false);
                                                                    }}
                                                                    className="text-purple-600 hover:text-purple-800 font-bold disabled:opacity-50 transition-colors"
                                                                >
                                                                    {phoneResendCooldown > 0 ? `Resend SMS (${phoneResendCooldown}s)` : 'Resend SMS'}
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                maxLength={6}
                                                                placeholder="000000"
                                                                value={phoneChangeOtp}
                                                                onChange={e => setPhoneChangeOtp(e.target.value.replace(/\D/g, ''))}
                                                                className="w-full text-black px-4 py-3 rounded-xl bg-white border border-purple-200 focus:border-purple-500 outline-none text-center font-mono text-xl tracking-widest"
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={loading || phoneChangeOtp.length < 6}
                                                                onClick={async () => {
                                                                    setLoading(true); setMessage({ text: '', type: '' });
                                                                    try {
                                                                        if (!phoneChangeConfirmResult) throw new Error('Session expired. Resend OTP.');
                                                                        await phoneChangeConfirmResult.confirm(phoneChangeOtp);
                                                                        // Update phone via update-profile endpoint
                                                                        const token = localStorage.getItem('token');
                                                                        const updateRes = await fetch(`${API_URL}/api/auth/update-profile`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                            body: JSON.stringify({ first_name: profileData.first_name, last_name: profileData.last_name, phone_number: { code: newPhoneCode, number: newPhoneNum.replace(/[\s\-()]/g, '') } })
                                                                        });
                                                                        const ud = await updateRes.json();
                                                                        if (!updateRes.ok) throw new Error(ud.msg);
                                                                        setMessage({ text: 'Phone updated successfully!', type: 'success' });
                                                                        setShowPhoneChange(false); setPhoneChangeStep('input'); setNewPhoneNum('');
                                                                        await refreshUser();
                                                                    } catch (e) { setMessage({ text: e.message, type: 'error' }); }
                                                                    setLoading(false);
                                                                }}
                                                                className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50"
                                                            >
                                                                {loading ? 'Updating...' : 'Verify & Update Phone'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                    </motion.div>
                                )}

                                {activeTab === 'password' && (
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

                                        {user?.hasPassword === false ? (
                                            /* --- CASE A: NO PASSWORD SET YET (OTP/Google signup) --- */
                                            <div className="space-y-6">
                                                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                                                    <div className="flex gap-3">
                                                        <FontAwesomeIcon icon={faShieldAlt} className="text-purple-600 text-lg mt-0.5" />
                                                        <div>
                                                            <h4 className="text-purple-900 font-bold text-sm">Set Account Password</h4>
                                                            <p className="text-purple-700 text-xs mt-1 leading-relaxed">
                                                                You signed in via Google or OTP and haven't created a password for this account yet. 
                                                                Setting a password allows you to log in using either your email/phone or a password in the future.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.newPassword}
                                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            className="w-full text-black px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                            placeholder="Min 8 chars with uppercase, number & symbol"
                                                            required
                                                        />
                                                        <p className="mt-1.5 text-[11px] text-gray-400">Min 8 chars · uppercase · lowercase · number · special char</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            className="w-full text-black px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                            placeholder="Confirm new password"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 flex justify-end">
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                    >
                                                        {loading ? 'Setting...' : <><FontAwesomeIcon icon={faLock} /> Set Password</>}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* --- CASE B: USER HAS PASSWORD SET (Traditional password change) --- */
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.currentPassword}
                                                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                        className="w-full px-4 py-3 text-black rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                        placeholder="Enter current password"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.newPassword}
                                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            className="w-full text-black px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                            placeholder="Min 8 chars with uppercase, number & symbol"
                                                            required
                                                        />
                                                        <p className="mt-1.5 text-[11px] text-gray-400">Min 8 chars · uppercase · lowercase · number · special char</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            className="w-full text-black px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                            placeholder="Confirm new password"
                                                            required
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
                                            </div>
                                        )}
                                    </motion.form>
                                )}

                                {/* ── Deactivate / Delete Account Tab ── */}
                            {activeTab === 'deactivate' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Manage Account Access & Data</h2>
                                        <p className="text-gray-500 text-sm mt-1">Choose whether to temporarily deactivate your account or permanently delete your account and personal data.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Option 1: Deactivate Card */}
                                        <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
                                            <div className="space-y-3">
                                                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
                                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                                </div>
                                                <div>
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 uppercase tracking-wider mb-2">Temporary</span>
                                                    <h3 className="text-lg font-bold text-gray-900">Deactivate Account</h3>
                                                </div>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    Disable account access while keeping all your orders, purchases, downloads, and profile data safely preserved in our database. You can reactivate at any time by logging in with phone OTP.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openAccountModal('deactivate')}
                                                className="mt-6 w-full py-3 px-4 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm"
                                            >
                                                Deactivate Account
                                            </button>
                                        </div>

                                        {/* Option 2: Delete Card */}
                                        <div className="border border-red-200 bg-red-50/50 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
                                            <div className="space-y-3">
                                                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl">
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </div>
                                                <div>
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-200 text-red-900 uppercase tracking-wider mb-2">Permanent • Data Loss</span>
                                                    <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                                                </div>
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    Permanently delete your account and <strong>erase all associated data</strong> including profile information, complete order history, payment records, saved cart, and wishlist items. ⚠️ This action cannot be undone.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openAccountModal('delete')}
                                                className="mt-6 w-full py-3 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                                Delete Account Permanently
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

            {/* Account Deactivation / Deletion Confirmation Modal */}
            {accountModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={closeAccountModal}
                            disabled={actionLoading}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors text-sm font-bold"
                        >
                            ✕
                        </button>

                        {actionDoneMsg ? (
                            <div className="py-8 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl flex items-center justify-center mx-auto">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Action Confirmed</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{actionDoneMsg}</p>
                            </div>
                        ) : accountActionType === 'deactivate' ? (
                            <form onSubmit={handleAccountDeactivateSubmit} className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg">
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Deactivate Account</h3>
                                        <p className="text-xs text-gray-500">Temporarily disable account access</p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
                                    <strong>What happens when you deactivate?</strong><br />
                                    • Your login access will be temporarily disabled.<br />
                                    • Your profile, order history, and data remain safely saved.<br />
                                    • You can reactivate anytime by logging in with phone OTP.<br />
                                    • A confirmation email will be sent to your registered address.
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Reason for deactivating (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={actionReason}
                                        onChange={e => setActionReason(e.target.value)}
                                        placeholder="Tell us why you are deactivating your account..."
                                        className="w-full text-xs text-black p-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">
                                        Type <span className="font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">DEACTIVATE MY ACCOUNT</span> to confirm:
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmInput}
                                        onChange={e => setConfirmInput(e.target.value)}
                                        placeholder="DEACTIVATE MY ACCOUNT"
                                        className="w-full text-xs text-black font-mono p-3 rounded-xl border border-gray-300 focus:border-amber-500 outline-none uppercase"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeAccountModal}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || confirmInput.trim().toUpperCase() !== 'DEACTIVATE MY ACCOUNT'}
                                        className="flex-1 py-3 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 disabled:opacity-40 transition-all"
                                    >
                                        {actionLoading ? 'Processing...' : 'Confirm Deactivation'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleAccountDeleteSubmit} className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-lg">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Delete Account Permanently</h3>
                                        <p className="text-xs text-red-600 font-semibold">⚠️ Irreversible Action • Data Loss</p>
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 leading-relaxed">
                                    <strong className="text-red-700">Warning: Permanent Data Loss!</strong><br />
                                    • ALL user profile details, email, and phone references will be erased.<br />
                                    • Complete order history, purchases, invoice data, and digital tokens will be permanently removed.<br />
                                    • Your active cart items and saved wishlist will be deleted.<br />
                                    • A confirmation email will be sent to your address before completion.<br />
                                    • <strong className="underline">This action cannot be undone or recovered under any circumstances.</strong>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Reason for deleting account (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={actionReason}
                                        onChange={e => setActionReason(e.target.value)}
                                        placeholder="Please share why you are deleting your account..."
                                        className="w-full text-xs text-black p-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">
                                        Type <span className="font-mono text-red-700 bg-red-100 px-1.5 py-0.5 rounded">DELETE MY ACCOUNT</span> to confirm:
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmInput}
                                        onChange={e => setConfirmInput(e.target.value)}
                                        placeholder="DELETE MY ACCOUNT"
                                        className="w-full text-xs text-black font-mono p-3 rounded-xl border border-gray-300 focus:border-red-500 outline-none uppercase"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeAccountModal}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || confirmInput.trim().toUpperCase() !== 'DELETE MY ACCOUNT'}
                                        className="flex-1 py-3 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                        {actionLoading ? 'Deleting Data...' : 'Delete Permanently'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
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