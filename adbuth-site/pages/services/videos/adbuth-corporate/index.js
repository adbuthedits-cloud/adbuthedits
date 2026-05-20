import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SeoHead from '../../../../components/SeoHead';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { motion, useInView } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faVolumeMute, faPlay } from '@fortawesome/free-solid-svg-icons';
import useSeo from '../../../../hooks/useSeo';

export default function AdbuthCorporate() {
    const { seoData } = useSeo('adbuth-corporate');

    const VideoPlayer = ({ src, shouldPlay, className = "" }) => {
        const [isMuted, setIsMuted] = useState(true);
        const videoRef = useRef(null);

        useEffect(() => {
            if (!videoRef.current) return;
            if (shouldPlay) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }, [shouldPlay]);

        return (
            <div className={`absolute inset-0 overflow-hidden ${className}`}>
                <video
                    ref={videoRef}
                    src={src}
                    className="w-full h-full object-cover"
                    muted={isMuted}
                    loop
                    playsInline
                    preload="metadata"
                />
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute bottom-4 right-4 z-30 bg-black/40 backdrop-blur-md border border-white/10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 pointer-events-auto"
                >
                    <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} className="text-[10px]" />
                </button>
            </div>
        );
    };

    // ─── Card data ─────────────────────────────────────────────────────────────
    const CARDS = [
        { title: 'Corporate Films', desc: 'High-quality films that highlight your company\'s values, culture, and achievements.', video: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/corporatefilms-v1.1.mp4' },
        { title: 'Training Videos', desc: 'Engaging, easy-to-follow content to educate and upskill employees effectively.', video: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/Training.mp4' },
        { title: 'Brand Stories', desc: 'Narratives that showcase your brand journey, connect emotionally, and leave a lasting impact.', video: '' },
    ];
    // Triple the array so the user can scroll infinitely in both directions
    const [activeCard, setActiveCard] = useState(0);   
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const scrollContainerRef = useRef(null);
    const isUserInteracting = useRef(false);
    const currentAbsRef = useRef(0);         

    // ─── Initialise scroll position ───────────────────────────
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const firstCard = container.children[0];
        if (firstCard) {
            container.scrollLeft =
                firstCard.offsetLeft - container.offsetWidth / 2 + firstCard.offsetWidth / 2;
        }
    }, []);

    // ─── Auto-scroll every 3 s ──────────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            if (isUserInteracting.current || !scrollContainerRef.current) return;
            const container = scrollContainerRef.current;
            
            // Loop back to start if at the end
            const nextIdx = (currentAbsRef.current + 1) % CARDS.length;
            const nextCard = container.children[nextIdx];
            
            if (nextCard) {
                container.scrollTo({
                    left: nextCard.offsetLeft - container.offsetWidth / 2 + nextCard.offsetWidth / 2,
                    behavior: 'smooth',
                });
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Find the card whose centre is closest to the viewport centre
        let closestIndex = 0;
        let minDistance = Infinity;
        const cardEls = container.children;
        for (let i = 0; i < cardEls.length; i++) {
            const card = cardEls[i];
            const center = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(container.scrollLeft + container.offsetWidth / 2 - center);
            if (distance < minDistance) { minDistance = distance; closestIndex = i; }
        }

        currentAbsRef.current = closestIndex;
        setActiveCard(closestIndex);
    };

    return (
        <div className="font-sans text-black bg-white">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Corporate Video Services | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Producing powerful corporate films that connect, educate, and inspire."}
                image={seoData?.og_image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/simplified-communication.png"}
                data={seoData}
            />
            <Navbar highlight="services" isdark={false} />

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
                                <img src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/curve-arrow.png" alt="Arrow" className="h-26 hidden md:block opacity-100 w-48 absolute left-64 -top-16" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Why Choose Section */}
                <section className="py-24 px-6 md:px-12 lg:px-24 bg-white ">
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
                            { icon: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/simplified-communication.png", title: 'Simplified', subtitle: 'Communication' },
                            { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/employee-engagement.png', title: 'Employee', subtitle: 'Engagement' },
                            { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/strong-brand-identity.png', title: 'Stronger', subtitle: 'Brand Identity' },
                            { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-corporate/enhanced-credibility.png', title: 'Enhanced', subtitle: 'Credibility' }
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
                                    <img src={item.icon} alt={item.title} className="w-full h-full object-contain" />
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
                <section className="py-24 px-0 md:px-12 lg:px-24 bg-[#142151] text-white">
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

                    {/* Mobile Slider – infinite loop */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        onTouchStart={() => { isUserInteracting.current = true; }}
                        onTouchEnd={() => {
                            setTimeout(() => { isUserInteracting.current = false; }, 5000);
                        }}
                        className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 px-[15vw] pb-10 no-scrollbar"
                    >
                        {CARDS.map((card, index) => (
                            <motion.div
                                key={index}
                                animate={{
                                    scale: activeCard === index ? 1 : 0.9,
                                    opacity: activeCard === index ? 1 : 0.6,
                                }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                className="snap-center flex-shrink-0 w-[58vw] aspect-[3/4] rounded-2xl flex flex-col justify-end shadow-lg relative overflow-hidden text-white"
                            >
                                {card.video ? (
                                    <VideoPlayer src={card.video} shouldPlay={activeCard === index} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#1a2151]">
                                        <FontAwesomeIcon icon={faPlay} className="text-4xl opacity-10" />
                                    </div>
                                )}
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80" />
                                <div className="relative z-10 p-6">
                                    <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                                    <p className="text-gray-200 text-xs leading-relaxed">{card.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
                {/* Footer CTA Desktop */}
                <section className="py-24 px-6 lg:px-24 bg-white text-black ">
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
