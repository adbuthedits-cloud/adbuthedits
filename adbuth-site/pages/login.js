import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope, faLock, faEye, faEyeSlash, faPhone,
    faShieldHalved, faArrowRight, faRotateLeft, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

import DeactivatedAccountModal from '../components/auth/DeactivatedAccountModal';

const Beams = dynamic(() => import('../components/ui/Beams'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const countryOptions = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+971', country: 'UAE' },
    { code: '+65', country: 'Singapore' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' },
    { code: '+7', country: 'Russia' },
    { code: '+55', country: 'Brazil' },
    { code: '+27', country: 'South Africa' },
    { code: '+92', country: 'Pakistan' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+60', country: 'Malaysia' },
    { code: '+62', country: 'Indonesia' },
    { code: '+63', country: 'Philippines' },
    { code: '+66', country: 'Thailand' },
    { code: '+84', country: 'Vietnam' },
    { code: '+90', country: 'Turkey' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+52', country: 'Mexico' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+977', country: 'Nepal' },
];

// ─── OTP Input Component ───────────────────────────────────────────────────────
function OtpInput({ length = 6, value, onChange }) {
    const inputs = useRef([]);

    const handleKey = (e, idx) => {
        if (e.key === 'Backspace' && !value[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus();
        }
    };

    const handleChange = (e, idx) => {
        const v = e.target.value.replace(/\D/, '');
        if (!v) {
            const arr = value.split('');
            arr[idx] = '';
            onChange(arr.join(''));
            return;
        }
        const arr = value.split('');
        arr[idx] = v[v.length - 1];
        onChange(arr.join(''));
        if (idx < length - 1) inputs.current[idx + 1]?.focus();
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        onChange(paste.padEnd(length, '').slice(0, length));
        inputs.current[Math.min(paste.length, length - 1)]?.focus();
        e.preventDefault();
    };

    return (
        <div className="flex gap-2 justify-center my-4">
            {Array.from({ length }).map((_, idx) => (
                <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    ref={el => inputs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[idx] || ''}
                    onChange={e => handleChange(e, idx)}
                    onKeyDown={e => handleKey(e, idx)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center text-xl font-bold text-white bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all caret-purple-400"
                    style={{ fontFamily: 'monospace' }}
                />
            ))}
        </div>
    );
}

// ─── Countdown Timer ───────────────────────────────────────────────────────────
function Countdown({ seconds, onExpire }) {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        setRemaining(seconds);
        const interval = setInterval(() => {
            setRemaining(prev => {
                if (prev <= 1) { clearInterval(interval); onExpire?.(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds]);

    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return (
        <span className={`text-xs font-mono tabular-nums ${remaining < 30 ? 'text-red-400' : 'text-white/50'}`}>
            {m}:{s.toString().padStart(2, '0')}
        </span>
    );
}

// ─── Main Login Page ───────────────────────────────────────────────────────────
export default function Login() {
    const { seoData } = useSeo('login');
    const router = useRouter();
    const { login, user, loading: authLoading, openProfileModal, refreshUser } = useAuth();
    const isLoginAction = useRef(false);
    const isForgotTransition = useRef(false);

    // Tabs: 'password' | 'email_otp' | 'phone_otp'
    const [activeTab, setActiveTab] = useState('password');

    // ── Password login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // ── Email OTP state
    const [otpEmail, setOtpEmail] = useState('');
    const [otpStep, setOtpStep] = useState('input'); // 'input' | 'verify' | 'reset'
    const [emailOtpValue, setEmailOtpValue] = useState('');
    const [forgotMode, setForgotMode] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [emailPendingToken, setEmailPendingToken] = useState(null); // for new user email OTP flow
    const [isNewEmailUser, setIsNewEmailUser] = useState(false);

    // ── Firebase Phone OTP state
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneOtpValue, setPhoneOtpValue] = useState('');
    const [phoneStep, setPhoneStep] = useState('input'); // 'input' | 'verify'
    const [phoneTimer, setPhoneTimer] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const recaptchaContainerRef = useRef(null);

    // ── Shared state
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deactivatedModalOpen, setDeactivatedModalOpen] = useState(false);
    const [deactivatedUserIdentifier, setDeactivatedUserIdentifier] = useState('');

    // Beams config
    const [beamConfig, setBeamConfig] = useState({ beamWidth: 3, beamHeight: 30, beamNumber: 20, scale: 0.2 });

    useEffect(() => {
        if (!authLoading && user && !isLoginAction.current) router.replace('/');
    }, [user, authLoading]);

    useEffect(() => {
        const { token, error: qErr } = router.query;
        if (token) { localStorage.setItem('token', token); window.location.href = '/'; }
        if (qErr) {
            let msg = 'Social login error';
            if (qErr === 'google_failed') msg = 'Google authentication failed';
            else if (qErr === 'google_not_configured') msg = 'Google login is not configured in backend .env';
            setError(msg);
        }
    }, [router.query]);

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            if (w < 640) setBeamConfig({ beamWidth: 2, beamHeight: 20, beamNumber: 15, scale: 0.15 });
            else if (w < 1024) setBeamConfig({ beamWidth: 2.5, beamHeight: 25, beamNumber: 18, scale: 0.18 });
            else setBeamConfig({ beamWidth: 3, beamHeight: 30, beamNumber: 20, scale: 0.2 });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset state when tab changes
    useEffect(() => {
        setError(''); setSuccess('');
        if (!isForgotTransition.current) {
            setForgotMode(false);
        }
        isForgotTransition.current = false;
        setOtpStep('input'); setEmailOtpValue('');
        setPhoneStep('input'); setPhoneOtpValue('');
        setOtpTimer(0); setPhoneTimer(0);
        if (activeTab !== 'phone_otp') destroyRecaptcha();
    }, [activeTab]);

    // Cleanup on page unmount
    useEffect(() => { return () => destroyRecaptcha(); }, []);

    // ── Fully destroy the reCAPTCHA widget and clear the container
    const destroyRecaptcha = () => {
        try {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        } catch (e) {
            window.recaptchaVerifier = null;
        }
        try {
            const el = document.getElementById('recaptcha-container');
            if (el) {
                el.innerHTML = '';
                const newEl = el.cloneNode(false);
                el.parentNode?.replaceChild(newEl, el);
            }
        } catch (e) { /* ignore */ }
    };

    // ── Create a fresh invisible reCAPTCHA verifier or reuse existing
    const initRecaptcha = async () => {
        if (window.recaptchaVerifier) {
            return window.recaptchaVerifier;
        }

        const { RecaptchaVerifier } = await import('firebase/auth');
        const { auth } = await import('../lib/firebase');

        const el = document.getElementById('recaptcha-container');
        if (el) el.innerHTML = '';

        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => { /* solved */ },
            'expired-callback': () => { destroyRecaptcha(); },
        });

        await window.recaptchaVerifier.render();
        return window.recaptchaVerifier;
    };

    // ── Social login handlers
    const handleGoogleLogin = () => { window.location.href = `${API_URL}/api/auth/google`; };

    // Helper to validate email or phone number format
    const validateEmailOrPhone = (val) => {
        if (!val || !val.trim()) return { isValid: false, error: 'Please enter your email address or phone number.' };
        const trimmed = val.trim();
        // Email regex check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(trimmed)) {
            return { isValid: true, type: 'email', value: trimmed };
        }
        // Phone regex check: allow optional +, spaces, dashes, parens, 7 to 15 digits
        const digitsOnly = trimmed.replace(/\D/g, '');
        const phoneRegex = /^(\+?\d{1,4}[\s.-]?)?[\d\s.()-]{7,20}$/;
        if (digitsOnly.length >= 7 && digitsOnly.length <= 15 && phoneRegex.test(trimmed)) {
            return { isValid: true, type: 'phone', value: trimmed };
        }
        return { isValid: false, error: 'Please enter a valid email address or phone number.' };
    };

    // ── Password login
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const check = validateEmailOrPhone(email);
        if (!check.isValid) {
            setError(check.error);
            return;
        }
        setError(''); setIsSubmitting(true);
        isLoginAction.current = true;
        const result = await login(email, password);
        if (!result.success) {
            if (result.isDeactivated) {
                setDeactivatedUserIdentifier(email);
                setDeactivatedModalOpen(true);
            }
            setError(result.error);
            isLoginAction.current = false;
        }
        setIsSubmitting(false);
    };

    // ── Forgot Password click handler
    const handleForgotPasswordClick = () => {
        setError(''); setSuccess('');
        isForgotTransition.current = true;
        setForgotMode(true);
        setOtpStep('input');
        setPhoneStep('input');
        setEmailOtpValue('');
        setPhoneOtpValue('');

        const trimmed = (email || '').trim();
        const check = validateEmailOrPhone(trimmed);
        if (check.isValid) {
            if (check.type === 'email') {
                setOtpEmail(check.value);
                setActiveTab('email_otp');
            } else if (check.type === 'phone') {
                const digits = check.value.replace(/\D/g, '');
                setPhoneNumber(digits.length === 10 ? digits : check.value);
                setActiveTab('phone_otp');
            }
        } else {
            const digitsOnly = trimmed.replace(/\D/g, '');
            if (digitsOnly.length >= 7) {
                setPhoneNumber(digitsOnly.length === 10 ? digitsOnly : trimmed);
                setActiveTab('phone_otp');
            } else {
                setActiveTab('email_otp');
            }
        }
    };

    // ── Email OTP: send
    const handleSendEmailOtp = async (e) => {
        e?.preventDefault();
        const trimmedEmail = (otpEmail || '').trim();
        if (!trimmedEmail) return setError('Please enter your email address.');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            const digitsOnly = trimmedEmail.replace(/\D/g, '');
            if (digitsOnly.length >= 7) {
                return setError('You entered a phone number. Please switch to Phone OTP tab or enter a valid email address.');
            }
            return setError('Please enter a valid email address.');
        }
        setError(''); setIsSubmitting(true);
        setEmailPendingToken(null); setIsNewEmailUser(false);
        try {
            const purpose = forgotMode ? 'forgot_password' : 'email_login';
            const res = await fetch(`${API_URL}/api/otp/send-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmedEmail, purpose }),
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Failed to send OTP');

            // New user path: backend returned a pendingToken
            if (data.isNewUser && data.pendingToken) {
                setEmailPendingToken(data.pendingToken);
                setIsNewEmailUser(true);
                setSuccess('OTP sent! This will create a new account for ' + trimmedEmail);
            } else {
                setSuccess('OTP sent! Check your email.');
            }
            setOtpStep('verify'); setEmailOtpValue(''); setOtpTimer(600);
        } catch (err) { setError(err.message); }
        setIsSubmitting(false);
    };

    // ── Email OTP: verify
    const handleVerifyEmailOtp = async (e) => {
        e?.preventDefault();
        if (emailOtpValue.length < 6) return setError('Please enter the complete 6-digit OTP.');
        setError(''); setIsSubmitting(true);
        try {
            const purpose = forgotMode ? 'forgot_password' : 'email_login';
            const body = { email: otpEmail, otp: emailOtpValue, purpose };
            // Pass pendingToken if this is a new user
            if (emailPendingToken) body.pendingToken = emailPendingToken;

            const res = await fetch(`${API_URL}/api/otp/verify-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Verification failed');

            if (forgotMode) {
                setResetToken(data.resetToken);
                setOtpStep('reset');
                setSuccess('OTP verified! Set your new password.');
            } else {
                localStorage.setItem('token', data.token);
                isLoginAction.current = true;
                // Refresh full user data
                const freshUser = await refreshUser();

                setSuccess(data.isNewUser ? 'Welcome! Redirecting...' : 'Logged in successfully!');
                const intended = localStorage.getItem('intendedDestination');
                if (intended) {
                    localStorage.removeItem('intendedDestination');
                    setTimeout(() => { window.location.href = intended; }, 600);
                } else {
                    setTimeout(() => { window.location.href = '/'; }, 800);
                }
            }
        } catch (err) { setError(err.message); }
        setIsSubmitting(false);
    };

    // ── Reset password after OTP
    const handleResetPassword = async (e) => {
        e?.preventDefault();
        if (!newPassword) return setError('Please enter a new password.');
        if (newPassword.length < 6) return setError('Password must be at least 6 characters long.');
        if (!/[A-Z]/.test(newPassword)) return setError('Password must contain at least one uppercase letter.');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) return setError('Password must contain at least one special character.');
        setError(''); setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/otp/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, newPassword }),
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Reset failed');
            setSuccess('Password reset! Redirecting to login...');
            setTimeout(() => {
                setActiveTab('password'); setOtpStep('input'); setForgotMode(false); setNewPassword('');
            }, 1500);
        } catch (err) { setError(err.message); }
        setIsSubmitting(false);
    };

    // ── Firebase Phone OTP: Send SMS
    const handleSendPhoneOtp = async (e) => {
        e?.preventDefault();
        const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
        if (!cleaned) return setError('Please enter your phone number.');
        setError(''); setSuccess(''); setIsSubmitting(true);

        try {
            const { signInWithPhoneNumber } = await import('firebase/auth');
            const { auth } = await import('../lib/firebase');

            const appVerifier = await initRecaptcha();
            const fullPhone = `${countryCode}${cleaned}`;

            const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
            setConfirmationResult(result);
            setPhoneStep('verify');
            setPhoneOtpValue('');
            setPhoneTimer(120);
            setSuccess(`SMS sent to ${fullPhone}`);

        } catch (err) {
            console.error('[Phone OTP] Send error:', err.code, err.message);
            destroyRecaptcha();
            const msg = {
                'auth/invalid-phone-number': 'Invalid phone number. Use digits only e.g. 9876543210.',
                'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
                'auth/captcha-check-failed': 'reCAPTCHA failed. Refresh the page and try again.',
                'auth/invalid-app-credential': 'reCAPTCHA not configured in Firebase Console. Check setup.',
                'auth/quota-exceeded': 'SMS quota exceeded. Try again later.',
                'auth/network-request-failed': 'Network error. Check your internet connection.',
                'auth/missing-phone-number': 'Please enter your phone number.',
                'auth/app-not-authorized': 'Domain not authorized. Add it in Firebase → Auth → Settings → Authorized Domains.',
                'auth/web-storage-unsupported': 'Browser is blocking required storage. Disable tracking protection.',
            }[err.code];
            setError(msg || err.message || 'Failed to send SMS. Please try again.');
        }
        setIsSubmitting(false);
    };

    // ── Firebase Phone OTP: Verify SMS code
    const handleVerifyPhoneOtp = async (e) => {
        e?.preventDefault();
        if (phoneOtpValue.length < 6) return setError('Enter the complete 6-digit OTP.');
        if (!confirmationResult) return setError('Session expired. Please resend the OTP.');
        setError(''); setIsSubmitting(true);

        try {
            const firebaseResult = await confirmationResult.confirm(phoneOtpValue);
            const idToken = await firebaseResult.user.getIdToken();

            const endpoint = forgotMode
                ? 'firebase-phone-forgot-password'
                : 'firebase-phone-verify';

            const res = await fetch(`${API_URL}/api/otp/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, purpose: 'login' }),
            });

            let data;
            try { data = await res.json(); }
            catch { throw new Error(`Server error (${res.status})`); }

            if (!res.ok) {
                if (data.isDeactivated) {
                    setDeactivatedUserIdentifier(`${countryCode}${phoneNumber}`);
                    setDeactivatedModalOpen(true);
                }
                throw new Error(data.msg || 'Verification failed');
            }

            if (forgotMode) {
                setResetToken(data.resetToken);
                setOtpEmail(`${countryCode} ${phoneNumber}`);
                setActiveTab('email_otp');
                setOtpStep('reset');
                setSuccess('Phone verified! Set your new password.');
            } else {
                localStorage.setItem('token', data.token);
                isLoginAction.current = true;
                // Refresh full user data
                await refreshUser();

                setSuccess(data.isNewUser ? 'Welcome! Redirecting...' : 'Logged in successfully!');
                const intended = localStorage.getItem('intendedDestination');
                if (intended) {
                    localStorage.removeItem('intendedDestination');
                    setTimeout(() => { window.location.href = intended; }, 600);
                } else {
                    setTimeout(() => { window.location.href = '/'; }, 800);
                }
            }

        } catch (err) {
            console.error('[Phone OTP] Verify error:', err.code, err.message);
            const msg = {
                'auth/invalid-verification-code': 'Incorrect OTP. Please check and try again.',
                'auth/code-expired': 'OTP has expired. Please click Resend.',
                'auth/session-expired': 'Session expired. Please resend the OTP.',
                'auth/missing-verification-code': 'Please enter the OTP from your SMS.',
            }[err.code];
            setError(msg || err.message || 'Verification failed. Please try again.');
        }
        setIsSubmitting(false);
    };

    const tabs = [
        { id: 'password', label: 'Password', icon: faLock },
        { id: 'email_otp', label: 'Email OTP', icon: faEnvelope },
        { id: 'phone_otp', label: 'Phone OTP', icon: faPhone },
    ];

    return (
        <div className="relative min-h-screen w-full bg-neutral-950 flex flex-col overflow-y-auto overflow-x-hidden">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Login | Adbuth Verse"}
                description={seoData?.meta_description || seoData?.description || "Login to your Adbuth Verse account."}
                data={seoData}
            />

            {/* Beams Background */}
            <div className="absolute inset-0 w-full h-full">
                <Beams beamWidth={beamConfig.beamWidth} beamHeight={beamConfig.beamHeight}
                    beamNumber={beamConfig.beamNumber} lightColor="#f53ff8"
                    speed={2} noiseIntensity={1.75} scale={beamConfig.scale} rotation={30}
                    className="w-full h-full" />
            </div>

            {/* Invisible reCAPTCHA container — Firebase requires this in the DOM */}
            <div id="recaptcha-container" ref={recaptchaContainerRef} />

            {/* Header */}
            <header className="w-full top-0 left-0 z-50 transition-all duration-300">
                <div className="max-w-7xl md:mx-12 lg:mx-auto mx-auto flex items-center justify-between p-6 relative z-50">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative lg:w-36 md:w-28 sm:w-24 w-28 h-auto aspect-[3/1]">
                            <Image src="https://assets.adbuthverse.com/website-assets/brand/logo.webp"
                                alt="logo" fill style={{ objectFit: 'contain' }} className="drop-shadow-md" priority />
                        </div>
                    </Link>
                </div>
            </header>

            {/* Card */}
            <div className="flex my-auto w-full items-center justify-center p-4 py-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm sm:max-w-md relative z-20"
                >
                    <div className="relative group">
                        {/* Noise overlay */}
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none rounded-3xl" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }} />

                        <div className="relative bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl overflow-hidden w-full flex flex-col">

                            {/* Title */}
                            <div className="text-center mb-5">
                                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">Welcome Back</h1>
                                <p className="text-white/50 text-xs">Sign in to your account</p>
                            </div>

                            {/* Tab Switcher */}
                            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5 border border-white/10">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        id={`login-tab-${tab.id}`}
                                        onClick={() => { isForgotTransition.current = false; setForgotMode(false); setActiveTab(tab.id); }}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                                            : 'text-white/40 hover:text-white/70'}`}
                                    >
                                        <FontAwesomeIcon icon={tab.icon} className="text-[10px]" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Alert Messages */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div key="err"
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-xl text-xs text-center mb-4">
                                        {error}
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div key="ok"
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="bg-green-900/30 border border-green-500/30 text-green-300 px-4 py-2.5 rounded-xl text-xs text-center mb-4 flex items-center justify-center gap-2">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        {success}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence mode="wait">

                                {/* ── TAB: Password ── */}
                                {activeTab === 'password' && (
                                    <motion.div key="pw"
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2 }}>
                                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                            <input id="login-email-input" type="text" required placeholder="EMAIL OR PHONE NUMBER"
                                                className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                value={email} onChange={e => setEmail(e.target.value)} />

                                            <div className="relative">
                                                <input id="login-password-input" type={showPassword ? 'text' : 'password'} required placeholder="PASSWORD"
                                                    className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1.5 pr-8 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                    value={password} onChange={e => setPassword(e.target.value)} />
                                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <button type="button" id="forgot-password-btn"
                                                    onClick={handleForgotPasswordClick}
                                                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                                                    Forgot password?
                                                </button>
                                            </div>

                                            <button id="login-submit-btn" type="submit" disabled={isSubmitting}
                                                className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                {isSubmitting ? (
                                                    <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Signing In...</span></>
                                                ) : <>Sign In <FontAwesomeIcon icon={faArrowRight} className="text-xs" /></>}
                                            </button>
                                        </form>
                                    </motion.div>
                                )}

                                {/* ── TAB: Email OTP ── */}
                                {activeTab === 'email_otp' && (
                                    <motion.div key="eotp"
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2 }}>

                                        {forgotMode && (
                                            <div className="flex items-center justify-between mb-4 bg-purple-900/20 border border-purple-500/20 rounded-xl px-3 py-2">
                                                <span className="text-xs text-purple-300 font-semibold">🔑 Forgot Password Mode</span>
                                                <button id="cancel-forgot-btn" type="button"
                                                    onClick={() => { setForgotMode(false); setOtpStep('input'); setError(''); setSuccess(''); }}
                                                    className="text-[10px] text-white/40 hover:text-white/70 underline">Cancel</button>
                                            </div>
                                        )}

                                        {otpStep === 'input' && (
                                            <form onSubmit={handleSendEmailOtp} className="space-y-4">
                                                <div>
                                                    <label className="block text-white/50 text-[10px] uppercase tracking-wider mb-1.5">
                                                        {forgotMode ? 'Enter your registered email' : 'Enter your email to receive OTP'}
                                                    </label>
                                                    <input id="email-otp-input" type="email" required placeholder="your@email.com"
                                                        className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                        value={otpEmail} onChange={e => { setOtpEmail(e.target.value); setError(''); }} />
                                                </div>
                                                <button id="send-email-otp-btn" type="submit" disabled={isSubmitting}
                                                    className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                    {isSubmitting ? (
                                                        <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Sending...</span></>
                                                    ) : <><FontAwesomeIcon icon={faEnvelope} className="text-xs" /> Send OTP</>}
                                                </button>
                                                {!forgotMode && (
                                                    <p className="text-center text-xs text-white/40 mt-2">
                                                        Forgot password?{' '}
                                                        <button type="button" onClick={() => { setForgotMode(true); setError(''); setSuccess(''); }}
                                                            className="text-purple-400 hover:text-purple-300 underline">Reset via OTP</button>
                                                    </p>
                                                )}
                                            </form>
                                        )}

                                        {otpStep === 'verify' && (
                                            <form onSubmit={handleVerifyEmailOtp} className="space-y-2">
                                                <div className="text-center">
                                                    <p className="text-white/60 text-xs mb-1">OTP sent to</p>
                                                    <p className="text-white text-sm font-semibold">{otpEmail}</p>
                                                </div>
                                                <OtpInput length={6} value={emailOtpValue} onChange={v => { setEmailOtpValue(v); setError(''); }} />
                                                <div className="flex items-center justify-between text-xs text-white/40 px-1">
                                                    <span>Expires in: <Countdown seconds={otpTimer} onExpire={() => setError('OTP expired. Please resend.')} /></span>
                                                    <button id="resend-email-otp-btn" type="button" disabled={isSubmitting}
                                                        onClick={() => { setError(''); setSuccess(''); handleSendEmailOtp(); }}
                                                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50">
                                                        <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" /> Resend
                                                    </button>
                                                </div>
                                                <button id="verify-email-otp-btn" type="submit" disabled={isSubmitting || emailOtpValue.length < 6}
                                                    className="w-full mt-2 bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                    {isSubmitting ? (
                                                        <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Verifying...</span></>
                                                    ) : <><FontAwesomeIcon icon={faShieldHalved} className="text-xs" /> Verify OTP</>}
                                                </button>
                                                <button type="button" onClick={() => { setOtpStep('input'); setEmailOtpValue(''); setError(''); setSuccess(''); }}
                                                    className="w-full text-xs text-white/30 hover:text-white/60 mt-1">← Change Email</button>
                                            </form>
                                        )}

                                        {otpStep === 'reset' && (
                                            <form onSubmit={handleResetPassword} className="space-y-4">
                                                <div className="text-center mb-2">
                                                    <p className="text-white/60 text-xs">Set a new password for</p>
                                                    <p className="text-white text-sm font-semibold">{otpEmail}</p>
                                                </div>
                                                <div className="relative">
                                                    <input id="new-password-input" type={showNewPwd ? 'text' : 'password'} required placeholder="NEW PASSWORD"
                                                        className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1.5 pr-8 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                        value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} />
                                                    <button type="button" onClick={() => setShowNewPwd(p => !p)}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                                        <FontAwesomeIcon icon={showNewPwd ? faEyeSlash : faEye} className="text-xs" />
                                                    </button>
                                                </div>
                                                <p className="text-white/30 text-[10px]">Min 6 chars · 1 uppercase · 1 special character</p>
                                                <button id="reset-password-btn" type="submit" disabled={isSubmitting}
                                                    className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                    {isSubmitting ? (
                                                        <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Resetting...</span></>
                                                    ) : 'Reset Password'}
                                                </button>
                                            </form>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── TAB: Phone OTP (Firebase) ── */}
                                {activeTab === 'phone_otp' && (
                                    <motion.div key="potp"
                                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}>

                                        {forgotMode && (
                                            <div className="flex items-center justify-between mb-4 bg-purple-900/20 border border-purple-500/20 rounded-xl px-3 py-2">
                                                <span className="text-xs text-purple-300 font-semibold">🔑 Forgot Password Mode</span>
                                                <button id="cancel-phone-forgot-btn" type="button"
                                                    onClick={() => { setForgotMode(false); setPhoneStep('input'); setError(''); setSuccess(''); }}
                                                    className="text-[10px] text-white/40 hover:text-white/70 underline">Cancel</button>
                                            </div>
                                        )}

                                        {phoneStep === 'input' && (
                                            <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                                                <label className="block text-white/50 text-[10px] uppercase tracking-wider mb-1">
                                                    {forgotMode ? 'Enter registered phone number' : 'Your Phone Number'}
                                                </label>
                                                <div className="flex gap-3 items-end">
                                                    <select id="phone-country-select"
                                                        className="bg-transparent border-b border-white/20 text-white py-1.5 focus:border-purple-500 outline-none [&>option]:text-black w-28 text-sm cursor-pointer"
                                                        value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                                                        {countryOptions.map(o => (
                                                            <option key={o.code} value={o.code}>{o.country} ({o.code})</option>
                                                        ))}
                                                    </select>
                                                    <input id="phone-number-input" type="tel" required placeholder="98765 43210"
                                                        className="flex-1 bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                        value={phoneNumber} onChange={e => { setPhoneNumber(e.target.value); setError(''); }} />
                                                </div>
                                                <p className="text-white/30 text-[10px]">
                                                    A real SMS will be sent to your phone via Firebase
                                                </p>
                                                <button id="send-phone-otp-btn" type="submit" disabled={isSubmitting}
                                                    className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                    {isSubmitting ? (
                                                        <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Sending SMS...</span></>
                                                    ) : <><FontAwesomeIcon icon={faPhone} className="text-xs" /> {forgotMode ? 'Send Reset OTP' : 'Send SMS OTP'}</>}
                                                </button>
                                                {!forgotMode && (
                                                    <p className="text-center text-xs text-white/40 mt-2">
                                                        Forgot password?{' '}
                                                        <button type="button" onClick={() => { setForgotMode(true); setError(''); setSuccess(''); }}
                                                            className="text-purple-400 hover:text-purple-300 underline">Reset via Phone SMS</button>
                                                    </p>
                                                )}
                                            </form>
                                        )}

                                        {phoneStep === 'verify' && (
                                            <form onSubmit={handleVerifyPhoneOtp} className="space-y-2">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                                                        <FontAwesomeIcon icon={faPhone} className="text-green-400 text-lg" />
                                                    </div>
                                                    <p className="text-white/60 text-xs mb-1">SMS sent to</p>
                                                    <p className="text-white text-sm font-semibold">{countryCode} {phoneNumber}</p>
                                                </div>
                                                <OtpInput length={6} value={phoneOtpValue} onChange={v => { setPhoneOtpValue(v); setError(''); }} />
                                                <div className="flex items-center justify-between text-xs text-white/40 px-1">
                                                    <span>Expires in: <Countdown seconds={phoneTimer} onExpire={() => setError('OTP expired. Please resend.')} /></span>
                                                    <button id="resend-phone-otp-btn" type="button" disabled={isSubmitting}
                                                        onClick={handleSendPhoneOtp}
                                                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50">
                                                        <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" /> Resend
                                                    </button>
                                                </div>
                                                <button id="verify-phone-otp-btn" type="submit" disabled={isSubmitting || phoneOtpValue.length < 6}
                                                    className="w-full mt-2 bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                    {isSubmitting ? (
                                                        <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Verifying...</span></>
                                                    ) : <><FontAwesomeIcon icon={faShieldHalved} className="text-xs" /> Verify OTP</>}
                                                </button>
                                            </form>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Divider + Social */}
                            <div className="mt-5">
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-white/10" />
                                    <span className="flex-shrink-0 mx-4 text-white/30 text-xs">OR</span>
                                    <div className="flex-grow border-t border-white/10" />
                                </div>
                                <p className="text-white/40 text-xs text-center mb-3">Continue with social</p>
                                <div className="flex justify-center gap-5">
                                    <button id="google-login-btn" onClick={handleGoogleLogin} title="Google"
                                        className="w-9 h-9 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                        <FontAwesomeIcon icon={faGoogle} className="text-sm" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 text-center text-xs text-white/40">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-white font-bold hover:text-purple-300 transition-colors underline decoration-purple-400/50">
                                    Create Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            <DeactivatedAccountModal
                isOpen={deactivatedModalOpen}
                userIdentifier={deactivatedUserIdentifier}
                onClose={() => setDeactivatedModalOpen(false)}
                onReactivated={() => {
                    setDeactivatedModalOpen(false);
                    setSuccess('Account reactivated! Redirecting...');
                    setTimeout(() => { window.location.href = '/'; }, 1000);
                }}
            />
        </div>
    );
}
