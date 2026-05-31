import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye, faEyeSlash, faEnvelope, faShieldHalved,
    faRotateLeft, faCheckCircle, faUser, faPhone
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faGoogle, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const Beams = dynamic(() => import('../components/ui/Beams'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const countryOptions = [
    { code: '+91', country: 'India', placeholder: '98765 43210' },
    { code: '+1', country: 'USA/Canada', placeholder: '123 456 7890' },
    { code: '+44', country: 'UK', placeholder: '7700 900077' },
    { code: '+61', country: 'Australia', placeholder: '412 345 678' },
    { code: '+971', country: 'UAE', placeholder: '50 123 4567' },
    { code: '+65', country: 'Singapore', placeholder: '8123 4567' },
    { code: '+49', country: 'Germany', placeholder: '151 23456789' },
    { code: '+33', country: 'France', placeholder: '6 12 34 56 78' },
    { code: '+81', country: 'Japan', placeholder: '90 1234 5678' },
    { code: '+86', country: 'China', placeholder: '138 1234 5678' },
    { code: '+7', country: 'Russia', placeholder: '912 345 67 89' },
    { code: '+55', country: 'Brazil', placeholder: '11 91234 5678' },
    { code: '+27', country: 'South Africa', placeholder: '82 123 4567' },
    { code: '+92', country: 'Pakistan', placeholder: '300 1234567' },
    { code: '+880', country: 'Bangladesh', placeholder: '1712 345678' },
    { code: '+60', country: 'Malaysia', placeholder: '12 345 6789' },
    { code: '+62', country: 'Indonesia', placeholder: '812 3456 789' },
    { code: '+63', country: 'Philippines', placeholder: '912 345 6789' },
    { code: '+66', country: 'Thailand', placeholder: '81 234 5678' },
    { code: '+84', country: 'Vietnam', placeholder: '91 234 5678' },
    { code: '+90', country: 'Turkey', placeholder: '532 123 45 67' },
    { code: '+966', country: 'Saudi Arabia', placeholder: '50 123 4567' },
    { code: '+52', country: 'Mexico', placeholder: '55 1234 5678' },
    { code: '+94', country: 'Sri Lanka', placeholder: '71 234 5678' },
    { code: '+977', country: 'Nepal', placeholder: '984 1234567' },
];

// ─── OTP Input Component ───────────────────────────────────────────────────────
function OtpInput({ length = 6, value, onChange }) {
    const inputs = useRef([]);

    const handleKey = (e, idx) => {
        if (e.key === 'Backspace' && !value[idx] && idx > 0) inputs.current[idx - 1]?.focus();
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
                    id={`signup-otp-digit-${idx}`}
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

// ─── Main Signup Page ──────────────────────────────────────────────────────────
export default function Signup() {
    const { seoData } = useSeo('signup');
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Step: 'register' | 'verify_email'
    const [step, setStep] = useState('register');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [authToken, setAuthToken] = useState('');

    // ── Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');

    // ── OTP state
    const [otpValue, setOtpValue] = useState('');
    const [otpTimer, setOtpTimer] = useState(0);

    // ── Firebase Phone OTP state (for signup Step 3)
    const [phoneOtpValue, setPhoneOtpValue] = useState('');
    const [phoneTimer, setPhoneTimer] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const recaptchaContainerRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);

    // ── UI state
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation
    const [isEmailValid, setIsEmailValid] = useState(true);
    const [isPhoneValid, setIsPhoneValid] = useState(true);
    const [touched, setTouched] = useState({ email: false, phone: false });

    // Beams config
    const [beamConfig, setBeamConfig] = useState({ beamWidth: 3, beamHeight: 30, beamNumber: 20, scale: 0.2 });

    useEffect(() => {
        if (!authLoading && user) router.replace('/');
    }, [user, authLoading]);

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

    // Cleanup reCAPTCHA verifier
    const cleanupRecaptcha = () => {
        try {
            if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
                recaptchaVerifierRef.current = null;
            }
        } catch (e) { /* ignore */ }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupRecaptcha();
        };
    }, []);

    // Setup invisible reCAPTCHA
    const setupRecaptcha = async () => {
        try {
            if (recaptchaVerifierRef.current) return recaptchaVerifierRef.current;

            const { RecaptchaVerifier } = await import('firebase/auth');
            const { auth } = await import('../lib/firebase');

            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => { /* reCAPTCHA solved */ },
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
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

    const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).toLowerCase());
    const validatePhone = (v) => /^\d{7,15}$/.test(String(v).replace(/[\s\-()]/g, ''));

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        if (field === 'email') setIsEmailValid(validateEmail(email));
        if (field === 'phone') setIsPhoneValid(validatePhone(phone));
    };

    const handleChange = (field, value) => {
        if (field === 'email') { setEmail(value); if (touched.email) setIsEmailValid(validateEmail(value)); }
        if (field === 'phone') { setPhone(value); if (touched.phone) setIsPhoneValid(validatePhone(value)); }
        if (field === 'firstName') setFirstName(value);
        if (field === 'lastName') setLastName(value);
        if (field === 'password') setPassword(value);
    };

    const handleGoogleSignup = () => { window.location.href = `${API_URL}/api/auth/google`; };
    const handleFacebookSignup = () => { window.location.href = `${API_URL}/api/auth/facebook`; };
    const handleTwitterSignup = () => { window.location.href = `${API_URL}/api/auth/twitter`; };

    // ── Step 1: Register
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your first and last name.');
            return;
        }

        const vEmail = validateEmail(email);
        const vPhone = validatePhone(phone);
        setIsEmailValid(vEmail);
        setIsPhoneValid(vPhone);
        setTouched({ email: true, phone: true });
        
        if (!vEmail) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!vPhone) {
            setError('Please enter a valid phone number.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password,
                    phone_number: { code: countryCode, number: phone }
                })
                        });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid registration response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Registration failed');

            // Store token temporarily (user is NOT logged in until email is verified)
            setAuthToken(data.token);
            setRegisteredEmail(email);

            // Send email verification OTP
            const otpRes = await fetch(`${API_URL}/api/otp/send-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'email_verify' })
            });
            const otpText = await otpRes.text();
            let otpData;
            try {
                otpData = JSON.parse(otpText);
            } catch (err) {
                throw new Error(`Server returned invalid verification response (Status ${otpRes.status}).`);
            }
            if (!otpRes.ok) throw new Error(otpData.msg || 'Failed to send verification OTP');

            setStep('verify_email');
            setOtpTimer(600);
            setSuccess('Account created! Please verify your email to continue.');
        } catch (err) {
            setError(err.message);
        }
        setIsSubmitting(false);
    };

    // ── Resend OTP
    const handleResendOtp = async () => {
        setError(''); setSuccess(''); setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/otp/send-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registeredEmail, purpose: 'email_verify' })
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Failed to resend OTP');
            setOtpTimer(600);
            setOtpValue('');
            setSuccess('New OTP sent to your email!');
        } catch (err) { setError(err.message); }
        setIsSubmitting(false);
    };

    // ── Step 2: Verify Email OTP
    const handleVerifyOtp = async (e) => {
        e?.preventDefault();
        if (otpValue.length < 6) return setError('Please enter the complete 6-digit OTP.');
        setError(''); setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/otp/verify-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registeredEmail, otp: otpValue, purpose: 'email_verify' })
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Verification failed');

            // Move to Step 3: Phone Verification
            setAuthToken(data.token);
            setSuccess('Email verified successfully! Now let\'s verify your phone number.');
            setStep('verify_phone');
        } catch (err) { setError(err.message); }
        setIsSubmitting(false);
    };

    // ── Firebase Phone OTP: Send SMS
    const handleSendPhoneOtp = async (e) => {
        e?.preventDefault();
        setError(''); setSuccess(''); setIsSubmitting(true);

        try {
            const { signInWithPhoneNumber } = await import('firebase/auth');
            const { auth } = await import('../lib/firebase');

            const appVerifier = await setupRecaptcha();
            const fullPhone = `${countryCode}${phone.replace(/[\s\-()]/g, '')}`;

            const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
            setConfirmationResult(result);
            setPhoneOtpValue('');
            setPhoneTimer(120); // 2 minutes
            setSuccess(`SMS verification code sent to ${fullPhone}`);
        } catch (err) {
            console.error('[Firebase Phone Signup] Send error:', err);
            cleanupRecaptcha();
            const fbErrors = {
                'auth/invalid-phone-number': 'Invalid phone number format.',
                'auth/too-many-requests': 'Too many attempts. Please wait.',
                'auth/quota-exceeded': 'SMS quota exceeded.',
                'auth/network-request-failed': 'Network error.',
                'auth/internal-error': 'Phone authentication is not configured yet.',
            };
            setError(fbErrors[err.code] || err.message || 'Failed to send SMS. Try again.');
        }
        setIsSubmitting(false);
    };

    // ── Firebase Phone OTP: Verify SMS
    const handleVerifyPhoneOtp = async (e) => {
        e?.preventDefault();
        if (phoneOtpValue.length < 6) return setError('Please enter the complete 6-digit OTP.');
        if (!confirmationResult) return setError('Session expired. Please resend the OTP.');
        setError(''); setIsSubmitting(true);

        try {
            const firebaseResult = await confirmationResult.confirm(phoneOtpValue);
            const idToken = await firebaseResult.user.getIdToken();

            const res = await fetch(`${API_URL}/api/otp/firebase-phone-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Server returned invalid response (Status ${res.status}).`);
            }
            if (!res.ok) throw new Error(data.msg || 'Phone verification failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setSuccess('Phone verified! Welcome to Adbuth Edits 🎉');
            setTimeout(() => { window.location.href = '/'; }, 1200);
        } catch (err) {
            console.error('[Firebase Phone Signup] Verify error:', err);
            const fbErrors = {
                'auth/invalid-verification-code': 'Incorrect OTP. Please try again.',
                'auth/code-expired': 'OTP has expired. Please resend.',
                'auth/session-expired': 'Session expired. Please resend.',
            };
            setError(fbErrors[err.code] || err.message || 'Verification failed.');
        }
        setIsSubmitting(false);
    };

    // ── Skip verification (use current authToken)
    const handleSkipVerification = () => {
        localStorage.setItem('token', authToken);
        window.location.href = '/';
    };

    const currentCountry = countryOptions.find(c => c.code === countryCode) || countryOptions[0];

    return (
        <div className="relative min-h-screen w-full bg-neutral-950 flex flex-col overflow-y-auto overflow-x-hidden">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Sign Up | Adbuth Edits"}
                description={seoData?.meta_description || seoData?.description || "Create your Adbuth Edits account."}
                data={seoData}
            />

            {/* Beams Background */}
            <div className="absolute inset-0 w-full h-full">
                <Beams beamWidth={beamConfig.beamWidth} beamHeight={beamConfig.beamHeight}
                    beamNumber={beamConfig.beamNumber} lightColor="#f53ff8"
                    speed={2} noiseIntensity={1.75} scale={beamConfig.scale} rotation={30}
                    className="w-full h-full" />
            </div>

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

                            {/* Alert Messages */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div key="err"
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-xl text-xs text-center mb-4">
                                        {error}
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div key="ok"
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="bg-green-900/30 border border-green-500/30 text-green-300 px-4 py-2.5 rounded-xl text-xs text-center mb-4 flex items-center justify-center gap-2">
                                        <FontAwesomeIcon icon={faCheckCircle} /> {success}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence mode="wait">

                                {/* ── STEP 1: Register Form ── */}
                                {step === 'register' && (
                                    <motion.div key="register"
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.3 }}>

                                        <div className="text-center mb-5">
                                            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">Create Account</h1>
                                            <p className="text-white/50 text-xs">Join Adbuth Edits today</p>
                                        </div>

                                        <form onSubmit={handleRegister} className="space-y-4">
                                            {/* Name Row */}
                                            <div className="flex gap-4">
                                                <div className="w-1/2">
                                                    <input id="signup-firstname" type="text" required placeholder="FIRST NAME"
                                                        className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                        value={firstName} onChange={e => handleChange('firstName', e.target.value)} />
                                                </div>
                                                <div className="w-1/2">
                                                    <input id="signup-lastname" type="text" required placeholder="LAST NAME"
                                                        className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                        value={lastName} onChange={e => handleChange('lastName', e.target.value)} />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <input id="signup-email" type="email" required placeholder="EMAIL"
                                                    className={`w-full bg-transparent border-b text-white placeholder-white/20 px-0 py-1 focus:outline-none transition-colors text-sm ${!isEmailValid && touched.email ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-purple-500'}`}
                                                    value={email} onChange={e => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} />
                                                {!isEmailValid && touched.email && (
                                                    <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold mt-1 text-right">Invalid email</p>
                                                )}
                                            </div>

                                            {/* Phone */}
                                            <div>
                                                <div className="flex gap-4 items-end">
                                                    <select id="signup-country" className="bg-transparent border-b border-white/20 text-white py-1 focus:border-purple-500 outline-none [&>option]:text-black w-24 text-sm cursor-pointer"
                                                        value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                                                        {countryOptions.map(opt => (
                                                            <option key={opt.code} value={opt.code}>{opt.country} ({opt.code})</option>
                                                        ))}
                                                    </select>
                                                    <input id="signup-phone" type="tel"
                                                        className={`flex-1 bg-transparent border-b text-white placeholder-white/20 px-0 py-1 focus:outline-none transition-colors text-sm ${!isPhoneValid && touched.phone ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-purple-500'}`}
                                                        placeholder={currentCountry.placeholder}
                                                        value={phone} onChange={e => handleChange('phone', e.target.value)} onBlur={() => handleBlur('phone')} />
                                                </div>
                                                {!isPhoneValid && touched.phone && (
                                                    <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold mt-1 text-right">Invalid phone</p>
                                                )}
                                            </div>

                                            {/* Password */}
                                            <div className="relative">
                                                <input id="signup-password" type={showPassword ? 'text' : 'password'} required placeholder="PASSWORD"
                                                    className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1 pr-8 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                    value={password} onChange={e => handleChange('password', e.target.value)} />
                                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
                                                </button>
                                            </div>

                                            <button id="signup-submit-btn" type="submit" disabled={isSubmitting}
                                                className="w-full mt-4 bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                {isSubmitting ? (
                                                    <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Creating Account...</span></>
                                                ) : <><FontAwesomeIcon icon={faUser} className="text-xs" /> Create Account</>}
                                            </button>
                                        </form>

                                        {/* Social */}
                                        <div className="mt-5">
                                            <div className="relative flex py-2 items-center">
                                                <div className="flex-grow border-t border-white/10" />
                                                <span className="flex-shrink-0 mx-4 text-white/30 text-xs">OR</span>
                                                <div className="flex-grow border-t border-white/10" />
                                            </div>
                                            <p className="text-white/40 text-xs text-center mb-3">Continue with social</p>
                                            <div className="flex justify-center gap-5">
                                                <button id="signup-facebook-btn" onClick={handleFacebookSignup} title="Facebook"
                                                    className="w-9 h-9 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                                    <FontAwesomeIcon icon={faFacebookF} className="text-sm" />
                                                </button>
                                                <button id="signup-google-btn" onClick={handleGoogleSignup} title="Google"
                                                    className="w-9 h-9 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                                    <FontAwesomeIcon icon={faGoogle} className="text-sm" />
                                                </button>
                                                <button id="signup-twitter-btn" onClick={handleTwitterSignup} title="Twitter/X"
                                                    className="w-9 h-9 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                                    <FontAwesomeIcon icon={faXTwitter} className="text-sm" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 text-center text-xs text-white/40">
                                            Already have an account?{' '}
                                            <Link href="/login" className="text-white font-bold hover:text-purple-300 transition-colors underline decoration-purple-400/50">
                                                Sign In
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── STEP 2: Verify Email OTP ── */}
                                {step === 'verify_email' && (
                                    <motion.div key="verify"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}>

                                        {/* Progress indicator */}
                                        <div className="flex items-center justify-center gap-2 mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-[10px]" />
                                                </div>
                                                <span className="text-green-400 text-xs font-semibold">Account Created</span>
                                            </div>
                                            <div className="w-8 h-px bg-white/20" />
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center animate-pulse">
                                                    <span className="text-purple-400 text-[10px] font-bold">2</span>
                                                </div>
                                                <span className="text-white text-xs font-semibold">Verify Email</span>
                                            </div>
                                        </div>

                                        <div className="text-center mb-2">
                                            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                                <FontAwesomeIcon icon={faEnvelope} className="text-purple-400 text-2xl" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white mb-1">Check Your Email</h2>
                                            <p className="text-white/50 text-xs mb-1">We sent a 6-digit code to</p>
                                            <p className="text-purple-300 text-sm font-semibold">{registeredEmail}</p>
                                        </div>

                                        <form onSubmit={handleVerifyOtp}>
                                            <OtpInput length={6} value={otpValue} onChange={v => { setOtpValue(v); setError(''); }} />

                                            <div className="flex items-center justify-between text-xs text-white/40 px-1 mb-4">
                                                <span>Expires in: <Countdown seconds={otpTimer} onExpire={() => setError('OTP expired. Please resend.')} /></span>
                                                <button id="resend-signup-otp-btn" type="button" disabled={isSubmitting}
                                                    onClick={handleResendOtp}
                                                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50">
                                                    <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" /> Resend OTP
                                                </button>
                                            </div>

                                            <button id="verify-signup-otp-btn" type="submit" disabled={isSubmitting || otpValue.length < 6}
                                                className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                {isSubmitting ? (
                                                    <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Verifying...</span></>
                                                ) : <><FontAwesomeIcon icon={faShieldHalved} className="text-xs" /> Verify & Enter</>}
                                            </button>
                                        </form>

                                        <p className="text-center text-xs text-white/30 mt-4">
                                            Didn't get it?{' '}
                                            <button id="skip-verification-btn" type="button" onClick={handleSkipVerification}
                                                className="text-white/50 hover:text-white/80 underline transition-colors">
                                                Skip for now
                                            </button>
                                        </p>
                                    </motion.div>
                                )}

                                {/* ── STEP 3: Verify Phone OTP ── */}
                                {step === 'verify_phone' && (
                                    <motion.div key="verify_phone"
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}>

                                        {/* Progress indicator */}
                                        <div className="flex items-center justify-center gap-2 mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-[10px]" />
                                                </div>
                                                <span className="text-green-400 text-xs font-semibold">Email Verified</span>
                                            </div>
                                            <div className="w-8 h-px bg-white/20" />
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center animate-pulse">
                                                    <span className="text-purple-400 text-[10px] font-bold">3</span>
                                                </div>
                                                <span className="text-white text-xs font-semibold">Verify Phone</span>
                                            </div>
                                        </div>

                                        <div className="text-center mb-2">
                                            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                                <FontAwesomeIcon icon={faPhone} className="text-purple-400 text-2xl" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white mb-1">Phone Verification</h2>
                                            <p className="text-white/50 text-xs mb-1">Verify your phone number to secure your account</p>
                                            <p className="text-purple-300 text-sm font-semibold">{countryCode} {phone}</p>
                                        </div>

                                        {!confirmationResult ? (
                                            <button id="send-signup-sms-btn" onClick={handleSendPhoneOtp} disabled={isSubmitting}
                                                className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-sm mt-4">
                                                {isSubmitting ? (
                                                    <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Sending SMS...</span></>
                                                ) : <span>Send SMS Code</span>}
                                            </button>
                                        ) : (
                                            <form onSubmit={handleVerifyPhoneOtp}>
                                                <OtpInput length={6} value={phoneOtpValue} onChange={v => { setPhoneOtpValue(v); setError(''); }} />

                                                <div className="flex items-center justify-between text-xs text-white/40 px-1 mb-4">
                                                    <span>Expires in: <Countdown seconds={phoneTimer} onExpire={() => setError('Code expired. Please resend.')} /></span>
                                                    <button id="resend-signup-phone-otp-btn" type="button" disabled={isSubmitting}
                                                        onClick={handleSendPhoneOtp}
                                                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50">
                                                        <FontAwesomeIcon icon={faRotateLeft} className="text-[10px]" /> Resend SMS
                                                    </button>
                                                </div>

                                                <button id="verify-signup-phone-otp-btn" type="submit" disabled={isSubmitting || phoneOtpValue.length < 6}
                                                    className="w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-sm">
                                                    {isSubmitting ? (
                                                        <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /><span>Verifying...</span></>
                                                    ) : <><FontAwesomeIcon icon={faShieldHalved} className="text-xs" /> Verify & Complete</>}
                                                </button>
                                            </form>
                                        )}

                                        <p className="text-center text-xs text-white/30 mt-4">
                                            Want to skip phone verification?{' '}
                                            <button id="skip-phone-verification-btn" type="button" onClick={handleSkipVerification}
                                                className="text-white/50 hover:text-white/80 underline transition-colors">
                                                Skip for now
                                            </button>
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
            {/* Firebase Recaptcha Container */}
            <div id="recaptcha-container"></div>
        </div>
    );
}
