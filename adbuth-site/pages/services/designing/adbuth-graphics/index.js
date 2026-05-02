import SeoHead from '../../../../components/SeoHead';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import useSeo from '../../../../hooks/useSeo';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const MobileExploreCard = ({ tabName, content, isFirst }) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // x moves from 0% to -66% representing the horizontal scrub
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66%"]);

    return (
        <div ref={containerRef} className="relative w-full h-[200vh]">
            <div className="sticky top-0 h-[100dvh] w-full bg-transparent flex flex-col pb-16 overflow-hidden">
                {/* Top White Section */}
                <div className="w-full bg-transparent pt-10 pb-4 px-6 z-10 flex-shrink-0 min-h-[100px]">
                    {isFirst && (
                        <h2 className="text-3xl md:text-5xl font-bold mb-10 text-[#A75CF2] w-[100%] inline-block font-sans leading-tight">
                            Explore Our Services
                        </h2>
                    )}
                </div>

                {/* Middle - Horizontally Scrolling Images Section */}
                <div className="w-full relative flex-grow z-20 overflow-visible py-4">
                    <motion.div
                        className="flex flex-row space-x-6 md:space-x-8 absolute left-6 md:left-12 h-full items-center"
                        style={{ x }}
                    >
                        {content.images.map((src, idx) => (
                            <div key={idx} className="h-[95%] sm:h-full aspect-[3/4] bg-gray-200 flex-shrink-0 relative overflow-hidden shadow-md">
                                <img src={src} alt={`${tabName} ${idx}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Bottom Text Section */}
                <div className="w-full flex-shrink-0 flex flex-col items-center justify-start px-6 bg-white text-center pt-16 pb-10">
                    <h3 className="text-3xl md:text-5xl font-bold mb-3 text-black z-10 relative">{tabName}</h3>
                    <p className="text-gray-800 text-lg md:text-lg mb-8 max-w-[85%] leading-relaxed z-10 relative">{content.subtitle}</p>

                    <Link href="/enquiry-form">
                        <button className="border border-[#A75CF2] bg-white py-2.5 px-8 rounded-full text-black text-xl font-medium hover:bg-gray-50 transition-colors w-fit z-10 relative">
                            Enquiry Now
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default function AdbuthGraphics() {
    const { seoData } = useSeo('adbuth-graphics');
    const [activeImageIndex, setActiveImageIndex] = useState(1);
    const exploreRef = useRef(null);

    const [activeTab, setActiveTab] = useState("Posters & Campaign Graphics");
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!exploreRef.current) return;
            const rect = exploreRef.current.getBoundingClientRect();
            // maxScroll is the amount we can scroll within the wrapper (400vh total)
            const maxScroll = rect.height - window.innerHeight;

            if (maxScroll <= 0) return; // Only apply scrub logic if scrolling applies

            let progress = 0;
            if (rect.top <= 0) {
                progress = Math.min(1, Math.max(0, Math.abs(rect.top) / maxScroll));
            }
            setScrollProgress(progress);

            const numTabs = 4; // Since tabs.length is 4
            let index = Math.floor(progress * numTabs);
            if (index >= numTabs) index = numTabs - 1;

            setActiveTab((prevTab) => {
                const newTab = [
                    "Posters & Campaign Graphics",
                    "Social Media Creatives",
                    "Branding Designs",
                    "Thumbnails"
                ][index];
                return prevTab !== newTab ? newTab : prevTab;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Trigger immediately to set initial state correctly
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleTabClick = (index) => {
        if (!exploreRef.current) return;
        const rect = exploreRef.current.getBoundingClientRect();
        const startTop = window.scrollY + rect.top;
        const maxScroll = rect.height - window.innerHeight;

        if (maxScroll > 0) {
            // Target the very start of that tab's region (0.01) to begin the scroll animation clean
            const targetProgress = (index + 0.01) / 4;
            const targetScroll = startTop + (maxScroll * targetProgress);
            window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
    };

    const tabs = [
        "Posters & Campaign Graphics",
        "Social Media Creatives",
        "Branding Designs",
        "Thumbnails"
    ];

    // Placeholder data based on selected tab
    const tabContent = {
        "Posters & Campaign Graphics": {
            subtitle: "Bold visuals that command attention",
            images: [
                "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_2.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png"]
        },
        "Social Media Creatives": {
            subtitle: "Consistent, on-brand content to boost engagement.",
            images: ["https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_2.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png"]
        },
        "Branding Designs": {
            subtitle: "Logos, color palettes, and templates that define your identity.",
            images: ["https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_2.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png"]
        },
        "Thumbnails": {
            subtitle: "Eye-catching thumbnails to increase clicks and views",
            images: ["https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_2.png", "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png"]
        }
    };

    // Placeholder Images arrays based on screenshots
    const carouselImages = [
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-1.png", // Example Left Image
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-2.png", // Center Image (from previous page)
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-3.png",
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-4.png", // Example Left Image
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-5.png",
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-1.png", // Example Left Image
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-2.png", // Center Image (from previous page)
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-3.png",
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-4.png", // Example Left Image
        "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-graphics/graphics-5.png" // Center Image (from previous page)
    ];

    const handlePrev = () => {
        setActiveImageIndex((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setActiveImageIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
    };

    // Auto-play interval
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveImageIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
        }, 2000);
        return () => clearInterval(interval);
    }, [activeImageIndex, carouselImages.length]);

    // Touch swipe handling
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) {
            handleNext();
        } else if (distance < -minSwipeDistance) {
            handlePrev();
        }
    };

    // Calculate the localized progress for the mobile horizontal card slider
    // We have 4 tabs, each taking up 25% of the total scroll progress.
    // E.g. Tab 0 goes from 0 to 0.25 progress.
    const getLocalTabProgress = () => {
        const tabIndex = tabs.indexOf(activeTab);
        const startProgress = tabIndex / 4;
        const localProgress = (scrollProgress - startProgress) * 4; // Normalize to 0 -> 1 for THIS specific tab
        return Math.min(1, Math.max(0, localProgress));
    };

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Adbuth Graphics | Designing Services"}
                description={seoData?.meta_description || seoData?.description || "Visuals that captivate, stories that stick. Posters, social media creatives, and thumbails."}
                image={seoData?.og_image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_2.png"}
                data={seoData}
            />




            <main className="pt-24 md:pt-24 bg-white w-full flex-1" style={{ overflowX: 'clip' }}>
                <Navbar isdark={false} highlight="services" />
                {/* Hero Section w/ Gradient & 3D Carousel */}
                <section
                    className="relative pt-10 md:pt-24 pb-32 md:pb-40 lg:pb-32 "
                    style={{
                        background: 'linear-gradient(135deg, #B875E3 0%, #BA78DA 10%, #C182C3 26%, #CC939E 46%, #DCAA6A 69%, #F0C728 94%, #F5CE19 100%)',
                        fontFamily: '"DMSans", sans-serif'
                    }}
                >
                    <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10 w-full flex flex-col items-center lg:items-start text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 lg:mb-6 text-black  md:leading-snug max-w-2xl">
                            Visuals That Captivate<br className="hidden lg:block" /> Stories That Stick.
                        </h1>
                        <p className="lg:text-black/80 text-white text-sm md:text-lg lg:text-xl  mb-12  max-w-[80%]  leading-relaxed">
                            We craft posters, social media creatives, branding designs, and thumbnails that keep your engaged and your brand memorable.
                        </p>
                    </div>

                    {/* 3D Carousel Container */}
                    <div className="relative w-full max-w-[1200px] mx-auto h-[200px] md:h-[300px] lg:h-[400px] flex justify-center items-center mt-8 perspective-1000">

                        {/* Left Arrow (Desktop Only) */}
                        <button
                            onClick={handlePrev}
                            className=" lg:flex absolute left-[5%] md:left-[20%] lg:left-[30%] z-50 bg-white hover:bg-gray-100 text-black rounded-full p-2.5 shadow-lg shadow-black/80 transition-all items-center justify-center transform top-full -translate-y-1/2 cursor-pointer border border-gray-200"
                            aria-label="Previous Image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>

                        {/* Image Cards */}
                        <div
                            className="relative  w-full max-w-[800px] h-full flex justify-center items-center top-1/2 -translate-y-1/2"
                            style={{ transformStyle: 'preserve-3d' }}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {carouselImages.map((src, index) => {
                                // Calculate position relative to active index
                                let position = index - activeImageIndex;
                                if (position < -Math.floor(carouselImages.length / 2)) position += carouselImages.length;
                                if (position > Math.floor(carouselImages.length / 2)) position -= carouselImages.length;

                                const isCenter = position === 0;
                                const isLeft1 = position === -1;
                                const isRight1 = position === 1;
                                const isLeft2 = position === -2;
                                const isRight2 = position === 2;

                                // Base styling for aspect ratio and transition
                                const baseStyle = "absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-[900ms] ease-in-out rounded-xl overflow-hidden shadow-2xl bg-black border-[4px] md:border-[10px] lg:border-[10px] border-[#111] transform-origin-center";

                                // Dimensions - maintaining tablet aspect ratio like iPad (3:4) or specific portrait ratio
                                const aspectStyle = "w-[60vw] md:w-[45vw] lg:w-[23vw] aspect-[3/4]";

                                let dynamicStyle = "";

                                // Using standard transform map for the dynamic perspective and height matching screenshot
                                if (isCenter) {
                                    dynamicStyle = "opacity-100 cursor-default shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]";
                                } else if (isLeft1) {
                                    dynamicStyle = "opacity-100 cursor-pointer shadow-[20px_20px_50px_-10px_rgba(0,0,0,0.6)]";
                                } else if (isRight1) {
                                    dynamicStyle = "opacity-100 cursor-pointer shadow-[-20px_20px_50px_-10px_rgba(0,0,0,0.6)]";
                                } else if (isLeft2) {
                                    dynamicStyle = "opacity-100 cursor-pointer shadow-[20px_10px_30px_-5px_rgba(0,0,0,0.5)]";
                                } else if (isRight2) {
                                    dynamicStyle = "opacity-100 cursor-pointer shadow-[-20px_10px_30px_-5px_rgba(0,0,0,0.5)]";
                                } else {
                                    // For cards further out, make them invisible and non-interactive
                                    dynamicStyle = "opacity-0 pointer-events-none";
                                }

                                // Calculate intense 3D inline styles matching EXACTLY the reference
                                // Note: Y-axis is negative (upwards) relative to the center card
                                // We use rotateX to pitch the top backwards.
                                // We use rotateY to flare them outwards.
                                // The user specifically wants the *left edge* lifted, not a 2D rotation.
                                // A positive rotateX pitches top back. A positive rotateY swings left edge forward.
                                // Wait, the user's manual change previously had positive rotateY for left cards (`rotateY(35deg)`), which pushes the *right* edge back and *left* edge forward. 
                                // Let's combine a slight rotateX (to lean back) with the strong rotateY (to swing left edge forward/up relative to right).
                                const inlineTransform = () => {
                                    // Center card: Perfectly straight
                                    if (isCenter) return `translate3d(-50%, -45%, 150px) rotateX(0deg) rotateY(0deg) scale(1)`;

                                    // Immediate Left/Right: Pushed up and back. Left cards rotateY>0 swings left edge forward/up. Right cards rotateY<0 swings right edge forward/up.
                                    // We add a slight rotateX to enhance the 3D 'leaning back' look while keeping the edges lifted.
                                    if (isLeft1) return `translate3d(-125%, -65%, -150px) rotateX(15deg) rotateY(35deg) scale(1)`;
                                    if (isRight1) return `translate3d(25%, -65%, -150px) rotateX(15deg) rotateY(-35deg) scale(1)`;

                                    // Extreme Left/Right: Pushed further up and back. Stronger rotation.
                                    if (isLeft2) return `translate3d(-180%, -85%, -450px) rotateX(15deg) rotateY(45deg) scale(1)`;
                                    if (isRight2) return `translate3d(80%, -85%, -450px) rotateX(15deg) rotateY(-45deg) scale(1)`;

                                    // Hidden cards
                                    if (position < -2) return `translate3d(-250%, -100%, -500px) rotateX(15deg) rotateY(55deg) scale(0.8)`;
                                    if (position > 2) return `translate3d(150%, -100%, -500px) rotateX(15deg) rotateY(-55deg) scale(0.8)`;

                                    return `translate3d(-50%, -50%, -800px) scale(0.5)`;
                                };

                                return (
                                    <div
                                        key={index}
                                        className={`${baseStyle} ${aspectStyle} ${dynamicStyle}`}
                                        style={{ transform: `${inlineTransform()}`, transformStyle: 'preserve-3d' }}
                                        onClick={() => {
                                            if (position === -1 || position === -2) handlePrev();
                                            if (position === 1 || position === 2) handleNext();
                                        }}
                                    >
                                        <img src={src} alt="Graphics Example" className="w-full h-full object-cover rounded shadow-inner" style={{ display: 'block' }} onError={(e) => {
                                            e.target.src = "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/index/our_design_services_1.png";
                                        }} />
                                        <div className="absolute inset-0 border border-white/10 rounded pointer-events-none"></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Arrow (Desktop Only) */}
                        <button
                            onClick={handleNext}
                            className=" lg:flex absolute right-[5%] md:right-[20%] lg:right-[30%] z-50 bg-white hover:bg-gray-100 text-black rounded-full p-2.5 shadow-lg shadow-black/80 transition-all items-center justify-center transform top-full -translate-y-1/2 cursor-pointer border border-gray-200"
                            aria-label="Next Image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </section>

                {/* Desktop Explore Services Section - Scroll Pinned */}
                <section ref={exploreRef} className="hidden lg:block relative w-full bg-transparent mt-8 md:mt-24 lg:mt-40 " style={{ height: '400vh' }}>
                    <div className="sticky top-0 h-[100dvh] lg:h-screen w-full bg-transparent flex flex-col justify-center lg:px-24  pt-10 pb-0 lg:py-0 mx-auto text-black  relative">
                        <div className="max-w-[1440px] w-full mx-auto ">
                            <h2 className="hidden lg:block text-4xl md:text-5xl lg:text-4xl font-bold mb-10 lg:mb-8  text-center lg:text-left text-[#A75CF2]">
                                Explore Our Services
                            </h2>

                            {/* Desktop Tabs Header */}
                            <div className="hidden lg:flex space-x-8 xl:space-x-16 border-b border-gray-200 pb-4 mb-10  whitespace-nowrap">
                                {tabs.map((tab, idx) => (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabClick(idx)}
                                        className={`text-xl font-medium transition-colors duration-300 relative pb-4 
                                        ${activeTab === tab ? 'text-[#7D287E]' : 'text-black hover:text-[#D060F3]'}`}
                                    >
                                        {tab}
                                        {/* Active Tab Underline */}
                                        {activeTab === tab && (
                                            <motion.span
                                                layoutId="activeTabIndicatorDesktop"
                                                className="absolute bottom-0 left-0 w-full h-[3px] bg-[#7D287E]"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Desktop Content Grid (Shown only on lg screens) */}
                            <div className="hidden lg:flex w-full min-h-[400px] overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
                                            exit: { opacity: 0, transition: { duration: 0.2 } }
                                        }}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="w-full flex"
                                    >
                                        {/* Left Details column */}
                                        <div className="w-[30%] flex flex-col justify-start pr-8">
                                            <motion.h3 variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} className="text-2xl font-bold mb-4 leading-snug">{activeTab}</motion.h3>
                                            <motion.p variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} className="text-gray-600 mb-10 text-sm">{tabContent[activeTab]?.subtitle}</motion.p>
                                            <Link href="/enquiry-form">
                                                <motion.button variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }} className="border-2 border-[#D060F3] text-[#000] hover:bg-[#D060F3] hover:text-white rounded-full px-6 py-2 text-lg font-medium transition-all w-fit">
                                                    Enquiry Now
                                                </motion.button>
                                            </Link>
                                        </div>

                                        {/* Right Images grid */}
                                        <div className="w-[70%] grid grid-cols-3 gap-6">
                                            {tabContent[activeTab]?.images.map((src, i) => (
                                                <motion.div
                                                    key={i}
                                                    variants={{ hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } } }}
                                                    className="bg-gray-200 rounded-sm aspect-[3/4] w-full relative overflow-hidden"
                                                >
                                                    <img src={src} alt="Graphics" className="w-full h-full object-cover" />
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mobile/Tablet Stacked Sticky Explore Services */}
                <div className="lg:hidden w-full bg-transparent flex flex-col mt-32 md:mt-40 z-20 relative pt-0">
                    {tabs.map((tab, idx) => (
                        <MobileExploreCard key={tab} tabName={tab} content={tabContent[tab]} isFirst={idx === 0} />
                    ))}
                </div>

                {/* CTA Section */}
                <section className="relative py-24 px-6 md:px-12 lg:px-20 bg-[#7D287E] text-white overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left">
                        <h2 className="text-4xl md:text-4xl font-bold mb-6 leading-snug ">We combine design mastery with storytelling to ensure every graphic is strategic, scroll-stopping, and on-message.</h2>
                        <Link href="/enquiry-form">
                            <button className="bg-white text-lg text-black px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors">
                                Let's Create
                            </button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
