import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import SeoHead from '../../../components/SeoHead';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import useSeo from '../../../hooks/useSeo';
import Image from 'next/image';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const StickyCard = ({ item, idx }) => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"]
    });

    // Scale from 1.1 to 1 as the card moves into the sticky position
    const rawScale = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [1.15, 1, 1, 1]);

    // Add spring physics for a "jumping" or "elastic" feel
    const scale = useSpring(rawScale, {
        stiffness: 600,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            ref={targetRef}
            style={{
                zIndex: idx + 1,
                scale,
                opacity: 1
            }}
            className={`w-full rounded-[32px] overflow-hidden shadow-2xl ${item.bg} border border-white/20 sticky top-[15vh] md:top-[15vh] min-h-[350px] md:min-h-[450px] lg:min-h-[500px]`}
        >
            <div className="h-full flex md:flex-row flex-col">
                {/* Left: Content */}
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-between">
                    <div>
                        <h3 className="text-2xl md:text-4xl font-bold mb-4 text-black tracking-tight">{item.title}</h3>
                        <p className="text-lg md:text-xl text-gray-800 leading-relaxed mb-6 max-w-lg font-medium">
                            {item.desc}
                        </p>
                    </div>


                </div>

                {/* Right: Visual */}
                <div className="flex-1 relative overflow-hidden bg-white/30 m-4 rounded-2xl min-h-[300px] md:min-h-[400px]">
                    <div className="absolute inset-4 rounded-xl overflow-hidden shadow-xl border border-white/50">
                        {item.image && (
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                            />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function AdbuthLearning() {
    const { seoData } = useSeo('learning');
    const containerRef = useRef(null);
    const cardRefs = useRef([]);

    const items = [
        {
            title: "Skill Development at Scale",
            desc: "Empowering teams and creators through AI-driven tools and future-ready learning programs.",
            bg: "bg-[#E6E3FE]", //#7D287E #FCD804 #fff Lightest Purple
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/index/skill-developmaent.webp"
        },
        {
            title: "AI-Driven Workflows",
            desc: "Automate, organize, and optimize your creative assets with Adbuth DAM built for efficiency.",
            bg: "bg-[#D5D0FC]", // Mid Purple
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/index/ai-driven.webp"
        },
        {
            title: "Integrated Ecosystem",
            desc: "Seamlessly integrate Adbuth DAM with your existing tools and workflows to enhance productivity.",
            bg: "bg-[#CDC6FB]", // Darkest Purple
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/index/integrated-ecosystem.webp"
        }
    ];

    // Animation Variants (Re-used for Hero)
    const textReveal = {
        hidden: { opacity: 0, y: 50 },
        visible: (custom) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: custom * 0.2 }
        })
    };

    const slideInLeft = {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0, transition: { duration: 1, ease: "easeOut", delay: 0.5 } }
    };

    const scaleUpFade = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1, transition: { duration: 1, ease: "easeOut", delay: 0.7 } }
    };


    return (
        <div className="font-sans bg-white selection:bg-pink-500 selection:text-white" >
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Learning | Adbuth Verse"}
                description={seoData?.meta_description || seoData?.description || "Empowering teams and creators through AI-driven tools and learning programs."}
                image={seoData?.og_image || "https://assets.adbuthverse.com/website-assets/pages/services/learning/index/services-e-learning.webp"}
                data={seoData}
            />
            <Navbar highlight='services' isdark={false} />

            <main className="pt-24">
                {/* Hero Section */}
                <section className="relative pt-24 md:pt-32 pb-0 md:pb-20 px-6 md:px-12 lg:px-20 bg-[#7D287E] text-center text-white min-h-[100svh] flex flex-col justify-center">
                    {/* Main Heading */}
                    <div className="overflow-hidden mb-6">
                        <motion.h1
                            custom={0}
                            variants={textReveal}
                            initial="hidden"
                            animate="visible"
                            className="text-4xl md:text-6xl font-bold leading-tight"
                        >
                            Work Smarter. Learn Faster.<br />
                            Grow Limitlessly
                        </motion.h1>
                    </div>

                    {/* Subheading */}
                    <div className="overflow-hidden mb-12">
                        <motion.p
                            custom={1}
                            variants={textReveal}
                            initial="hidden"
                            animate="visible"
                            className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed"
                        >
                            Empowering teams and creators through AI-driven tools and future-ready learning programs.
                            From asset management to skill development everything you need to scale smartly.
                        </motion.p>
                    </div>

                    {/* CTA Button */}
                    <motion.div
                        custom={2}
                        variants={textReveal}
                        initial="hidden"
                        animate="visible"
                        className="mb-12 md:mb-20"
                    >
                        <Link href="/enquiry-form">
                            <button className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
                                Get Started Now
                            </button>
                        </Link>
                    </motion.div>

                    {/* Desktop Stats & Cards Container */}
                    <div className="max-w-7xl mx-auto hidden md:flex flex-row justify-between gap-4 md:gap-8 lg:gap-20 items-end text-left relative w-full">
                        {/* Left Column: Stat + Card */}
                        <div className="flex flex-col gap-6">
                            <motion.div custom={3} variants={textReveal} initial="hidden" animate="visible">
                                <h3 className="text-4xl md:text-5xl font-bold">1000+</h3>
                                <p className="text-gray-300">Creative Teams Onboarded</p>
                            </motion.div>
                            <motion.div variants={slideInLeft} initial="hidden" animate="visible" className="relative w-[300px] lg:w-[450px] md:w-[250px] h-[250px] lg:h-[450px] bg-gray-100 rounded-sm mt-4 flex items-end p-6 ">
                                <Image
                                    src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/creative-team-onboard.webp"
                                    alt="Creative Team Onboard"
                                    fill
                                    sizes="(max-width: 1024px) 300px, 450px"
                                    className="object-cover"
                                    priority
                                />
                                <div className="absolute -right-8 lg:bottom-1/3 bottom-1/4 text-white z-10">
                                    <Image
                                        src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/arrow-2.svg"
                                        alt="Arrow"
                                        width={100}
                                        height={100}
                                        className="w-auto h-auto"
                                    />
                                </div>
                            </motion.div>
                        </div>
                        {/* Arrow and Text Overlay */}
                        <motion.div
                            variants={scaleUpFade}
                            initial="hidden"
                            animate="visible"
                            className="w-[160px] lg:w-[240px] md:block hidden md:-ml-16  lg:-ml-36 align-self-center absolute lg:top-1/4 top-1/3 left-1/2 transform -translate-x-1/2 z-10"
                        >
                            <div className="text-8xl lg:text-9xl font-serif italic -mb-10 lg:-mb-12 -ml-4">"</div>
                            <p className="text-xs md:text-[10px] lg:text-lg leading-relaxed text-white">
                                This platform transformed my career! The courses are well-structured, and the instructors are top-notch
                            </p>
                        </motion.div>

                        {/* Right Column: Stat + Card */}
                        <div className="flex flex-col gap-6 ">
                            <motion.div custom={3} variants={textReveal} initial="hidden" animate="visible" className="md:text-right">
                                <h3 className="text-4xl md:text-5xl font-bold">250+</h3>
                                <p className="text-gray-300">Training Modules</p>
                            </motion.div>
                            <motion.div variants={slideInLeft} initial="hidden" animate="visible" className="relative w-[300px] lg:w-[450px] md:w-[250px] h-[250px] lg:h-[450px] bg-gray-100 rounded-sm mt-4 flex items-end p-6 ">
                                <Image
                                    src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/training-modules.webp"
                                    alt="Training Modules"
                                    fill
                                    sizes="(max-width: 1024px) 300px, 450px"
                                    className="object-cover"
                                    priority
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Mobile Stats & Cards Container */}
                    <div className="md:hidden flex flex-col w-full text-left mt-4 relative">
                        {/* 1000+ and Woman Image */}
                        <div className="w-full relative">
                            <motion.div custom={3} variants={textReveal} initial="hidden" animate="visible" className="mb-4">
                                <h3 className="text-[44px] font-bold text-white leading-none tracking-tighter">1000+</h3>
                                <p className="text-gray-200 text-sm mt-1">Creative Teams Onboarded</p>
                            </motion.div>

                            <div className="relative w-full">
                                <motion.div variants={slideInLeft} initial="hidden" animate="visible" className="relative w-[50%] max-w-[210px] aspect-square bg-gray-100 mt-2 z-20 shadow-xl overflow-hidden">
                                    <Image
                                        src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/creative-team-onboard.webp"
                                        alt="Creative Team Onboard"
                                        fill
                                        sizes="(max-width: 768px) 50vw, 250px"
                                        className="object-cover"

                                        priority
                                    />
                                </motion.div>

                                {/* Arrow pointing to Testimonial */}
                                <div className="absolute right-[30%] bottom-[0px] w-30 h-30 z-20">
                                    <Image
                                        src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/Arrow 3.svg"
                                        alt="Arrow"
                                        width={100}
                                        height={100}
                                        className="w-full h-full transform scale-x-[1]  opacity-90"
                                    />
                                </div>
                            </div>

                            {/* Testimonial */}
                            <motion.div variants={scaleUpFade} initial="hidden" animate="visible" className="w-[85%] self-end mt-8 ml-auto text-right z-20">
                                <p className="text-[14px] md:text-sm leading-relaxed text-gray-100 pr-2">
                                    This platform transformed my career!<br />The courses are well-structured, and<br />the instructors are top-notch
                                </p>
                            </motion.div>
                        </div>

                        {/* 250+ and Laptop section */}
                        <div className="w-[calc(100%+3rem)] -ml-6 relative  pt-8 pb-10 overflow-hidden">
                            {/* White background that covers the bottom half seamlessly */}
                            <div className="absolute bottom-0 left-0 w-full h-[65%] bg-white z-0"></div>

                            <div className="relative z-10 flex w-full items-start px-6">
                                {/* Texts */}
                                <div className="w-[30%] flex flex-col justify-center gap-2 ">
                                    <h3 className="text-[40px] font-bold text-white leading-none tracking-tighter mb-1 mt-4 relative z-20 text-shadow-md">250+</h3>

                                    <p className="text-black text-[16px] pr-2 font-semibold leading-tight relative z-20">Training<br />Modules</p>
                                </div>

                                {/* Laptop Image */}
                                <div className="w-[70%] pl-2 relative z-20">
                                    <motion.div variants={slideInLeft} initial="hidden" animate="visible" className="relative w-full aspect-[4/3.5] bg-gray-100 shadow-2xl overflow-hidden">
                                        <Image
                                            src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/training-modules.webp"
                                            alt="Training Modules"
                                            fill
                                            sizes="(max-width: 768px) 70vw, 300px"
                                            className="object-cover"
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Scale Your Business Section (Static Stack) */}
                <div className="bg-black py-20  md:py-32  px-6 md:px-12 lg:px-20 min-h-screen">
                    {/* Header */}
                    <div className="w-full max-w-7xl mx-auto mb-32 pointer-events-none text-center md:text-left">
                        <h2 className="text-5xl md:text-8xl font-bold text-white tracking-tighter leading-[1.1] mix-blend-difference">
                            <span className="md:text-5xl text-4xl tracking-tighter">Choose Innovation,<br /></span>
                            <span className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Choose Us</span>
                        </h2>
                    </div>

                    {/* Cards List (Standard Vertical Flow) */}
                    <div className="max-w-7xl mx-auto w-full flex flex-col gap-[30vh] relative">
                        {items.map((item, idx) => (
                            <StickyCard key={idx} item={item} idx={idx} />
                        ))}
                    </div>
                </div>

                {/* Our Offerings Section */}
                <section className="py-24 px-6 md:px-12 lg:px-20 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-4xl w-fit md:text-5xl font-bold mb-16 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent pb-2">Our Offerings</h2>

                        <div className="grid lg:grid-cols-2 lg:ml-16 gap-16  ">
                            {/* Card 1 */}
                            <Link href="/services/learning/adbuth-dam" className="flex flex-col group cursor-pointer block">
                                <div className="w-full aspect-[4/3] md:aspect-video lg:aspect-square lg:w-[400px] lg:h-[400px] relative mb-6 overflow-hidden">
                                    <Image
                                        src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/services-dam.webp"
                                        alt="Adbuth DAM"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-black group-hover:text-purple-700 transition-colors">Adbuth DAM</h3>
                                <p className="text-gray-500 text-base leading-relaxed max-w-lg">
                                    Centralize your digital assets with AI-powered search, workflow automation, and effortless sharing. Simplify creative collaboration like never before.
                                </p>
                            </Link>

                            {/* Card 2 */}
                            <Link href="/services/learning/adbuth-e-learning" className="flex flex-col group cursor-pointer block">
                                <div className="w-full aspect-[4/3] md:aspect-video lg:aspect-square lg:w-[400px] lg:h-[400px] relative mb-6 overflow-hidden">
                                    <Image
                                        src="https://assets.adbuthverse.com/website-assets/pages/services/learning/index/services-e-learning.webp"
                                        alt="Adbuth Learnings"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-black group-hover:text-purple-700 transition-colors">Adbuth Learnings</h3>
                                <p className="text-gray-500 text-base leading-relaxed max-w-lg">
                                    Training programs and masterclasses designed for editors, designers, and creators blending real world projects with future focused skills.
                                </p>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative py-24 px-6 md:px-12 lg:px-20 bg-[#7D287E] text-white overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready To Upgrade Your Workflow?</h2>
                        <p className="text-lg text-gray-200 mb-10 max-w-xl">
                            Join a network of creators and businesses embracing smarter systems and sharper skills.
                        </p>
                        <Link href="/enquiry-form">
                            <button className="bg-white text-lg text-black px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors">
                                Request a Demo
                            </button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
