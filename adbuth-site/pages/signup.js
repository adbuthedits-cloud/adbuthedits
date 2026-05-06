import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faGoogle, faTwitter } from '@fortawesome/free-brands-svg-icons';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

const Beams = dynamic(() => import('../components/ui/Beams'), { ssr: false });

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
    { code: '+39', country: 'Italy', placeholder: '312 345 6789' },
    { code: '+34', country: 'Spain', placeholder: '612 345 678' },
    { code: '+55', country: 'Brazil', placeholder: '11 91234 5678' },
    { code: '+27', country: 'South Africa', placeholder: '82 123 4567' },
    { code: '+234', country: 'Nigeria', placeholder: '803 123 4567' },
    { code: '+92', country: 'Pakistan', placeholder: '300 1234567' },
    { code: '+880', country: 'Bangladesh', placeholder: '1712 345678' },
    { code: '+60', country: 'Malaysia', placeholder: '12 345 6789' },
    { code: '+62', country: 'Indonesia', placeholder: '812 3456 789' },
    { code: '+63', country: 'Philippines', placeholder: '912 345 6789' },
    { code: '+66', country: 'Thailand', placeholder: '81 234 5678' },
    { code: '+84', country: 'Vietnam', placeholder: '91 234 5678' },
    { code: '+90', country: 'Turkey', placeholder: '532 123 45 67' },
    { code: '+966', country: 'Saudi Arabia', placeholder: '50 123 4567' },
    { code: '+965', country: 'Kuwait', placeholder: '5123 4567' },
    { code: '+974', country: 'Qatar', placeholder: '5512 3456' },
    { code: '+9 Oman', country: 'Oman', placeholder: '9123 4567' },
    { code: '+973', country: 'Bahrain', placeholder: '3123 4567' },
    { code: '+20', country: 'Egypt', placeholder: '10 1234 5678' },
    { code: '+212', country: 'Morocco', placeholder: '612 345678' },
    { code: '+31', country: 'Netherlands', placeholder: '6 12345678' },
    { code: '+32', country: 'Belgium', placeholder: '412 34 56 78' },
    { code: '+41', country: 'Switzerland', placeholder: '71 234 56 78' },
    { code: '+43', country: 'Austria', placeholder: '664 1234567' },
    { code: '+46', country: 'Sweden', placeholder: '70 123 45 67' },
    { code: '+47', country: 'Norway', placeholder: '912 34 567' },
    { code: '+45', country: 'Denmark', placeholder: '12 34 56 78' },
    { code: '+353', country: 'Ireland', placeholder: '83 123 4567' },
    { code: '+64', country: 'New Zealand', placeholder: '21 123 4567' },
    { code: '+852', country: 'Hong Kong', placeholder: '9123 4567' },
    { code: '+886', country: 'Taiwan', placeholder: '912 345 678' },
    { code: '+82', country: 'South Korea', placeholder: '10 1234 5678' },
    { code: '+52', country: 'Mexico', placeholder: '55 1234 5678' },
    { code: '+54', country: 'Argentina', placeholder: '11 1234 5678' },
    { code: '+56', country: 'Chile', placeholder: '9 1234 5678' },
    { code: '+57', country: 'Colombia', placeholder: '312 345 6789' },
    { code: '+51', country: 'Peru', placeholder: '912 345 678' },
    { code: '+94', country: 'Sri Lanka', placeholder: '71 234 5678' },
    { code: '+977', country: 'Nepal', placeholder: '984 1234567' },
];

export default function Signup() {
    const { seoData } = useSeo('signup');
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState(countryOptions[0].code);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Responsive Beams Config
    const [beamConfig, setBeamConfig] = useState({
        beamWidth: 3,
        beamHeight: 30,
        beamNumber: 20,
        scale: 0.2
    });

    // Validation States
    const [isEmailValid, setIsEmailValid] = useState(true);
    const [isPhoneValid, setIsPhoneValid] = useState(true);
    const [touched, setTouched] = useState({ email: false, phone: false });

    const { signup, user, loading: authLoading } = useAuth();


    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/');
        }
    }, [user, authLoading]);

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

    const validatePhone = (num) => {
        // Strip spaces, dashes, and parentheses for validation
        const cleanNum = String(num).replace(/[\s\-\(\)]/g, '');
        // Global phone numbers range from 7 to 15 digits
        return /^\d{7,15}$/.test(cleanNum);
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        if (field === 'email') setIsEmailValid(!!validateEmail(email));
        if (field === 'phone') setIsPhoneValid(validatePhone(phone));
    };

    const handleChange = (field, value) => {
        if (field === 'email') {
            setEmail(value);
            if (touched.email) setIsEmailValid(!!validateEmail(value));
        }
        if (field === 'phone') {
            setPhone(value);
            if (touched.phone) setIsPhoneValid(validatePhone(value));
        }
        if (field === 'firstName') setFirstName(value);
        if (field === 'lastName') setLastName(value);
        if (field === 'password') setPassword(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Final check before submit
        const vEmail = !!validateEmail(email);
        const vPhone = validatePhone(phone);

        setIsEmailValid(vEmail);
        setIsPhoneValid(vPhone);
        setTouched({ email: true, phone: true });

        if (!vEmail || !vPhone) {
            setIsSubmitting(false);
            return;
        }

        const phoneData = { code: countryCode, number: phone };
        const result = await signup(firstName, lastName, email, password, phoneData);
        if (!result.success) {
            setError(result.error);
        }
        setIsSubmitting(false);
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

            {/* Navigation Controls */}
            {/* Navigation Controls - Relative Flow */}
            {/* Navigation Controls - Relative Flow */}
            {/* Navigation Controls - Responsive Alignment */}
            <header className="w-full top-0 left-0 z-50 transition-all duration-300 ">
                <div className="max-w-7xl md:mx-12 lg:mx-auto mx-auto flex items-center justify-between p-6 relative z-50">
                    <div className="flex  items-center gap-4">
                        <Link href="/" className="flex  items-center  gap-2">
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

            {/* Logo Outside Card */}


            {/* Center Content Wrapper */}
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

                            <div className="text-center relative z-10 mb-4  lg:mb-6">
                                <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-white mb-1 drop-shadow-lg tracking-tight">
                                    Create Account
                                </h2>
                                <p className="text-white/70 text-sm lg:text-xs">Join Adbuth Edits today</p>
                            </div>

                            {error && (
                                <div className="bg-red-900/30 border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-xs text-center mb-6 backdrop-blur-sm w-fit mx-auto">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5 relative z-10">
                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <input
                                            type="text"
                                            required
                                            placeholder="FIRST NAME"

                                            className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1 focus:outline-none focus:border-purple-500 transition-colors rounded-none text-sm md:text-base lg:text-sm"
                                            value={firstName}
                                            onChange={(e) => handleChange('firstName', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <input
                                            type="text"
                                            required
                                            placeholder="LAST NAME"

                                            className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1 focus:outline-none focus:border-purple-500 transition-colors rounded-none text-sm md:text-base lg:text-sm"
                                            value={lastName}
                                            onChange={(e) => handleChange('lastName', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="EMAIL"
                                        className={`w-full bg-transparent border-b text-white placeholder-white/20 px-0 py-1 focus:outline-none transition-colors rounded-none ${!isEmailValid && touched.email
                                            ? 'border-red-400 focus:border-red-400'
                                            : 'border-white/20 focus:border-purple-500'
                                            } text-sm md:text-base lg:text-sm`}
                                        value={email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        onBlur={() => handleBlur('email')}
                                    />
                                    {!isEmailValid && touched.email && (
                                        <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold mt-1 text-right">Invalid email</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex gap-4 items-end">
                                        <select
                                            className="bg-transparent border-b border-white/20 text-white py-1 focus:border-purple-500 outline-none [&>option]:text-black w-24 text-sm md:text-base lg:text-sm cursor-pointer"
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                        >
                                            {countryOptions.map(opt => (
                                                <option key={opt.code} value={opt.code}>
                                                    {opt.country} ({opt.code})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="tel"
                                            className={`flex-1 bg-transparent border-b text-white placeholder-white/20 px-0 py-1 focus:outline-none transition-colors rounded-none ${!isPhoneValid && touched.phone
                                                ? 'border-red-400 focus:border-red-400'
                                                : 'border-white/20 focus:border-purple-500'
                                                } text-sm md:text-base lg:text-sm`}
                                            placeholder={currentCountry.placeholder}
                                            value={phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            onBlur={() => handleBlur('phone')}
                                        />
                                    </div>
                                    {!isPhoneValid && touched.phone && (
                                        <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold mt-1 text-right">Invalid phone</p>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="PASSWORD"
                                        className="w-full bg-transparent border-b border-white/20 text-white placeholder-white/20 px-0 py-1 focus:outline-none focus:border-purple-500 transition-colors rounded-none text-sm md:text-base lg:text-sm"
                                        value={password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full mt-4 bg-white text-black font-bold py-2 sm:py-2.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-white/10 flex items-center justify-center gap-2 text-base lg:text-sm"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-2 border-black/30 border-t-black rounded-full"></div>
                                            <span>Creating Account...</span>
                                        </>
                                    ) : 'Sign Up'}
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
                                        <button className="w-10 h-10 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-purple-900/50">
                                            <FontAwesomeIcon icon={faFacebookF} className="text-lg" />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-purple-900/50">
                                            <FontAwesomeIcon icon={faGoogle} className="text-lg" />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-[#7D287E] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg hover:shadow-purple-900/50">
                                            <FontAwesomeIcon icon={faTwitter} className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-6 text-center text-sm text-white/60 relative z-10">
                                Already have an account? {' '}
                                <Link href="/login" className="text-white font-bold hover:text-purple-300 transition-colors underline decoration-purple-400/50 hover:decoration-purple-300">
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
