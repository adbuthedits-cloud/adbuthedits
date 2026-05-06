import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faGoogle, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Beams from '../components/ui/Beams';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Login() {
    const { seoData } = useSeo('login');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Responsive Beams Config
    const [beamConfig, setBeamConfig] = useState({
        beamWidth: 3,
        beamHeight: 30,
        beamNumber: 20,
        scale: 0.2
    });

    const [isEmailValid, setIsEmailValid] = useState(true);
    const [touched, setTouched] = useState(false);
    const isLoginAction = useRef(false);

    const { login, user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user && !isLoginAction.current) {
            router.replace('/');
        }
    }, [user, authLoading]);

    useEffect(() => {
        const { token, error } = router.query;
        if (token) {
            localStorage.setItem('token', token);
            window.location.href = '/'; // Full reload to refresh auth state
        }
        if (error) {
            setError(error === 'google_failed' ? 'Google authentication failed' : 'Social login error');
        }
    }, [router.query]);

    const handleGoogleLogin = () => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        window.location.href = `${backendUrl}/api/auth/google`;
    };

    const handleFacebookLogin = () => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        window.location.href = `${backendUrl}/api/auth/facebook`;
    };

    const handleTwitterLogin = () => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        window.location.href = `${backendUrl}/api/auth/twitter`;
    };

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) { // Mobile
                setBeamConfig({
                    beamWidth: 2,
                    beamHeight: 20, // Smaller height for mobile
                    beamNumber: 15, // Fewer beams
                    scale: 0.15 // Smaller scale
                });
            } else if (width < 1024) { // Tablet
                setBeamConfig({
                    beamWidth: 2.5,
                    beamHeight: 25,
                    beamNumber: 18,
                    scale: 0.18
                });
            } else { // Desktop
                setBeamConfig({
                    beamWidth: 3,
                    beamHeight: 30,
                    beamNumber: 20,
                    scale: 0.2
                });
            }
        };

        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const handleBlur = () => {
        setTouched(true);
        setIsEmailValid(!!validateEmail(email));
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        if (touched) {
            setIsEmailValid(!!validateEmail(val));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const isValid = !!validateEmail(email);
        setIsEmailValid(isValid);
        setTouched(true);

        if (!isValid) {
            setIsSubmitting(false);
            return;
        }

        isLoginAction.current = true;
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error);
            isLoginAction.current = false;
        }
        setIsSubmitting(false);
    };

    return (
        <div className="relative min-h-screen w-full bg-neutral-950 flex flex-col overflow-y-auto overflow-x-hidden">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Login | Adbuth Edits"}
                description={seoData?.meta_description || seoData?.description || "Login to your Adbuth Edits account."}
                data={seoData}
            />

            {/* Beams Background */}
            <div className="absolute inset-0 w-full h-full">
                <Beams
                    beamWidth={beamConfig.beamWidth}
                    beamHeight={beamConfig.beamHeight}
                    beamNumber={beamConfig.beamNumber}
                    lightColor="#f53ff8"
                    speed={2}
                    noiseIntensity={1.75}
                    scale={beamConfig.scale}
                    rotation={30}
                    className="w-full h-full"
                />
            </div>

            <header className="w-full top-0 left-0 z-50 transition-all duration-300 ">
                <div className="max-w-7xl md:mx-12 lg:mx-auto mx-auto flex items-center justify-between p-6 relative z-50">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="relative lg:w-36 md:w-28 sm:w-24 w-28 h-auto aspect-[3/1]">
                                <Image
                                    src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/brand/logo.png"
                                    alt="logo"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className="drop-shadow-md"
                                    priority
                                />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex my-auto w-full flex items-center justify-center p-4 my-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm sm:max-w-md relative z-20"
                >
                    {/* Glassmorphism Card with Noise */}
                    <div className="relative group">
                        {/* Noise Texture Overlay */}
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none rounded-3xl" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}></div>

                        <div className="relative bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl overflow-hidden w-full min-h-[500px] flex flex-col justify-center">

                            {/* No internal glow blobs as per request */}

                            <div className="text-center relative z-10 mb-4 lg:mb-6">
                                <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-white mb-1 drop-shadow-lg tracking-tight">
                                    Welcome Back
                                </h2>
                                <p className="text-white/70 text-sm lg:text-xs">Enter your credentials to access your workspace</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-900/30 border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-xs text-center mb-6 backdrop-blur-sm w-fit mx-auto"
                                >
                                    <FontAwesomeIcon icon={faLock} className="mr-2" />
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5 relative z-10">
                                {/* Email Input */}
                                <div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="EMAIL"
                                        className={`w-full bg-transparent border-b text-white placeholder-white/20 px-0 py-1.5 focus:outline-none transition-colors rounded-none ${!isEmailValid && touched
                                            ? 'border-red-400 focus:border-red-400'
                                            : 'border-white/20 focus:border-purple-500'
                                            } text-sm md:text-base lg:text-sm`}
                                        value={email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {!isEmailValid && touched && (
                                        <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold mt-1 text-right">Invalid email</p>
                                    )}
                                </div>

                                {/* Password Input */}
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="PASSWORD"
                                        className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1.5 focus:outline-none focus:border-purple-500 transition-colors rounded-none text-sm md:text-base lg:text-sm pr-8"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors focus:outline-none"
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full mt-3 sm:mt-4 bg-white text-black font-bold py-2 sm:py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-white/10 flex items-center justify-center gap-2 text-base lg:text-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-2 border-black/30 border-t-black rounded-full"></div>
                                            <span>Signing In...</span>
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>

                            {/* Social Login Section */}
                            <div className="mt-4">
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-white/20"></div>
                                    <span className="flex-shrink-0 mx-4 text-white/40 text-xs">OR</span>
                                    <div className="flex-grow border-t border-white/20"></div>
                                </div>

                                <div className="text-center mt-2">
                                    <p className="text-white/60 text-xs mb-3">Sign up with Social Networks</p>
                                    <div className="flex justify-center gap-6">
                                        <button
                                            onClick={handleFacebookLogin}
                                            className="w-10 h-10 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-purple-900/50"
                                        >
                                            <FontAwesomeIcon icon={faFacebookF} className="text-lg" />
                                        </button>
                                        <button
                                            onClick={handleGoogleLogin}
                                            className="w-10 h-10 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-purple-900/50"
                                        >
                                            <FontAwesomeIcon icon={faGoogle} className="text-lg" />
                                        </button>
                                        <button
                                            onClick={handleTwitterLogin}
                                            className="w-10 h-10 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-purple-900/50"
                                        >
                                            <FontAwesomeIcon icon={faXTwitter} className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 text-center text-sm text-white/60 relative z-10">
                                Don't have an account? {' '}
                                <Link href="/signup" className="text-white font-bold hover:text-purple-300 transition-colors underline decoration-purple-400/50 hover:decoration-purple-300">
                                    Create Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
