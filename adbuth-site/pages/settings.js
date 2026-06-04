import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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

    useEffect(() => {
        if (!authLoading && !user) {
            localStorage.setItem('intendedDestination', '/settings');
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
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

    const cleanupRecaptcha = () => {
        try {
            if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
                recaptchaVerifierRef.current = null;
            }
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        return () => {
            cleanupRecaptcha();
        };
    }, []);

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
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.first_name}
                                                        onChange={e => setProfileData({ ...profileData, first_name: e.target.value })}
                                                        className="w-full px-4 py-3 text-black rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                        placeholder="John"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.last_name}
                                                        onChange={e => setProfileData({ ...profileData, last_name: e.target.value })}
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
                                                                        const res = await fetch(`${API_URL}/api/otp/send-email-otp`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
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
                                                                            headers: { 'Content-Type': 'application/json' },
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
                                                    {/* Recaptcha */}
                                                    <div id="recaptcha-container-settings" />
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
                                                                        const { signInWithPhoneNumber, RecaptchaVerifier } = await import('firebase/auth');
                                                                        const { auth } = await import('../lib/firebase');
                                                                        let verifier;
                                                                        if (!recaptchaVerifierRef.current) {
                                                                            verifier = new RecaptchaVerifier(auth, 'recaptcha-container-settings', { size: 'invisible' });
                                                                            await verifier.render();
                                                                            recaptchaVerifierRef.current = verifier;
                                                                        } else {
                                                                            verifier = recaptchaVerifierRef.current;
                                                                        }
                                                                        const full = `${newPhoneCode}${newPhoneNum.replace(/[\s\-()]/g, '')}`;
                                                                        const result = await signInWithPhoneNumber(auth, full, verifier);
                                                                        setPhoneChangeConfirmResult(result);
                                                                        setPhoneChangeStep('verify');
                                                                        setMessage({ text: 'SMS sent to ' + full, type: 'success' });
                                                                    } catch (e) { setMessage({ text: e.message || 'Failed to send SMS', type: 'error' }); cleanupRecaptcha(); }
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
                                                            <p className="text-sm text-purple-700">Enter OTP sent via SMS</p>
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
                                                                        // Update phone via complete-profile endpoint
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
                                                            placeholder="Minimum 6 characters"
                                                            required
                                                        />
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
                                                            placeholder="Minimum 6 characters"
                                                            required
                                                        />
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