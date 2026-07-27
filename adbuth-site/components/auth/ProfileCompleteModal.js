import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faEnvelope, faPhone, faCheckCircle,
    faArrowRight, faSpinner, faExclamationTriangle,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

import { isDisposableEmail } from '../../utils/disposableEmails';

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

/**
 * ProfileCompleteModal
 *
 * Props:
 *   isOpen       {boolean}  — Whether the modal is shown
 *   prefill      {object}   — { email?, phone?: { code, number } }  pre-filled locked fields
 *   onComplete   {fn}       — Called with updated user object on success
 */
export default function ProfileCompleteModal({ isOpen, prefill = {}, onComplete, onClose }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState(prefill.email || '');
    const [countryCode, setCountryCode] = useState(prefill.phone?.code || '+91');
    const [phoneNum, setPhoneNum] = useState(prefill.phone?.number || '');
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Sync prefill when it changes (e.g., modal opened with new context)
    useEffect(() => {
        if (isOpen) {
            setEmail(prefill.email || '');
            setCountryCode(prefill.phone?.code || '+91');
            setPhoneNum(prefill.phone?.number || '');
            setFirstName('');
            setLastName('');
            setFieldErrors({});
            setGlobalError('');
            setDone(false);
        }
    }, [isOpen, prefill?.email, prefill?.phone?.number]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        setGlobalError('');

        const errors = {};
        if (!firstName.trim()) {
            errors.firstName = 'First name is required.';
        } else if (firstName.length > 20) {
            errors.firstName = 'First name cannot exceed 20 characters.';
        }

        if (lastName && lastName.length > 20) {
            errors.lastName = 'Last name cannot exceed 20 characters.';
        }

        const emailTrimmed = email.trim();
        if (!emailTrimmed) {
            errors.email = 'Email is required.';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailTrimmed)) {
                errors.email = 'Please enter a valid email address.';
            } else if (isDisposableEmail(emailTrimmed)) {
                errors.email = 'Disposable email addresses are not allowed.';
            }
        }

        const phoneCleaned = phoneNum.replace(/[\s\-()]/g, '');
        if (!phoneCleaned) {
            errors.phone = 'Phone number is required.';
        } else {
            const phoneRegex = /^\d{7,15}$/;
            if (!phoneRegex.test(phoneCleaned)) {
                errors.phone = 'Please enter a valid phone number (7 to 15 digits).';
            }
        }

        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/auth/complete-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    email: email.trim(),
                    phone_number: { code: countryCode, number: phoneNum.replace(/[\s\-()]/g, '') },
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.field) {
                    setFieldErrors({ [data.field]: data.msg });
                } else {
                    setGlobalError(data.msg || 'Failed to save profile.');
                }
                return;
            }

            setDone(true);
            // Update localStorage user
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updated = { ...storedUser, ...data.user };
            localStorage.setItem('user', JSON.stringify(updated));

            setTimeout(() => {
                onComplete?.(data.user);
            }, 1200);

        } catch (err) {
            setGlobalError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const emailLocked = !!prefill.email;
    const phoneLocked = !!prefill.phone?.number;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-sans fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(5,0,15,0.75)' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-sm sm:max-w-md relative z-20"
                    >
                        <div className="relative group">
                            {/* Noise overlay */}
                            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none rounded-3xl" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                            }} />

                            <div className="relative bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden w-full flex flex-col">

                                {/* Close / Skip button */}
                                {onClose && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors duration-200 z-20 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
                                        aria-label="Skip profile completion"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                    </button>
                                )}

                                {/* Header */}
                                <div className="text-center mb-6 relative z-10">
                                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">Complete Your Profile</h2>
                                    <p className="text-white/50 text-xs">Your name, email, and phone are required to place orders</p>
                                </div>

                                {/* Success State */}
                                <AnimatePresence>
                                    {done && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-center py-6 relative z-10"
                                        >
                                            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl" />
                                            </div>
                                            <p className="text-green-400 font-bold text-lg">Profile Complete!</p>
                                            <p className="text-white/50 text-xs mt-1">Welcome to Adbuth Verse 🎉</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!done && (
                                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                        {/* Global error */}
                                        <AnimatePresence>
                                            {globalError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
                                                >
                                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                                    {globalError}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Name row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-white/55 text-[10px] uppercase tracking-wider mb-1">
                                                    First Name <span className="text-purple-400">*</span>
                                                </label>
                                                <input
                                                    id="profile-first-name"
                                                    type="text"
                                                    value={firstName}
                                                    onChange={e => { setFirstName(e.target.value); setFieldErrors(p => ({ ...p, firstName: '' })); }}
                                                    placeholder="First Name"
                                                    className={`w-full bg-transparent border-b text-white placeholder-white/20 px-0 py-1.5 focus:outline-none transition-colors text-sm
                                                        ${fieldErrors.firstName ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-purple-500'}`}
                                                />
                                                {fieldErrors.firstName && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.firstName}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-white/55 text-[10px] uppercase tracking-wider mb-1">Last Name</label>
                                                <input
                                                    id="profile-last-name"
                                                    type="text"
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    placeholder="Last Name"
                                                    className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-white/55 text-[10px] uppercase tracking-wider mb-1">
                                                Email <span className="text-purple-400">*</span>
                                                {emailLocked && <span className="ml-1 text-purple-400 text-[9px] lowercase">(auto-detected)</span>}
                                            </label>
                                            <input
                                                id="profile-email"
                                                type="email"
                                                value={email}
                                                onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                                                placeholder="your@email.com"
                                                readOnly={emailLocked}
                                                className={`w-full bg-transparent border-b text-white placeholder-white/20 px-0 py-1.5 focus:outline-none transition-colors text-sm
                                                    ${emailLocked
                                                        ? 'text-purple-300/50 border-white/10 cursor-not-allowed'
                                                        : fieldErrors.email
                                                            ? 'border-red-400 focus:border-red-400'
                                                            : 'border-white/20 focus:border-purple-500'}`}
                                            />
                                            {fieldErrors.email && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.email}</p>}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-white/55 text-[10px] uppercase tracking-wider mb-1">
                                                Phone <span className="text-purple-400">*</span>
                                                {phoneLocked && <span className="ml-1 text-purple-400 text-[9px] lowercase">(auto-detected)</span>}
                                            </label>
                                            <div className="flex gap-4 items-end">
                                                <select
                                                    id="profile-country-code"
                                                    value={countryCode}
                                                    onChange={e => setCountryCode(e.target.value)}
                                                    disabled={phoneLocked}
                                                    className={`bg-transparent border-b border-white/20 text-white py-1 focus:border-purple-500 outline-none w-24 text-sm cursor-pointer [&>option]:text-black
                                                        ${phoneLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {countryOptions.map(o => (
                                                        <option key={o.code} value={o.code}>{o.code} {o.country}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    id="profile-phone"
                                                    type="tel"
                                                    value={phoneNum}
                                                    onChange={e => { setPhoneNum(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); }}
                                                    placeholder="Phone Number"
                                                    readOnly={phoneLocked}
                                                    className={`flex-1 bg-transparent border-b text-white placeholder-white/20 px-0 py-1 focus:outline-none transition-colors text-sm
                                                        ${phoneLocked
                                                            ? 'text-purple-300/50 border-white/10 cursor-not-allowed'
                                                            : fieldErrors.phone
                                                                ? 'border-red-400 focus:border-red-400'
                                                                : 'border-white/20 focus:border-purple-500'}`}
                                                />
                                            </div>
                                            {fieldErrors.phone && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.phone}</p>}
                                        </div>

                                        {/* Submit */}
                                        <button
                                            id="complete-profile-submit"
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full mt-6 bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 text-sm"
                                        >
                                            {submitting ? (
                                                <><FontAwesomeIcon icon={faSpinner} className="animate-spin w-4 h-4" /> Saving...</>
                                            ) : (
                                                <>Complete Profile <FontAwesomeIcon icon={faArrowRight} className="text-xs" /></>
                                            )}
                                        </button>

                                        <p className="text-center text-white/25 text-[10px] mt-2">
                                            This information is required to place orders and receive updates.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
}
