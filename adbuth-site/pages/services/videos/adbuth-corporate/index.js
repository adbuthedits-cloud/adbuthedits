import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SeoHead from '../../../../components/SeoHead';
import Footer from '../../../../components/Footer';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faVolumeMute, faPlay } from '@fortawesome/free-solid-svg-icons';
import { cdnImage, cdnVideo } from '../../../../utils/cdn';
import useSeo from '../../../../hooks/useSeo';

// ─── VideoPlayer defined outside parent to prevent hydration mismatch ──────────
function VideoPlayer({ src, shouldPlay, className = "" }) {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        if (!videoRef.current) return;
        let timer;
        if (shouldPlay) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => { });
            timer = setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.pause();
                }
            }, 10000);
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [shouldPlay]);

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            <video
                ref={videoRef}
                src={cdnVideo(src)}
                className="w-full h-full object-cover"
                muted={isMuted}
                playsInline
                preload="metadata"
                onTimeUpdate={(e) => {
                    if (e.target.currentTime >= 10) {
                        e.target.pause();
                    }
                }}
            />
            <button
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (videoRef.current && videoRef.current.paused) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play().catch(() => {});
                    }
                    setIsMuted(!isMuted); 
                }}
                className="absolute bottom-4 right-4 z-30 bg-black/40 backdrop-blur-md border border-white/10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 pointer-events-auto"
            >
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} className="text-[10px]" />
            </button>
        </div>
    );
}

export default function AdbuthCorporate() {
    const { seoData } = useSeo('adbuth-corporate');

    // ─── Card data ─────────────────────────────────────────────────────────────
    const CARDS = [
        { title: 'Corporate Films', desc: 'High-quality films that highlight your company\'s values, culture, and achievements.', video: 'https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/corporatefilms-v1.1_web.mp4' },
        { title: 'Training Videos', desc: 'Engaging, easy-to-follow content to educate and upskill employees effectively.', video: 'https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/Training_web.mp4' },
        { title: 'Brand Stories', desc: 'Narratives that showcase your brand journey, connect emotionally, and leave a lasting impact.', video: 'https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/Brand Stories Video_web_1780192465819.mp4' },
    ];
    const [activeCard, setActiveCard] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX; // Reset to avoid click conflict
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        const diffX = touchStartX.current - touchEndX.current;
        const swipeThreshold = 45;

        if (diffX > swipeThreshold) {
            // Swipe Left -> next card
            setActiveCard((prev) => Math.min(prev + 1, CARDS.length - 1));
        } else if (diffX < -swipeThreshold) {
            // Swipe Right -> prev card
            setActiveCard((prev) => Math.max(prev - 1, 0));
        }
    };

    return (
        <div className="font-sans text-black bg-white">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Corporate Video Services | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Producing powerful corporate films that connect, educate, and inspire."}
                image={cdnImage(seoData?.og_image || "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/simplified-communication.webp")}
                data={seoData}
            />
            <main className='pt-24'>
                {/* Hero Section */}
                <section className="bg-[#E5E5E5] lg:min-h-[100vh] min-h-[60vh] flex items-center md:items-end justify-center md:justify-start px-6 md:px-24 py-20 relative overflow-hidden">
                    <div className="max-w-5xl relative z-10 text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center gap-2 mb-8">
                                {/* Logo placeholder if needed, or just spacing */}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 italic text-black">
                                Producing <br className="md:hidden" />
                                Powerful <br className="md:hidden" />
                                Corporate Films <br className="md:hidden" />
                                That Connect, <br className="md:hidden" />
                                Educate & Inspire
                            </h1>

                            <p className="text-base md:text-xl text-black mb-10 max-w-2xl mx-auto md:mx-0">
                                Your brand has a story worth telling.<br />
                                Lets make it unforgettable
                            </p>

                            <div className="flex items-center justify-center md:justify-start gap-4 relative">
                                <Link href="/enquiry-form">
                                    <button className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-3 hover:scale-105 transition-transform">
                                        Request for quote
                                    </button>
                                </Link>
                                {/* Decorative arrow line */}
                                <img src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/curve-arrow.webp")} alt="Arrow" className="h-26 hidden md:block opacity-100 w-48 absolute left-64 -top-16" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Why Choose Section */}
                <section className="py-10 md:py-24 px-6 md:px-12 lg:px-24 bg-white ">
                    <div className="flex lg:flex-row flex-col gap-12 lg:gap-24 justify-between items-center mb-20 ">
                        <div className="w-full lg:w-1/2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="md:text-5xl lg:text-4xl text-4xl font-semibold md:font-bold mb-2">WHY CHOOSE</h2>
                                <h2 className="md:text-5xl lg:text-4xl text-4xl font-semibold md:font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent mb-8">CORPORATE VIDEOS?</h2>

                                <p className="text-gray-600 md:text-lg text-base leading-relaxed">
                                    A well-produced corporate film is more than visuals it's an investment that builds trust, communicates effectively, engages employees, and strengthens brand identity.
                                </p>
                            </motion.div>
                        </div>
                        <div className="relative w-full lg:w-[500px] max-w-[500px] aspect-[5/3] lg:aspect-auto lg:h-[300px]">
                            <div className="bg-[#C4C4C4] w-full h-full relative z-10"></div>
                            {/* Purple accent background */}
                            <div className="absolute -bottom-4 -left-4 w-full h-full bg-[#7D287E] opacity-90 -z-0"></div>
                        </div>
                    </div>

                    {/* Benefits Icons */}
                    <div className="grid grid-cols-4 lg:flex lg:flex-row justify-between items-start gap-4 text-center lg:mx-44 pt-4 lg:pt-16">
                        {[
                            { icon: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/simplified-communication.webp", title: 'Simplified', subtitle: 'Communication' },
                            { icon: 'https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/employee-engagement.webp', title: 'Employee', subtitle: 'Engagement' },
                            { icon: 'https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/strong-brand-identity.webp', title: 'Stronger', subtitle: 'Brand Identity' },
                            { icon: 'https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-corporate/enhanced-credibility.webp', title: 'Enhanced', subtitle: 'Credibility' }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-10 h-10 lg:w-16 lg:h-16 mb-2 lg:mb-4 text-[#d946ef] flex items-center justify-center">
                                    <img src={cdnImage(item.icon)} alt={item.title} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-[10px] lg:text-base leading-tight">{item.title}</h3>
                                    <h3 className="text-[10px] lg:text-base leading-tight">{item.subtitle}</h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* What We Create Section */}
                <section className="md:py-24 py-12 px-0 md:px-12 lg:px-24 bg-[#142151] text-white">
                    <div className="text-center mb-16 px-6">
                        <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-wide">What We Create</h2>
                    </div>

                    {/* Desktop Grid */}
                    <div className="hidden md:grid md:grid-cols-3 gap-8">
                        {CARDS.map((card, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2, duration: 0.5, ease: 'easeOut' }}
                                whileHover={{ scale: 1.07, transition: { type: 'tween', ease: 'easeOut', duration: 0.16 } }}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="relative text-white rounded-xl aspect-[3/4] flex flex-col justify-end overflow-hidden cursor-pointer bg-gray-900"
                            >
                                {card.video ? (
                                    <VideoPlayer src={card.video} shouldPlay={hoveredIndex === index} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#1a2151]">
                                        <FontAwesomeIcon icon={faPlay} className="text-4xl opacity-10" />
                                    </div>
                                )}
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80 pointer-events-none" />
                                <div className="relative z-10 p-8 pointer-events-none">
                                    <h3 className="lg:text-2xl text-xl font-bold mb-4">{card.title}</h3>
                                    <p className="text-gray-200 lg:text-sm text-xs md:line-clamp-2">{card.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile Slider – touch-driven single-card snap carousel */}
                    <div
                        className="relative w-full overflow-hidden md:hidden pb-10"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <motion.div
                            className="flex gap-[4vw] px-[12.5vw]"
                            animate={{ x: `-${activeCard * 79}vw` }}
                            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                        >
                            {CARDS.map((card, index) => (
                                <motion.div
                                    key={index}
                                    onClick={() => setActiveCard(index)}
                                    animate={{
                                        scale: activeCard === index ? 1 : 0.9,
                                        opacity: activeCard === index ? 1 : 0.5,
                                    }}
                                    transition={{ duration: 0.35, ease: 'easeOut' }}
                                    className="flex-shrink-0 w-[75vw] aspect-[3/4] rounded-2xl flex flex-col justify-end shadow-xl relative overflow-hidden text-white cursor-pointer"
                                >
                                    {card.video ? (
                                        <VideoPlayer
                                            src={card.video}
                                            shouldPlay={activeCard === index && !isDragging}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#1a2151]">
                                            <FontAwesomeIcon icon={faPlay} className="text-4xl opacity-10" />
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80 pointer-events-none" />
                                    <div className="relative z-10 p-6 pointer-events-none">
                                        <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                                        <p className="text-gray-200 text-xs leading-relaxed">{card.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Pagination Dots */}
                        <div className="flex justify-center gap-2 mt-6">
                            {CARDS.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveCard(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${activeCard === index ? 'bg-white w-6' : 'bg-white/30'}`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </section>
                {/* Footer CTA Desktop */}
                <section className="py-14 md:py-24 px-6 lg:px-24 bg-white text-black ">
                    <div className="max-w-7xl text-center lg:text-left">
                        <h2 className="text-4xl lg:text-4xl font-bold mb-4 leading-tight">
                            Your story deserves the spotlight
                        </h2>

                        <div className="mt-12 ">
                            <Link href="/enquiry-form">
                                <button className="bg-[#7D287E] text-white px-10 lg:px-24 py-6 rounded-full text-base lg:text-xl font-bold shadow-lg hover:bg-[#963097] transition-colors">
                                    Request for Quote
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
