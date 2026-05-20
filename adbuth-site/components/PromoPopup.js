import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy, faCheck, faChevronLeft, faChevronRight, faTicketAlt, faIndianRupeeSign } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const PromoPopup = () => {
    const [promos, setPromos] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivePromos();
    }, []);

    const fetchActivePromos = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${apiUrl}/api/coupons/popup`);

            if (res.data.success && res.data.coupons?.length > 0) {
                const availablePromos = res.data.coupons;
                setPromos(availablePromos);
                
                // Delay popup to avoid competing with LCP (hero image / page paint)
                setTimeout(() => setIsOpen(true), 4000);
            }
        } catch (error) {
            console.error('Failed to fetch promo popup:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        if (promos.length > 0) {
            const currentPromo = promos[currentIndex];
            const dismissedCoupons = JSON.parse(localStorage.getItem('dismissed_promos') || '{}');

            // Store with current media_url to track if it changes later
            dismissedCoupons[currentPromo.coupon_id] = {
                timestamp: Date.now(),
                media_url: currentPromo.media_url
            };
            localStorage.setItem('dismissed_promos', JSON.stringify(dismissedCoupons));

            const remaining = promos.filter((_, i) => i !== currentIndex);
            if (remaining.length === 0) {
                setIsOpen(false);
            } else {
                setPromos(remaining);
                setCurrentIndex(0);
            }
        }
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const nextPromo = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % promos.length);
    };

    const prevPromo = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);
    };

    if (promos.length === 0 || loading) return null;

    const currentPromo = promos[currentIndex];
    const hasMedia = !!currentPromo.media_url;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[650px] pointer-events-auto"
                    >
                        <div
                            className="bg-white flex relative overflow-hidden transition-all duration-300 rounded-[30px] sm:rounded-[45px] shadow-2xl"
                            style={{
                                maskImage: `radial-gradient(circle at 40% 0, transparent 16px, white 17px), 
                                           radial-gradient(circle at 40% 100%, transparent 16px, white 17px)`,
                                WebkitMaskImage: `radial-gradient(circle at 40% 0, transparent 16px, white 17px), 
                                                 radial-gradient(circle at 40% 100%, transparent 16px, white 17px)`,
                                maskComposite: 'intersect',
                                WebkitMaskComposite: 'destination-in'
                            }}
                        >

                            {/* Left Side: Media Inset (Matches the Reference Image) */}
                            <div className="w-[35%] sm:w-[40%] p-3 sm:p-5 relative flex-shrink-0 flex items-center justify-center">
                                <div className="w-full h-full relative rounded-[20px] sm:rounded-[30px] overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {currentPromo.media_url ? (
                                        currentPromo.media_type === 'video' ? (
                                            <video
                                                src={currentPromo.media_url}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                className="w-full h-full object-cover block"
                                            />
                                        ) : (
                                            <img
                                                src={currentPromo.media_url}
                                                alt={currentPromo.code}
                                                className="w-full h-full object-cover block"
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#7D287E] to-[#4A1D4B] flex items-center justify-center">
                                            <div className="text-white/20 flex items-center gap-3">
                                                <FontAwesomeIcon icon={faIndianRupeeSign} className="text-3xl sm:text-[100px]" />

                                            </div>
                                        </div>
                                    )}
                                    {/* Subtle Inset Shadow */}
                                    <div className="absolute inset-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] pointer-events-none" />
                                </div>
                            </div>

                            {/* Divider Line (Dashed Perforation) */}
                            <div className="absolute left-[35%] sm:left-[40%] top-[45px] bottom-[45px] border-l-2 border-dashed border-gray-100/80 z-10" />

                            {/* Right Side: Content */}
                            <div className="w-[65%] sm:w-[60%] p-8 sm:p-14 sm:pl-10 flex flex-col justify-center relative bg-white">
                                {/* Header / Close */}
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-xl font-montserrat font-black text-purple-600 tracking-widest uppercase truncate max-w-[90%]">
                                        {currentPromo.title || 'Special Offer'}
                                    </p>
                                    <button
                                        onClick={handleDismiss}
                                        aria-label="Close offer popup"
                                        className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-all flex items-center justify-center -mr-6 -mt-6"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="text-sm" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                                        {currentPromo.value}{currentPromo.discount_type === 'percentage' ? '%' : '₹'} <span className="text-lg">OFF</span>
                                    </h2>
                                </div>

                                <p className="text-gray-500 text-xs sm:text-sm mb-6 font-medium leading-relaxed pr-8">
                                    {currentPromo.message || 'Unlock your exclusive discount at checkout.'}
                                </p>

                                <div className="mt-auto">
                                    <div
                                        onClick={() => handleCopy(currentPromo.code)}
                                        className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-2 flex items-center justify-between group cursor-pointer hover:border-purple-300 transition-all"
                                    >
                                        <div className="pl-1">
                                            <p className="text-[8px] uppercase font-bold text-gray-400 tracking-tighter mb-0.5">Code</p>
                                            <span className="text-sm font-mono font-black text-gray-900 tracking-tighter">{currentPromo.code}</span>
                                        </div>
                                        <button
                                            aria-label={copied ? 'Coupon code copied' : `Copy coupon code ${currentPromo.code}`}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white'
                                                }`}
                                        >
                                            {copied ? <FontAwesomeIcon icon={faCheck} aria-hidden="true" /> : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Carousel Nav */}
                                {promos.length > 1 && (
                                    <div className="absolute bottom-2 right-4 flex gap-1">
                                        <button onClick={prevPromo} aria-label="Previous offer" className="w-5 h-5 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center text-[8px]">
                                            <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
                                        </button>
                                        <button onClick={nextPromo} aria-label="Next offer" className="w-5 h-5 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center text-[8px]">
                                            <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SVG ClipPaths - Defined globally but reusable */}
                        <svg width="0" height="0" className="absolute">
                            <defs>
                                {/* Mask with Media (Cutouts at edges and 35% fold) */}
                                <clipPath id="ticket-mask-media" clipPathUnits="objectBoundingBox">
                                    <path d="M 0.2, 0 
                                             L 0.35, 0 A 0.03, 0.03 0 0 1 0.45, 0 L 0.8, 0
                                             A 0.05, 0.05 0 0 1 0.95, 0 L 1, 0
                                             L 1, 0.4 A 0.03, 0.03 0 0 1 1, 0.6 L 1, 1
                                             L 0.45, 1 A 0.03, 0.03 0 0 1 0.35, 1 L 0, 1
                                             L 0, 0.6 A 0.03, 0.03 0 0 1 0, 0.4 L 0, 0 Z"
                                        transform="scale(1, 1)" />
                                    {/* Using a simpler rounded path with bites */}
                                    <path d="M 0.05, 0 
                                             H 0.32 A 0.03 0.03 0 0 0 0.38 0 H 0.95 
                                             Q 1 0, 1 0.05 
                                             V 0.45 A 0.03 0.03 0 0 0 1 0.55 V 0.95 
                                             Q 1 1, 0.95 1 
                                             H 0.38 A 0.03 0.03 0 0 0 0.32 1 H 0.05 
                                             Q 0 1, 0 0.95 
                                             V 0.55 A 0.03 0.03 0 0 0 0 0.45 V 0.05 
                                             Q 0 0, 0.05 0" />
                                </clipPath>

                                {/* Mask without Media (Cutouts only at side edges) */}
                                <clipPath id="ticket-mask-no-media" clipPathUnits="objectBoundingBox">
                                    <path d="M 0.05, 0 
                                             H 0.95 
                                             Q 1 0, 1 0.05 
                                             V 0.45 A 0.03 0.03 0 0 0 1 0.55 V 0.95 
                                             Q 1 1, 0.95 1 
                                             H 0.05 
                                             Q 0 1, 0 0.95 
                                             V 0.55 A 0.03 0.03 0 0 0 0 0.45 V 0.05 
                                             Q 0 0, 0.05 0" />
                                </clipPath>
                            </defs>
                        </svg>

                        {/* Stacking effect */}
                        {promos.length > 1 && (
                            <div className="absolute -bottom-2 inset-x-4 h-4 bg-white/50 rounded-2xl -z-10 blur-[1px]" />
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PromoPopup;
