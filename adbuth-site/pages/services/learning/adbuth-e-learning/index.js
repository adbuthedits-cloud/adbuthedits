import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SeoHead from '../../../../components/SeoHead';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import Image from 'next/image';
import Link from 'next/link';

// Icons using SVG directly for portability
const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

// Custom Infinite Carousel Component for Mobile/Tablet
const InfiniteCarousel = ({ children, gap = 16, cardWidth = "calc(100% - 32px)", containerClass = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 1 = right, -1 = left
    const items = React.Children.toArray(children);
    const length = items.length;

    // We clone the items to create a seamless infinite loop feel
    const renderItems = [items[length - 1], ...items, items[0]];

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + length) % length);
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <div className={`relative w-full  py-4 ${containerClass}`}>
            <div className="relative flex items-center justify-center min-h-[420px]">
                {/* Left Arrow */}
                <button
                    onClick={handlePrev}
                    className="absolute hidden  left-0 md:left-4 z-10 p-3 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-gray-700"
                    aria-label="Previous slide"
                >
                    <ChevronLeftIcon />
                </button>

                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);
                            if (swipe < -swipeConfidenceThreshold) {
                                handleNext();
                            } else if (swipe > swipeConfidenceThreshold) {
                                handlePrev();
                            }
                        }}
                        className="absolute w-full  flex justify-center md:mt-16 h-full"
                        style={{ width: cardWidth }}
                    >
                        {items[currentIndex]}
                    </motion.div>
                </AnimatePresence>

                {/* Right Arrow */}
                <button
                    onClick={handleNext}
                    className="absolute hidden right-2 md:right-4 z-10 p-3 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-gray-700"
                    aria-label="Next slide"
                >
                    <ChevronRightIcon />
                </button>
            </div>

            {/* Carousel Indicators (Dots) */}
            <div className="flex justify-center items-center gap-4 mt-4 md:mt-36">
                <div className="flex gap-2">
                    {items.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-[#7D287E]' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function AdbuthELearning() {
    const scrollToPricing = () => {
        const section = document.getElementById('pricing-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Animation Variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }
        })
    };

    // --- Data Models ---
    const learningPaths = [
        {
            title: "Design Courses",
            desc: "Master visual design tools and creative workflows.",
            points: ["Photoshop Mastery for Creators", "Canva for Content Creators & Businesses"],
            color: "#1FAF65",  // Green
            btnText: "Explore Design Courses",
            btnBorder: "border-[#1FAF65]",
            btnTextCol: "text-[#1FAF65]",
            btnHover: "hover:bg-[#1FAF65] hover:text-white",
            headAreaColor: "bg-[#1FAF65]",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/digital-course.webp"
        },
        {
            title: "Video Editing Courses",
            desc: "Build professional editing and post-production skills.",
            points: ["DaVinci Resolve (Beginner to Pro); After Effects", "Basics of Video Editing; Color Grading Essentials"],
            color: "#F6A440", // Orange
            btnText: "Explore Video Editing Courses",
            btnBorder: "border-[#F6A440]",
            btnTextCol: "text-[#F6A440]",
            btnHover: "hover:bg-[#F6A440] hover:text-white",
            headAreaColor: "bg-[#F6A440]",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/video-editing-courses.webp"
        },
        {
            title: "AI for Content Creation",
            desc: "Learn how to integrate AI into creative workflows and speed up production.",
            points: ["AI Tools for Editing & Content Creation"],
            color: "#FF66EB", // Pink
            btnText: "Explore AI Courses",
            btnBorder: "border-[#FF66EB]",
            btnTextCol: "text-[#FF66EB]",
            btnHover: "hover:bg-[#FF66EB] hover:text-white",
            headAreaColor: "bg-[#FF66EB]",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/ai-for-content-creation.webp"
        }
    ];

    const pricingData = [
        {
            category: "Design Courses",
            courses: [
                { name: "Photoshop Mastery", price: "₹4,999" },
                { name: "Canva for Creators", price: "₹2,999" }
            ]
        },
        {
            category: "Video Editing Courses",
            courses: [
                { name: "DaVinci Resolve", price: "₹7,999" },
                { name: "After Effects", price: "₹6,999" },
                { name: "Basics of Editing", price: "₹5,000" },
                { name: "Color Grading", price: "₹4,500" }
            ]
        },
        {
            category: "AI Course",
            courses: [
                { name: "AI for Content Creation", price: "₹3,999" }
            ]
        }
    ];

    const courseBundles = [
        {
            title: "Wedding Video Editor Bundle",
            desc: "Includes Basics of Editing, Resolve, Color Grading & AI Tools.",
            price: "₹14,999",
        },
        {
            title: "Content Creator Bundle",
            desc: "Includes Canva, Photoshop & AI Content Creation.",
            price: "₹8,499",
        },
        {
            title: "Pro Editor Bundle",
            desc: "Includes Resolve, After effects & Color Grading.",
            price: "₹16,999",
        },
        {
            title: "Full Access Pass",
            desc: "Unlock all 7 courses with lifetime access, earn a certificate for each course, and receive expert mentor feedback on your final projects",
            price: "₹24,999",
        },
        {
            title: "Certification",
            desc: "All courses include a Certificate of Completion. Gold Certification available upon final project submission.",
            price: "₹499 per course | Free with Full Access",
        }
    ];

    return (
        <div className="font-sans bg-[#F4F8F6] text-black overflow-x-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <SeoHead page="service-learning-e-learning" title="Adbuth Learning | The Practical Way" />
            <Navbar highlight='services' isdark={false} />

            <main className="pt-24 md:pt-24 pb-0">

                {/* HERO SECTION */}
                <section className="relative bg-[#FBF9F5] py-24 px-6 md:px-12 lg:px-24  overflow-hidden flex flex-col lg:flex-row items-start justify-between min-h-[70vh] lg:min-h-[100vh]">

                    {/* Background Abstract Shapes (Future Images Placeholders) */}
                    <div className="absolute flex flex-col gap-[2px] lg:right-[-10%] right-[-50%] lg:top-[20%] top-[40%]  z-0 pointer-events-none rotate-[-30deg] opacity-100">
                        <div className="relative w-full h-full flex  items-center gap-[2px] justify-center ">

                            {/* Round Shape */}
                            <div className="relative w-[220px] h-[220px] aspect-circle sm:w-[300px] sm:h-[300px] rounded-full  overflow-hidden">
                                <Image src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/banner-shape-1.webp" alt="Shape 1" fill sizes="(max-width: 640px) 220px, 300px" className="object-cover " />
                            </div>
                            {/* Rounded Edge Square Shape */}
                            <div className="relative w-[220px] h-[220px] aspect-square sm:w-[300px] sm:h-[300px] rounded-[40px] sm:rounded-[60px]  overflow-hidden">
                                <Image src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/banner-shape-2.webp" alt="Shape 2" fill sizes="(max-width: 640px) 220px, 300px" className="object-cover " />
                            </div>
                            {/* Round Shape */}
                            <div className="relative w-[220px] h-[220px] aspect-circle sm:w-[300px] sm:h-[300px] rounded-full overflow-hidden">
                                <Image src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/banner-shape-3.webp" alt="Shape 3" fill sizes="(max-width: 640px) 220px, 300px" className="object-cover" />
                            </div>
                        </div>
                        <div className="relative w-full h-full flex  items-center gap-[2px] justify-center ">
                            {/* Rounded Edge Square Shape */}
                            <div className="relative w-[220px] h-[220px] aspect-square sm:w-[300px] sm:h-[300px] rounded-[40px] sm:rounded-[60px]  overflow-hidden">
                                <Image src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/banner-shape-4.webp" alt="Shape 4" fill sizes="(max-width: 640px) 220px, 300px" className="object-cover" />
                            </div>
                            {/* Round Shape */}
                            <div className="relative w-[220px] h-[220px] aspect-circle sm:w-[300px] sm:h-[300px] rounded-full overflow-hidden">
                                <Image src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/banner-shape-5.webp" alt="Shape 5" fill sizes="(max-width: 640px) 220px, 300px" className="object-cover" />
                            </div>
                            {/* Rounded Edge Square Shape */}
                            <div className="relative w-[220px] h-[220px] aspect-square sm:w-[300px] sm:h-[300px] rounded-[40px] sm:rounded-[60px]  overflow-hidden">
                                <Image src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-e-learning/banner-shape-6.webp" alt="Shape 6" fill sizes="(max-width: 640px) 220px, 300px" className="object-cover" />
                            </div>
                        </div>
                    </div>


                    <div className="max-w-7xl mx-auto relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center ">
                        {/* Text Content Left */}
                        <div className="text-center lg:text-left flex flex-col items-center lg:items-start max-w-2xl mx-auto lg:mx-0">
                            <motion.h1
                                custom={0} variants={fadeInUp} initial="hidden" animate="visible"
                                className="text-[40px] leading-[1.1] md:text-5xl lg:text-5xl font-[700] text-[#141414] mb-6 md:mb-8 tracking-snug  "

                            >
                                Learn Editing,  Design &amp;<br className="hidden md:block" /> AI The  Practical Way
                            </motion.h1>

                            <motion.p
                                custom={1} variants={fadeInUp} initial="hidden" animate="visible"
                                className="text-lg md:text-[20px] text-gray-800 mb-6 max-w-[500px] font-medium leading-relaxed px-4 lg:px-0"
                            >
                                Adbuth Learning is the education vertical of Adbuth Edits, created to help aspiring creators, editors, and designers build real-world, job-ready skills.
                            </motion.p>

                            <motion.p
                                custom={2} variants={fadeInUp} initial="hidden" animate="visible"
                                className="text-lg md:text-[20px] text-gray-600  max-w-[480px] font-medium leading-relaxed px-4 lg:px-0"
                            >
                                Our courses are structured, project-based, and aligned with current industry standards so you don't just learn theory; you learn how to execute.
                            </motion.p>

                            <motion.div
                                custom={3} variants={fadeInUp} initial="hidden" animate="visible"
                            >
                                <button className="block mt-6 lg:hidden bg-[#7D287E] text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full font-bold hover:bg-[#6c236d] hover:scale-105 active:scale-95 transition-all text-sm md:text-base shadow-lg cursor-pointer z-20 relative">
                                    Request for Quote
                                </button>
                                {/* Only visible on desktop mockup "Explore Courses" btn, but mobile has "Request for quote", lets provide the exact matching layout */}
                                <div className="hidden lg:block absolute pb-4 pt-10 text-left">
                                    <button className="border border-[#7D287E] text-black px-8 py-3 rounded-full font-bold hover:bg-[#7D287E]/5 active:scale-95 transition-all text-sm">
                                        Explore Courses
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* --- CHOOSE YOUR LEARNING PATH SECTION --- */}
                <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-[#EAF3EF]">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-10 text-left lg:text-left"
                        >
                            <h2 className="text-[32px] md:text-[40px] font-semibold leading-tight text-black">
                                Choose<br className="hidden lg:block" /> Your<br className="block lg:hidden" /> Learning Path
                            </h2>
                        </motion.div>

                        {/* Mobile & Tablet View (Carousel) */}
                        <div className="block lg:hidden">
                            <InfiniteCarousel>
                                {learningPaths.map((path, idx) => (
                                    <div key={idx} className="w-full h-full flex justify-center py-2">
                                        <div className="bg-white rounded-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col w-full h-full p-[14px] mx-auto md:h-[500px] max-w-[340px] md:max-w-[480px]" >
                                            {/* Image placeholder */}
                                            <div className="w-full aspect-[4/3] rounded-[15px] mb-3 bg-[#D9D9D9] flex items-center justify-center overflow-hidden relative">
                                                {path.image ? (
                                                    <Image src={path.image} alt={path.title} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover" />
                                                ) : (
                                                    <span className="text-gray-400 text-xs font-medium">Image Placeholder</span>
                                                )}
                                            </div>

                                            {/* Content Area - Colored Box */}
                                            <div className={`py-1 px-3 flex flex-col flex-grow ${path.headAreaColor} rounded-[20px] mb-3`}>
                                                <h3 className="text-xl font-bold text-white mb-1.5">{path.title}</h3>
                                                <p className="text-white/95 text-[11px] font-medium leading-relaxed mb-1">{path.desc}</p>
                                                <ul className="text-white text-[10px] space-y-1.5 mb-1 ml-4 list-disc font-medium opacity-90">
                                                    {path.points.map((point, pIdx) => (
                                                        <li key={pIdx} className="pl-1">{point}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Bottom Button */}
                                            <div className="pb-2">
                                                <button
                                                    onClick={scrollToPricing}
                                                    className="w-full py-1 rounded-full border-2 border-transparent font-bold text-[13px] tracking-wide text-black hover:opacity-90 transition-all text-center relative overflow-hidden shadow-sm"
                                                    style={{
                                                        background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #DA3FB0, #8A2ED7, #4AB3E2) border-box'
                                                    }}
                                                >
                                                    {path.btnText}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </InfiniteCarousel>
                        </div>

                        {/* Desktop View (Grid) */}
                        <div className="hidden lg:grid grid-cols-3 gap-8 overflow-hidden py-4">
                            {learningPaths.map((path, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full hover:shadow-xl transition-all p-[14px]"
                                >
                                    {/* Image placeholder */}
                                    <div className="w-full aspect-[4/3] rounded-[28px] mb-3 bg-[#D9D9D9] flex items-center justify-center overflow-hidden relative">
                                        {path.image ? (
                                            <Image src={path.image} alt={path.title} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover" />
                                        ) : (
                                            <span className="text-gray-400 text-sm font-medium">Image Placeholder</span>
                                        )}
                                    </div>

                                    {/* Content Area - Colored Box */}
                                    <div className={`p-6 flex flex-col flex-grow ${path.headAreaColor} rounded-[20px] mb-3`}>
                                        <h3 className="text-xl font-bold text-white mb-2">{path.title}</h3>
                                        <p className="text-white/95 text-[12px] font-medium leading-relaxed mb-4">{path.desc}</p>
                                        <ul className="text-white text-[11px] space-y-2 mb-0 ml-4 list-disc font-medium opacity-90">
                                            {path.points.map((point, pIdx) => (
                                                <li key={pIdx} className="pl-1">{point}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Bottom Button */}
                                    <div className="pb-2">
                                        <button
                                            onClick={scrollToPricing}
                                            className="w-full py-4 rounded-full border-2 border-transparent font-bold text-[14px] tracking-wide text-black hover:opacity-90 transition-all text-center relative overflow-hidden shadow-sm"
                                            style={{
                                                background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #DA3FB0, #8A2ED7, #4AB3E2) border-box'
                                            }}
                                        >
                                            {path.btnText}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- OUR PRICING SECTION --- */}
                <section id="pricing-section" className="pt-16 md:pt-24 px-6 md:px-12 lg:px-24 bg-[#FBF9F5]">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-10 text-left"
                        >
                            <h2 className="text-[32px] md:text-5xl font-bold leading-tight text-black">
                                Our <br />Pricing
                            </h2>
                        </motion.div>

                        {/* Mobile & Tablet View (Carousel) */}
                        <div className="block lg:hidden">
                            <InfiniteCarousel cardWidth="calc(100% - 24px)">
                                {pricingData.map((pricing, idx) => (
                                    <div key={idx} className="w-full h-full md:h-[500px] flex justify-center pb-8 pt-4">
                                        <div className="relative bg-white rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-6 md:p-8 flex flex-col w-full h-full mx-auto overflow-hidden" style={{ maxWidth: '380px', minHeight: '340px' }}>
                                            <div className="absolute  inset-0 z-0">
                                                <Image src={learningPaths[idx]?.image} alt={pricing.category} fill className="object-cover opacity-50" />
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/60 to-white/95"></div>
                                            </div>
                                            <div className="relative z-10 flex flex-col h-full">
                                                <h3 className="text-[28px] md:text-3xl font-bold text-black mb-8 w-[70%] leading-tight">{pricing.category}</h3>
                                                <div className="space-y-3 w-full mb-auto">
                                                    {pricing.courses.map((course, cIdx) => (
                                                        <button key={cIdx} className="w-full bg-[#FBF9F5] backdrop-blur-sm border border-white hover:bg-white rounded-xl p-3.5 flex justify-between items-center text-[13px] md:text-sm shadow-md hover:shadow-lg transition-all duration-300">
                                                            <span className="font-semibold text-gray-800 text-left leading-tight pr-2">{course.name}</span>
                                                            <span className="text-gray-800 font-bold mx-2">-</span>
                                                            <span className="font-bold text-black whitespace-nowrap">{course.price}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </InfiniteCarousel>
                        </div>

                        {/* Desktop View (Grid) */}
                        <div className="hidden lg:grid grid-cols-3 gap-8 pb-10">
                            {pricingData.map((pricing, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="relative bg-white rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-8 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300 overflow-hidden aspect-square"
                                >
                                    <div className="absolute inset-0 z-0">
                                        <Image src={learningPaths[idx]?.image} alt={pricing.category} fill className="object-cover opacity-50" />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/60 to-white/95"></div>
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <h3 className="text-3xl font-bold text-black h-24 w-[70%] leading-tight">{pricing.category}</h3>
                                        <div className="space-y-3 mb-auto">
                                            {pricing.courses.map((course, cIdx) => (
                                                <button key={cIdx} className="w-full bg-white/95 backdrop-blur-sm border border-white hover:bg-white rounded-xl p-4 flex justify-between items-center text-sm shadow-md hover:shadow-lg transition-all duration-300">
                                                    <span className=" text-gray-800 text-left">{course.name}</span>
                                                    <span className="text-gray-800  mx-2">-</span>
                                                    <span className=" text-black">{course.price}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- COURSE BUNDLES SECTION --- */}
                <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 bg-[#FBF9F5]">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-8 text-left"
                        >
                            <h2 className="text-[32px] md:text-5xl font-bold leading-tight text-black">
                                Course<br className="hidden md:block" /> Bundles
                            </h2>
                        </motion.div>

                        {/* Mobile & Tablet View (Matches attached image: 2 columns with last spanning) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6 pb-10">
                            {courseBundles.map((bundle, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col justify-between hover:shadow-md transition-shadow ${idx === 4 ? 'md:col-span-2' : ''}`}
                                >
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-black mb-4 leading-tight">{bundle.title}</h3>
                                        <p className="text-gray-800 text-sm font-medium leading-relaxed">
                                            {bundle.desc}
                                        </p>
                                    </div>
                                    <button className="w-full bg-[#1FAF65] text-white py-3.5 rounded-full font-bold text-base hover:opacity-90 transition-all active:scale-95 line-clamp-1">
                                        {bundle.price}
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        {/* Desktop View (Maintains the 3+2 split requested earlier) */}
                        <div className="hidden lg:block">
                            <div className="grid grid-cols-3 gap-6 pb-6">
                                {courseBundles.slice(0, 3).map((bundle, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 40 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col justify-between hover:shadow-lg transition-all"
                                    >
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-black mb-4 leading-tight">{bundle.title}</h3>
                                            <p className="text-gray-800 text-sm font-medium leading-relaxed">
                                                {bundle.desc}
                                            </p>
                                        </div>
                                        <button className="w-full bg-[#1FAF65] text-black py-3.5 rounded-full font-bold text-base">
                                            {bundle.price}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-6 pb-10">
                                {courseBundles.slice(3).map((bundle, idx) => (
                                    <motion.div
                                        key={idx + 3}
                                        initial={{ opacity: 0, y: 40 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: (idx + 3) * 0.1 }}
                                        className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col justify-between hover:shadow-lg transition-all"
                                    >
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-black mb-4 leading-tight">{bundle.title}</h3>
                                            <p className="text-gray-800 text-sm font-medium leading-relaxed">
                                                {bundle.desc}
                                            </p>
                                        </div>
                                        <button className="w-full bg-[#1FAF65] text-black py-3.5 rounded-full font-bold text-base">
                                            {bundle.price}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- CALL TO ACTION SECTION --- */}
                <section className="bg-[#7D287E] py-20 md:py-24 px-6 md:px-12 lg:px-24">
                    <div className="max-w-7xl mx-auto flex flex-col items-start text-left">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-[32px] md:text-5xl font-bold text-white mb-4 leading-tight"
                        >
                            Start Learning<br className="md:hidden" /> Today
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-white/90 text-[13px] md:text-base mb-10 max-w-xl font-medium"
                        >
                            Build practical skills. Strengthen your portfolio. Grow your creative career.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="w-[180px] md:w-[220px]"
                        >
                            <Link href="/enquiry-form">
                                <button className="w-full bg-white text-black py-3.5 md:py-4 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg">
                                    Enroll Now
                                </button>
                            </Link>
                        </motion.div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
