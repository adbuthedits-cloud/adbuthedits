import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faRotateLeft, faEnvelope, faPhone, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function DeactivatedAccountModal({ isOpen, userIdentifier, onReactivated, onClose }) {
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('info'); // 'info' | 'verify'
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleSendOtp = async () => {
        setError(''); setSuccess(''); setSubmitting(true);
        try {
            const isEmail = userIdentifier?.includes('@');
            const res = await fetch(`${API_URL}/api/otp/send-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: isEmail ? userIdentifier : undefined,
                    purpose: 'reactivate_account'
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Failed to send OTP');
            setStep('verify');
            setSuccess(`Activation OTP sent to ${userIdentifier}`);
        } catch (err) {
            setError(err.message);
        }
        setSubmitting(false);
    };

    const handleReactivate = async (e) => {
        e?.preventDefault();
        if (!otp || otp.length < 6) return setError('Please enter the 6-digit OTP code.');
        setError(''); setSuccess(''); setSubmitting(true);
        try {
            const isEmail = userIdentifier?.includes('@');
            const res = await fetch(`${API_URL}/api/auth/reactivate-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: isEmail ? userIdentifier : undefined,
                    phone: !isEmail ? userIdentifier : undefined,
                    otp
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Reactivation failed');

            setSuccess('Account reactivated! Logging you in...');
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            setTimeout(() => {
                onReactivated?.(data.user);
            }, 1200);
        } catch (err) {
            setError(err.message);
        }
        setSubmitting(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md bg-gray-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl overflow-hidden"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-lg" />
                    </button>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-400 text-2xl">
                            <FontAwesomeIcon icon={faShieldHalved} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Account Deactivated</h3>
                        <p className="text-xs text-white/60 mt-1">
                            Your account is currently deactivated. Kindly verify OTP to reactivate your account and restore access.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold text-center">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-semibold text-center">
                            {success}
                        </div>
                    )}

                    {step === 'info' ? (
                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/70">
                                <span className="font-semibold text-white">Account Identifier:</span> {userIdentifier}
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={submitting}
                                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-all active:scale-95 text-sm disabled:opacity-50"
                            >
                                {submitting ? 'Sending OTP...' : 'Send Activation OTP'}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleReactivate} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-white/50 mb-2">Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    className="w-full bg-transparent border-b border-purple-500/50 text-center text-2xl tracking-widest text-white py-2 focus:outline-none focus:border-purple-400"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting || otp.length < 6}
                                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-500 transition-all active:scale-95 text-sm disabled:opacity-50"
                            >
                                {submitting ? 'Reactivating...' : 'Reactivate Account & Log In'}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
