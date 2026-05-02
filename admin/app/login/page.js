"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faArrowRight, faEye, faEyeSlash, faIdBadge } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.msg || data.error || 'Login failed');

            // All authenticated admin staff are allowed — roles are dynamic via Role Management

            // Secure Storage Logic
            // Always use LocalStorage for simplicity
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));

            // Set as Cookie for Middleware to catch
            const expiryDays = rememberMe ? 7 : 1;
            const maxAge = expiryDays * 24 * 60 * 60;
            document.cookie = `admin_token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
            document.cookie = `admin_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${maxAge}; SameSite=Lax`;

            // Set Expiry if Persistent (7 Days)
            if (rememberMe) {
                const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 Days
                localStorage.setItem('admin_token_expiry', expiryTime.toString());
            }

            router.push('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfcfb] to-[#e2d1c3]">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row m-4">

                {/* Left Side - Visual */}
                <div className="md:w-1/2 bg-[#040B38] relative p-10 flex flex-col justify-between overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-36 flex items-center justify-center text-white font-bold text-xl mb-6">
                            <Image src="/images/logo.png" alt="logo" width={144} height={40} className="w-full h-auto object-contain" style={{ height: 'auto' }} priority />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">Welcome Back!</h1>
                        <p className="text-blue-100">Manage your store efficiently with Adbuth Admin Panel.</p>
                    </div>

                    <div className="relative z-10 text-xs text-blue-200 mt-10">
                        &copy; 2025 Adbuth Inc.
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0E2357] rounded-full  filter blur-3xl opacity-100 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0E2357] rounded-full  filter blur-3xl opacity-100 translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-1/2 p-10 md:p-14">
                    <div className="text-center md:text-left mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
                        <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the dashboard.</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Username / Email / ID</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faIdBadge} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-200 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Username or Staff ID"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-200 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none">
                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">Remember me</span>
                            </label>
                            <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#7D287E] text-white py-3.5 rounded-xl font-bold  transition-all shadow-lg shadow-black-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Authenticating...' : 'Access Dashboard'}
                            {!loading && <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
