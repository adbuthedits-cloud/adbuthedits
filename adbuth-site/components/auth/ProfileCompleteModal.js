import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser, faEnvelope, faPhone, faCheckCircle,
    faArrowRight, faSpinner, faExclamationTriangle,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

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
    const [firstName, setFirstName]   = useState('');
    const [lastName, setLastName]     = useState('');
    const [email, setEmail]           = useState(prefill.email || '');
    const [countryCode, setCountryCode] = useState(prefill.phone?.code || '+91');
    const [phoneNum, setPhoneNum]     = useState(prefill.phone?.number || '');
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [submitting, setSubmitting]  = useState(false);
    const [done, setDone]             = useState(false);

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
        if (!firstName.trim()) errors.firstName = 'First name is required.';
        if (!email.trim()) errors.email = 'Email is required.';
        if (!phoneNum.trim()) errors.phone = 'Phone number is required.';
        if (Object.keys(errors).length) { setFieldErrors(errors); return; }

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
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.7)' }}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 24 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 16 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                        className="relative w-full max-w-md"
                    >
                        {/* Glow border */}
                        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-purple-800 opacity-80 blur-[2px]" />

                        <div className="relative bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl">
                            {/* Top accent */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-800" />

                            {/* Close / Skip button */}
                            {onClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors duration-200 z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
                                    aria-label="Skip profile completion"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            )}

                            <div className="p-7">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <FontAwesomeIcon icon={faUser} className="text-purple-400 text-xl" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">Complete Your Profile</h2>
                                    <p className="text-white/50 text-xs leading-relaxed">
                                        Your name, email, and phone are required to place orders.
                                    </p>
                                </div>

                                {/* Success State */}
                                <AnimatePresence>
                                    {done && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-center py-6"
                                        >
                                            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-2xl" />
                                            </div>
                                            <p className="text-green-400 font-bold text-lg">Profile Complete!</p>
                                            <p className="text-white/50 text-xs mt-1">Welcome to Adbuth Edits 🎉</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!done && (
                                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-white/50 text-[10px] uppercase tracking-wider mb-1.5">
                                                    First Name <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    id="profile-first-name"
                                                    type="text"
                                                    value={firstName}
                                                    onChange={e => { setFirstName(e.target.value); setFieldErrors(p => ({ ...p, firstName: '' })); }}
                                                    placeholder="John"
                                                    className={`w-full bg-white/5 border ${fieldErrors.firstName ? 'border-red-500/50' : 'border-white/10'} text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white/8 transition-all`}
                                                />
                                                {fieldErrors.firstName && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.firstName}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Last Name</label>
                                                <input
                                                    id="profile-last-name"
                                                    type="text"
                                                    value={lastName}
                                                    onChange={e => setLastName(e.target.value)}
                                                    placeholder="Doe"
                                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:bg-white/8 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-white/50 text-[10px] uppercase tracking-wider mb-1.5">
                                                Email <span className="text-red-400">*</span>
                                                {emailLocked && <span className="ml-1 text-purple-400 text-[9px]">(auto-detected)</span>}
                                            </label>
                                            <div className="relative">
                                                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs" />
                                                <input
                                                    id="profile-email"
                                                    type="email"
                                                    value={email}
                                                    onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                                                    placeholder="your@email.com"
                                                    readOnly={emailLocked}
                                                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border transition-all focus:outline-none
                                                        ${emailLocked
                                                            ? 'bg-purple-900/20 border-purple-500/30 text-purple-200 cursor-default'
                                                            : `bg-white/5 border ${fieldErrors.email ? 'border-red-500/50' : 'border-white/10'} text-white focus:border-purple-500 focus:bg-white/8`
                                                        }`}
                                                />
                                            </div>
                                            {fieldErrors.email && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.email}</p>}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-white/50 text-[10px] uppercase tracking-wider mb-1.5">
                                                Phone <span className="text-red-400">*</span>
                                                {phoneLocked && <span className="ml-1 text-purple-400 text-[9px]">(auto-detected)</span>}
                                            </label>
                                            <div className={`flex gap-2 rounded-xl border overflow-hidden transition-all ${fieldErrors.phone ? 'border-red-500/50' : 'border-white/10'}`}>
                                                <select
                                                    id="profile-country-code"
                                                    value={countryCode}
                                                    onChange={e => setCountryCode(e.target.value)}
                                                    disabled={phoneLocked}
                                                    className={`bg-white/5 text-white text-sm py-2.5 pl-3 pr-1 focus:outline-none border-r border-white/10 min-w-[90px]
                                                        ${phoneLocked ? 'opacity-60 cursor-default bg-purple-900/20' : ''} [&>option]:text-black`}
                                                >
                                                    {countryOptions.map(o => (
                                                        <option key={o.code} value={o.code}>{o.code} {o.country}</option>
                                                    ))}
                                                </select>
                                                <div className="relative flex-1">
                                                    <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs" />
                                                    <input
                                                        id="profile-phone"
                                                        type="tel"
                                                        value={phoneNum}
                                                        onChange={e => { setPhoneNum(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); }}
                                                        placeholder="98765 43210"
                                                        readOnly={phoneLocked}
                                                        className={`w-full pl-9 pr-3 py-2.5 text-sm bg-transparent text-white focus:outline-none
                                                            ${phoneLocked ? 'text-purple-200 cursor-default' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                            {fieldErrors.phone && <p className="text-red-400 text-[10px] mt-1">{fieldErrors.phone}</p>}
                                        </div>

                                        {/* Submit */}
                                        <button
                                            id="complete-profile-submit"
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold py-3 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 text-sm"
                                        >
                                            {submitting ? (
                                                <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Saving...</>
                                            ) : (
                                                <>Complete Profile <FontAwesomeIcon icon={faArrowRight} className="text-xs" /></>
                                            )}
                                        </button>

                                        <p className="text-center text-white/25 text-[10px] mt-1">
                                            This information is required to place orders and receive updates.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
