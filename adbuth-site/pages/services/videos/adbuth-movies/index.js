import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import SeoHead from '../../../../components/SeoHead';
import { cdnImage } from '../../../../utils/cdn';

const techCards = [
    {
        name: "Adbuth Vault",
        watermark: "Vault",
        subtitle: "Secure Digital Storage For Cinema Projects",
        description: "Adbuth Vault acts as a protected cloud environment where filmmakers can store, manage, and safeguard raw rushes and project assets throughout the production pipeline.",
        bg: "#595F3E",
        image: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/why-choose-us-1.webp"
    },
    {
        name: "Adbuth AirEdit",
        watermark: "AirEdit",
        subtitle: "Real-Time Cloud Collaboration",
        description: "Adbuth AirEdit enables filmmakers and teams to review and approve edits instantly through a high speed cloud workflow without downloading large files, allowing seamless collaboration from anywhere.",
        bg: "#343530",
        image: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/why-choose-us-2.webp"
    }
];

function TechCard({ card, index, total, scrollYProgress }) {
    const progressPerCard = total > 1 ? 1 / (total - 1) : 1;
    const p0 = (index - 1) * progressPerCard;
    const p1 = index * progressPerCard;
    const p2 = (index + 1) * progressPerCard;

    const isLast = index === total - 1;

    // Scale: comes from back (0.9) to front (1), then zooms out (1.3)
    const scale = useTransform(scrollYProgress, [p0, p1, p2], [0.9, 1, isLast ? 1 : 1.3]);

    // Y position: starts slightly higher (-15px) to peek out from behind, comes to front (0px), then drops down (50%)
    const y = useTransform(scrollYProgress, [p0, p1, p2], ["-15px", "0%", isLast ? "0%" : "50%"]);

    // Opacity: starts dimmed (0.5), brightens (1), stays at 1 for 70% of outgoing animation, then fades (0)
    const fadeOutStart = p1 + (p2 - p1) * 0.7;
    const opacity = useTransform(
        scrollYProgress,
        [p0, p1, fadeOutStart, p2],
        [0.5, 1, 1, isLast ? 1 : 0]
    );

    return (
        <motion.div
            style={{ scale, opacity, y, zIndex: total - index }}
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] "
        >
            <div
                className="relative flex flex-row items-stretch h-full w-full rounded-2xl overflow-hidden border border-white/5"
                style={{ backgroundColor: card.bg }}
            >
                {/* Watermark texts */}
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                    <span
                        className="absolute top-[8%] right-[45%] font-black  whitespace-nowrap opacity-[0.08] text-white"
                        style={{
                            fontSize: "clamp(40px, 6vw, 100px)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1
                        }}
                    >
                        {card.watermark}
                    </span>
                    <span
                        className="absolute top-[42%] left-[-6%] font-black  whitespace-nowrap opacity-[0.08] text-white"
                        style={{
                            fontSize: "clamp(40px, 6vw, 100px)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1
                        }}
                    >
                        {card.watermark}
                    </span>
                </div>

                {/* Left – Text content (~40%) */}
                <div className="relative z-10 flex flex-col justify-end p-10 w-[40%]">
                    <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">{card.name}</h3>
                    <p className="text-white font-semibold text-lg lg:text-xl mb-4 leading-snug">{card.subtitle}</p>
                    <p className="text-gray-300 text-sm lg:text-base leading-relaxed">{card.description}</p>
                </div>

                {/* Right – Image (60%) */}
                <div className="relative z-10 w-[60%] p-6">
                    <div className="relative w-full h-full rounded-xl overflow-hidden min-h-[300px] shadow-lg">
                        <Image
                            src={cdnImage(card.image)}
                            alt={card.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function TechPoweringMobileCarousel({ cards }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [cards.length]);

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    return (
        <div className="relative w-full pb-8">
            <div className="relative w-full h-[220px] md:h-[360px] rounded-2xl overflow-hidden">
                {cards.map((card, index) => (
                    <motion.div
                        key={index}
                        className="absolute inset-0 w-full h-full"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{
                            opacity: currentIndex === index ? 1 : 0,
                            x: currentIndex === index ? 0 : currentIndex > index ? -100 : 100,
                            zIndex: currentIndex === index ? 10 : 0
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <div
                            className="flex flex-row items-center h-full w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl"
                            style={{ backgroundColor: card.bg }}
                        >
                            {/* Watermark texts */}
                            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                                <span className="absolute top-[8%] left-[-5%] font-black whitespace-nowrap opacity-[0.08] text-white" style={{ fontSize: "50px", letterSpacing: "-0.02em", lineHeight: 1 }}>{card.watermark}</span>
                                <span className="absolute bottom-[8%] right-[-5%] font-black whitespace-nowrap opacity-[0.08] text-white" style={{ fontSize: "50px", letterSpacing: "-0.02em", lineHeight: 1 }}>{card.watermark}</span>
                            </div>

                            {/* Left Text */}
                            <div className="relative z-10 p-4 md:p-10 w-[50%] md:w-[45%] flex flex-col justify-end md:justify-end h-full">
                                <h3 className="text-[15px] md:text-3xl font-bold text-white leading-tight mb-1 md:mb-4">{card.name}</h3>

                                <p className="text-gray-300 text-[10px] md:text-sm leading-[1.3] md:leading-relaxed">{card.description}</p>
                            </div>

                            {/* Right Image */}
                            <div className="relative z-10 w-[50%] md:w-[55%] p-3 md:p-6 h-full">
                                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg bg-black/20">
                                    <Image src={cdnImage(card.image)} alt={card.name} fill className="object-cover" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-6">
                <button onClick={handlePrev} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-colors">
                    &#8592;
                </button>
                <button onClick={handleNext} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-colors">
                    &#8594;
                </button>
            </div>
        </div>
    );
}

function TechPoweringSection() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 100px", "end end"]
    });

    return (
        <section className="bg-black py-8 md:py-10 lg:py-16">
            {/* Header - Not Sticky */}
            <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-24 mb-10 lg:mb-32 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-left lg:text-center"
                >
                    <h2 className="text-[32px] md:text-5xl lg:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent inline-block uppercase leading-tight">
                        Technology<br className="lg:hidden" /> Powering<br className="hidden lg:block" /> Adbuth Movies
                    </h2>
                </motion.div>
            </div>

            {/* Desktop Scroll tracking container for cards */}
            <div
                ref={containerRef}
                className="hidden lg:block relative max-w-[1400px] mx-auto px-6 md:px-12 lg:px-24"
                style={{ height: `calc(100vh + ${(techCards.length - 1) * 100}vh)` }}
            >
                {/* Sticky Cards Container */}
                <div className="sticky top-[100px] w-full h-[550px]">
                    {techCards.map((card, i) => (
                        <TechCard
                            key={card.name}
                            card={card}
                            index={i}
                            total={techCards.length}
                            scrollYProgress={scrollYProgress}
                        />
                    ))}
                </div>
            </div>

            {/* Mobile Auto-Carousel */}
            <div className="block lg:hidden px-6 md:px-12 w-full max-w-[500px] md:max-w-none mx-auto">
                <TechPoweringMobileCarousel cards={techCards} />
            </div>
        </section>
    );
}

export default function AdbuthMovies() {

    return (
        <div className="min-h-screen font-sans text-white relative">

            <SeoHead
                title="Adbuth Movies | Crafting Cinema Beyond The Cut"
                description="At Adbuth Movies, we help filmmakers shape powerful stories through expert editing, cinematic color work, and technology-driven collaboration."
                image={cdnImage("https://assets.adbuthverse.com/website-assets/shared/placeholder.webp")}
            />
            <Navbar highlight="services" isdark={true} />

            <main className="relative pt-24 pb-20 z-10 bg-black">
                {/* Hero Section */}
                <section className="max-w-[1400px] mx-auto px-0  lg:px-24 flex flex-col lg:flex-row justify-start gap-3 h-auto lg:h-[110vh] ">

                    {/* Left Column (Content & Background) */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative w-full lg:w-[75vw] flex-0 lg:rounded-xl overflow-hidden flex flex-col justify-start lg:justify-center p-6 pt-24 pb-32 md:p-10 lg:p-20 shadow-[0_8px_40px_rgba(0,0,0,0.5)] min-h-[75vh] lg:min-h-0 lg:h-[90vh]"
                    >
                        {/* Background Image & Gradient */}
                        <div className="absolute inset-0 z-0">
                            <Image
                                src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/Untitled%20(1326%20x%20873%20px)%201.webp")}
                                alt="Hero Background"
                                fill
                                className="object-cover object-center lg:object-right "
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-6xl mx-auto lg:mx-0">
                            <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent leading-[1.4] lg:leading-[1.8] tracking-relaxed">
                                Crafting Cinema <br className="hidden lg:block" /> Beyond <br className="lg:hidden" /> The Cut
                            </h1>
                            <p className="text-sm md:text-lg lg:text-xl text-white leading-relaxed max-w-lg lg:max-w-none">
                                At Adbuth Movies, we help filmmakers shape powerful stories through expert editing, cinematic color work, and technology-driven collaboration. From rough cuts to final finishing, every frame is refined to bring the director's vision to life.
                            </p>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="pt-4"
                            >
                                <Link href="/enquiry-form">
                                    <button className="bg-[#7D287E] text-white px-8 py-4 rounded-full font-bold text-sm md:text-base hover:opacity-90 transition-opacity ">
                                        Start Your Project
                                    </button>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right Column (Image Stack) */}
                    <div className="flex flex-col gap-3 w-full px-6 lg:px-0 lg:w-[25vw] -mt-24 md:-mt-48 lg:mt-0 relative z-20 overflow-hidden">
                        <div className="flex flex-col lg:flex-col gap-3 h-full">
                            {/* Image 1 */}
                            <motion.div
                                initial={{ opacity: 0, y: -100 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.3 }}
                                whileHover={{ scale: 1.03 }}
                                className="relative w-full h-[220px] md:h-[400px] lg:h-auto lg:min-h-[230px] lg:flex-[1.5] rounded-xl lg:rounded-lg overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer"
                            >
                                <Image src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/1%2013.webp")} alt="Hero stacked image 1" fill className="object-cover" />
                            </motion.div>

                            {/* Images 2 & 3 */}
                            <div className="flex flex-row justify-center lg:flex-col gap-3 w-[100%] lg:w-full  h-[180px] md:h-[300px] lg:h-full lg:flex-[2.5]">
                                <motion.div
                                    initial={{ opacity: 0, y: -100 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.45 }}
                                    whileHover={{ scale: 1.03 }}
                                    className="relative w-[65vw] md:w-[45vw] shrink-0 lg:shrink lg:w-full h-full lg:min-h-[230px] lg:flex-[1.5] rounded-xl lg:rounded-lg overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer"
                                >
                                    <Image src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/2%2061.webp")} alt="Hero stacked image 2" fill className="object-cover" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: -100 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.6 }}
                                    whileHover={{ scale: 1.03 }}
                                    className="relative w-[65vw] md:w-[45vw] shrink-0 lg:shrink lg:w-full h-full lg:min-h-[230px] lg:flex-1 rounded-xl lg:rounded-lg overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer"
                                >
                                    <Image src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/3%2016.webp")} alt="Hero stacked image 3" fill className="object-cover" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-8 md:py-10 lg:py-16">
                    <div className="flex flex-col lg:flex-row justify-start gap-6 lg:gap-8 lg:h-[300px] mb-6 lg:mb-8 ">
                        {/* 1. Heading (Top Left) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col justify-start w-full lg:w-[30vw] shrink-0"
                        >
                            <h2 className="text-5xl lg:text-[60px] font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent leading-[1.2]">
                                WHY<br />CHOOSE<br />US
                            </h2>
                        </motion.div>

                        {/* 2. Precision Storytelling (Top Right) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover="hover"
                            className="relative group w-full h-[200px] md:h-[300px] lg:h-auto rounded-2xl lg:rounded-lg overflow-hidden cursor-pointer shadow-2xl text-black"
                        >
                            <Image
                                src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/why-choose-us-1.webp")}
                                alt="Precision Storytelling"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-6 lg:p-8 w-full">
                                <h3 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3">Precision Storytelling</h3>
                                <motion.p
                                    initial="initial"
                                    variants={{
                                        initial: { opacity: 0, height: 0, marginTop: 0 },
                                        hover: { opacity: 1, height: "auto", marginTop: 12 }
                                    }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-sm lg:text-lg leading-relaxed overflow-hidden"
                                >
                                    Every frame matters. Our editing process focuses on narrative clarity, emotional pacing, and seamless transitions to ensure the director's vision is preserved.
                                </motion.p>
                            </div>
                        </motion.div>
                    </div>
                    <div className="flex flex-row lg:flex-row justify-start gap-4 lg:gap-8 h-[220px] md:h-[300px] lg:h-[300px] text-black">
                        {/* 3. Cinematic Visual Finishing (Bottom Left) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover="hover"
                            className="relative group w-1/2 lg:w-[30vw] rounded-2xl lg:rounded-lg overflow-hidden cursor-pointer shadow-2xl"
                        >
                            <Image
                                src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/why-choose-us-2.webp")}
                                alt="Cinematic Visual Finishing"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-4 lg:p-8 w-full">
                                <h3 className="text-[15px] leading-tight lg:leading-normal lg:text-2xl font-bold mb-2">Cinematic Visual Finishing</h3>
                                <motion.p
                                    initial="initial"
                                    variants={{
                                        initial: { opacity: 0, height: 0, marginTop: 0 },
                                        hover: { opacity: 1, height: "auto", marginTop: 8 }
                                    }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-[11px] lg:text-lg leading-snug lg:leading-relaxed overflow-hidden"
                                >
                                    From color correction to advanced grading, we ensure visual consistency while creating a cinematic tone that enhances the film's mood.
                                </motion.p>
                            </div>
                        </motion.div>

                        {/* 4. Technology-Driven Workflow (Bottom Right) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover="hover"
                            className="relative group w-1/2 lg:w-[30vw] rounded-2xl lg:rounded-lg overflow-hidden cursor-pointer shadow-2xl"
                        >
                            <Image
                                src={cdnImage("https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/why-choose-us-3.webp")}
                                alt="Technology-Driven Workflow"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-4 lg:p-8 w-full text-black">
                                <h3 className="text-[15px] leading-tight lg:leading-normal lg:text-2xl font-bold mb-2">Technology-Driven Workflow</h3>
                                <motion.p
                                    initial="initial"
                                    variants={{
                                        initial: { opacity: 0, height: 0, marginTop: 0 },
                                        hover: { opacity: 1, height: "auto", marginTop: 8 }
                                    }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-[11px] lg:text-lg leading-snug lg:leading-relaxed overflow-hidden"
                                >
                                    Our proprietary tools, Adbuth Vault and Adbuth AirEdit, streamline collaboration and secure project assets throughout the post-production process.
                                </motion.p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Our Services Section */}
                <section className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-24 py-8 md:py-10 lg:py-16 bg-black">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent inline-block">
                            Our Services
                        </h2>
                    </motion.div>

                    <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 lg:grid lg:grid-cols-5 pb-4 lg:pb-0 -mx-6 px-6 md:-mx-12 md:px-12 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {[
                            {
                                title: "Movie Rough Cut",
                                description: "Bringing the director's vision to life by assembling the best takes and shaping the first narrative structure of the film.",
                                image: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/our-services-1.webp"
                            },
                            {
                                title: "Teaser & Trailer Cut",
                                description: "High-impact teasers and trailers designed to build excitement, capture attention, and leave audiences anticipating the full story.",
                                image: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/our-services-2.webp"
                            },
                            {
                                title: "Precision Editing",
                                description: "Frame-perfect editing with seamless transitions and controlled pacing to strengthen storytelling and emotional impact.",
                                image: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/our-services-3.webp"
                            },
                            {
                                title: "Color Correction",
                                description: "Balancing exposure, lighting, and skin tones to ensure visual consistency across every scene.",
                                image: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/our-services-4.webp"
                            },
                            {
                                title: "Digital Color Grading",
                                description: "Crafting a cinematic look and visual tone that enhances the film's atmosphere whether dramatic, vibrant, gritty, or vintage.",
                                image: "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-movies/our-services-5.webp"
                            }
                        ].map((service, index) => (
                            <motion.div
                                key={index}
                                initial="hidden"
                                whileInView="visible"
                                whileHover="hover"
                                viewport={{ once: true }}
                                variants={{
                                    hidden: { opacity: 0, x: 100 },
                                    visible: {
                                        opacity: 1,
                                        x: 0,
                                        transition: {
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 15,
                                            delay: index * 0.1
                                        }
                                    },
                                    hover: {
                                        scale: 1.02,
                                        transition: { duration: 0.3 }
                                    }
                                }}
                                className="relative group h-[500px] md:h-[550px] w-[75vw] md:w-[35vw] lg:w-auto shrink-0 lg:shrink rounded-xl overflow-hidden cursor-pointer shadow-2xl snap-start lg:snap-align-none"
                            >
                                <Image
                                    src={cdnImage(service.image)}
                                    alt={service.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                                <div className="absolute bottom-0 left-0 p-6 w-full z-10">
                                    <h3 className="text-xl md:text-2xl font-bold mb-0 md:mb-3 leading-tight text-white">
                                        {service.title}
                                    </h3>
                                    <p
                                        className="text-gray-200 text-sm md:text-base leading-relaxed overflow-hidden transition-all duration-300 max-h-[200px] opacity-100 mt-2 lg:max-h-0 lg:opacity-0 lg:mt-0 group-hover:lg:max-h-[200px] group-hover:lg:opacity-100 group-hover:lg:mt-3 mb-0 lg:mb-4"
                                    >
                                        {service.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Technology Powering Section */}
                <TechPoweringSection />

                {/* CTA Section */}
                <section className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-24 py-8 md:py-10 lg:py-16 bg-black">
                    <div className="bg-[#1C1C1C] rounded-[2rem] p-8 md:p-12 lg:p-20 flex flex-col items-start justify-center shadow-xl">
                        <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent uppercase tracking-wide mb-2 md:mb-4">
                            POST-PRODUCTION CONSULTING
                        </h3>
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent mb-6 md:mb-8">
                            Ready To Shape Your Film?
                        </h2>
                        <p className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-6xl mb-8 md:mb-12">
                            Beyond editing and finishing, we guide filmmakers through efficient post-production workflows, helping teams manage footage, streamline editing pipelines, and deliver projects smoothly from set to screen.
                            <br className="hidden md:block" />
                            <span className="block mt-4 md:mt-0 md:inline">Bring your story to life with cinematic editing, advanced color finishing, and technology driven collaboration.</span>
                        </p>
                        <Link href="/enquiry-form" className="w-full md:w-auto">
                            <button className="bg-[#8b3287] hover:bg-[#7a2c77] transition-colors text-white font-semibold text-sm md:text-lg px-6 md:px-10 py-3 md:py-4 rounded-full w-full md:w-auto text-center">
                                Start Your Project
                            </button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
