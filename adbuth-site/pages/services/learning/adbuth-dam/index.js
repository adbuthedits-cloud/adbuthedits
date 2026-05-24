import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import SeoHead from '../../../../components/SeoHead';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import ScrollReveal from './ScrollReveal';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const FeatureCard = ({ feature, idx, scrollYProgress, totalFeatures }) => {
    // Calculate when THIS specific idx should be centered
    // idx 1 -> scroll 0, idx 4 -> scroll 1
    const targetScroll = (idx - 1) / (totalFeatures - 1);

    // Restored a bit of smoothness (0.12 interval) to avoid jarring pops
    const cardOpacity = useTransform(scrollYProgress,
        [targetScroll - 0.12, targetScroll, targetScroll + 0.12],
        [0.3, 1, 0.3]
    );
    const cardScale = useTransform(scrollYProgress,
        [targetScroll - 0.12, targetScroll, targetScroll + 0.12],
        [0.9, 1.05, 0.9]
    );
    const cardRotate = useTransform(scrollYProgress,
        [targetScroll - 0.12, targetScroll, targetScroll + 0.12],
        [10, 0, -10]
    );
    const cardBg = useTransform(scrollYProgress,
        [targetScroll - 0.08, targetScroll, targetScroll + 0.08],
        ["#F9FAFB", "#FFFFFF", "#F9FAFB"]
    );
    const titleColor = useTransform(scrollYProgress,
        [targetScroll - 0.08, targetScroll, targetScroll + 0.08],
        ["#111827", "#7D287E", "#111827"]
    );

    return (
        <motion.div
            style={{
                opacity: cardOpacity,
                scale: cardScale,
                rotateX: cardRotate,
                backgroundColor: cardBg
            }}
            className="p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 w-[80%] lg:max-w-[340px] md:max-w-[280px] h-[300px] flex flex-col justify-center"
        >
            <motion.div className="w-12 h-12  mb-6 flex items-center justify-center">
                <img src={feature.image} alt={feature.title} className="w-12 h-12 object-contain" />
            </motion.div>
            <motion.h3 style={{ color: titleColor }} className="text-xl md:text-2xl font-bold mb-4">{feature.title}</motion.h3>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">{feature.desc}</p>
        </motion.div>
    );
};

const AnimatedCoreFeatures = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const features = [
        {
            title: "Cloud Storage & Sync",
            desc: "Backed by secure cloud infrastructure (LucidLink / AWS / Wasabi)",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/cloud-storage.svg"
        },
        {
            title: "AI-Powered Search",
            desc: "Find any file by project, date, or even within video scenes (“find bride entry”)",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/ai.svg"
        },
        {
            title: "Version Control",
            desc: "Maintain every iteration without overwriting.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/versions.svg"
        },
        {
            title: "Collaboration Tools",
            desc: "Review, comment, and approve like Frame.io.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/collaborate.svg"
        },
        {
            title: "Permissions & Access",
            desc: "Define who sees what: clients, editors, or admins.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/permissions.svg"
        },
        {
            title: "Seamless Integrations",
            desc: "Works with Premiere Pro, DaVinci Resolve, After Effects, and more.",
            image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/integration.svg"
        }
    ];



    // For circular loop UI
    const renderFeatures = [
        features[features.length - 1], // Last card as buffer at start (idx 0)
        ...features,                  // idx 1 to length
        features[0]                   // First card as buffer at end 
    ];

    // Right side animations


    const rawY = useTransform(scrollYProgress, [0, 1], [850, -850]);
    // Re-added with moderate settings for "smoothness" without harsh double-snapping
    const springY = useSpring(rawY, { stiffness: 300, damping: 35, mass: 1 });

    useEffect(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 768px)", () => {
            const st = ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top top",
                end: "bottom bottom",
                snap: {
                    snapTo: (value) => {
                        const totalSteps = (features.length - 1) * 2; // 5 snap points per feature interval
                        const progress = value * totalSteps;
                        const currentStep = Math.floor(progress);
                        const stepFrac = progress - currentStep;

                        // 70% threshold for the NEXT step: if not past 70%, snap back to current
                        const targetStep = stepFrac >= .5 ? currentStep + 1 : currentStep;
                        return targetStep / totalSteps;
                    },
                    duration: { min: 0.1, max: 0.3 },
                    delay: 0.01,
                    ease: "power2.inOut"
                }
            });
            return () => st.kill();
        });
        return () => mm.revert();
    }, [features.length]);

    return (
        <section ref={containerRef} className="relative h-[800vh] bg-white">
            {/* Mobile Header/Description - Non-sticky */}
            <div className="md:hidden pt-20 px-6 space-y-8 relative z-20">
                <h2 className="text-[34px] font-bold text-[#7D287E] leading-tight">
                    One Centralized Hub For All Your Assets
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed font-medium">
                    Powerful storage, smarter searches, and faster workflows all in one place. Discover how Adbuth DAM transforms your creative process.
                </p>
            </div>

            <div className="sticky top-0 z-10 h-screen w-full flex items-center overflow-hidden px-6 md:px-12 lg:px-20">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20 items-center">

                    {/* Desktop Left Side: Text Content (Hidden on Mobile) */}
                    <div className="hidden md:block space-y-10 order-1">
                        <div className="relative">
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight !leading-tight text-[#7D287E] !text-left">
                                One Centralized Hub For All Your Assets
                            </h2>
                        </div>
                        <motion.p
                            className="text-lg md:text-2xl text-gray-500 max-w-xl leading-relaxed"
                        >
                            Powerful storage, smarter searches, and faster workflows all in one place. Discover how Adbuth DAM transforms your creative process.
                        </motion.p>
                    </div>

                    {/* Right Side: Vertical Stack Slider */}
                    <div className="relative h-[450px] md:h-[600px] flex items-center justify-center order-2">
                        {/* Dashed Box Indicator */}
                        <div className="absolute z-0 w-full max-w-[420px] h-[360px] border-2 border-dashed border-[#7D287E] rounded-3xl pointer-events-none" />

                        <motion.div
                            style={{ y: springY }}
                            className="relative z-10 w-full flex flex-col items-center gap-10"
                        >
                            {renderFeatures.map((feature, idx) => (
                                <FeatureCard
                                    key={idx}
                                    feature={feature}
                                    idx={idx}
                                    scrollYProgress={scrollYProgress}
                                    totalFeatures={features.length}
                                />
                            ))}
                        </motion.div>
                    </div>

                </div>
            </div>
        </section >
    );
};

const whyChooseCards = [
    { title: "Scalability That Grows With You", desc: "Whether you're managing 10 or 100 editors, Adbuth DAM keeps your workflows organized and chaos-free.", image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/scalability-the-growth.webp" },
    { title: "Smarter, Faster Workflows", desc: "Cut down 30% of time wasted searching for files -- AI tagging and smart search deliver what you need instantly.", image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/smarter-faster.webp" },
    { title: "Professional Client Experience", desc: "Impress clients with a sleek, branded portal for reviewing, downloading, and approving content effortlessly.", image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/professinal-client.webp" },
    { title: "Intelligent Asset Control", desc: "Maintain full control with permissions, version tracking, and role-based access for your entire team.", image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/intelligent-assets.webp" },
    { title: "Built for Business Growth", desc: "Turn your DAM into a revenue stream offer it as a subscription to corporates, creators, and agencies.", image: "https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/businees-growth.webp" }
];

export default function AdbuthDAM() {
    const sliderRef = useRef(null);

    // Native custom Auto-play scroll implementation with Infinite Loop (Ticker Style)
    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        // Initialize to middle of tripled list for infinite feel
        const scrollWidth = slider.scrollWidth;
        const oneThird = scrollWidth / 3;
        slider.scrollLeft = oneThird;

        let animationFrameId;
        let isPaused = false;

        const scroll = () => {
            if (!isPaused && slider) {
                slider.scrollLeft += .5; // Control speed here
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        const handleScroll = () => {
            if (!slider) return;
            const currentScroll = slider.scrollLeft;
            const width = slider.scrollWidth;
            const third = width / 3;

            if (currentScroll >= third * 2) {
                slider.scrollLeft = currentScroll - third;
            } else if (currentScroll <= 0) {
                slider.scrollLeft = third;
            }
        };

        const pause = () => isPaused = true;
        const play = () => isPaused = false;

        slider.addEventListener('scroll', handleScroll, { passive: true });
        slider.addEventListener('mouseenter', pause);
        slider.addEventListener('mouseleave', play);
        slider.addEventListener('touchstart', pause);
        slider.addEventListener('touchend', play);

        animationFrameId = requestAnimationFrame(scroll);

        return () => {
            cancelAnimationFrame(animationFrameId);
            slider.removeEventListener('scroll', handleScroll);
            slider.removeEventListener('mouseenter', pause);
            slider.removeEventListener('mouseleave', play);
            slider.removeEventListener('touchstart', pause);
            slider.removeEventListener('touchend', play);
        };
    }, []);

    // Animation Variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }
        })
    };

    const coreFeatures = [
        [
            { title: "Cloud Storage & Ease", desc: "Scalable cloud infrastructure for all your media needs." },
            { title: "AI-Powered Search", desc: "Find assets faster with automated tagging and smart indexing." },
            { title: "Version Control", desc: "Always keep track of changes and restore previous versions easily." }
        ],
        [
            { title: "Collaboration Tools", desc: "Built-in tools for review, feedback, and approvals." },
            { title: "Permissions & Access", desc: "Granular control over who can view and edit your assets." },
            { title: "Seamless Integrations", desc: "Connect with your favorite tools and workflows effortlessly." }
        ]
    ];

    return (
        <div className="font-sans bg-white text-black" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            <SeoHead page="service-learning-dam" title="Adbuth DAM | Digital Asset Management" />
            <Navbar highlight='services' isdark={false} />

            <main className='pt-24'>
                {/* Hero Section */}
                <section className="bg-[#7D287E] text-white pt-32 pb-24 md:py-24 px-6 md:px-12 lg:px-24 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-2 items-center">

                        {/* Text Content */}
                        <div className="text-center lg:text-left pr-0 lg:pr-8 flex flex-col order-1 lg:order-none">
                            <motion.h1
                                custom={0} variants={fadeInUp} initial="hidden" animate="visible"
                                className="text-4xl md:text-5xl lg:text-[45px] font-bold leading-tight mb-6 lg:mb-8"
                            >
                                Simplify, Secure, And Scale Your Media Workflow.
                            </motion.h1>
                            <motion.p
                                custom={1} variants={fadeInUp} initial="hidden" animate="visible"
                                className="text-lg md:text-xl text-gray-200 mb-2 lg:mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
                            >
                                Adbuth DAM is your centralized cloud-based system to store, manage, and access every creative asset from raw footage to final exports with AI-powered precision.
                            </motion.p>

                            {/* Desktop Buttons (Hidden on mobile) */}
                            <motion.div
                                custom={2} variants={fadeInUp} initial="hidden" animate="visible"
                                className="hidden lg:flex flex-row items-center justify-start gap-4"
                            >
                                <Link href="/enquiry-form">
                                    <button className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all hover:scale-105">
                                        Get a Quote
                                    </button>
                                </Link>

                            </motion.div>
                        </div>

                        {/* Image Content */}
                        <div className="flex justify-center lg:justify-end relative order-2 lg:order-none w-full">
                            <motion.img
                                custom={3} variants={fadeInUp} initial="hidden" animate="visible"
                                src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/dam%20banner.webp"
                                alt="Adbuth DAM Dashboard"
                                className="w-full max-w-md lg:max-w-[80%] object-contain"
                            />
                        </div>

                        {/* Mobile Buttons (Hidden on desktop, placed after image via order) */}
                        <motion.div
                            custom={4} variants={fadeInUp} initial="hidden" animate="visible"
                            className="flex lg:hidden flex-col items-center justify-center gap-4 w-full max-w-xs mx-auto mt-4 order-3 lg:order-none"
                        >
                            <Link href="/enquiry-form" className="w-full">
                                <button className="bg-white text-black px-8 py-3.5 rounded-full font-bold w-full active:scale-95 transition-all text-lg border border-transparent">
                                    Get a Quote
                                </button>
                            </Link>
                            <Link href="/enquiry-form" className="w-full">
                                <button className="border-2 border-white text-white px-8 py-3.5 rounded-full font-bold w-full active:scale-95 transition-all text-lg bg-transparent">
                                    Request for Quote
                                </button>
                            </Link>
                        </motion.div>

                    </div>
                </section>

                {/* What is Adbuth DAM Section */}
                <section className="pt-24  md:pt-24 px-6 md:px-12 lg:px-20 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-start md:items-end">
                            {/* Title and Description 1 */}
                            <div className="w-full md:col-span-2 order-1">
                                <motion.h2
                                    initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                    className="text-[32px] md:text-5xl font-bold mb-6 md:mb-12 text-black"
                                >
                                    What Is Adbuth DAM?
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                                    className="text-lg md:text-[22px] md:leading-relaxed text-gray-900 font-medium max-w-3xl pr-0 md:pr-10"
                                >
                                    Your creative powerhouse, reimagined for efficiency. Instead of juggling drives, random folders, or endless links, Adbuth DAM gives you one secure, searchable hub for all media assets videos, graphics, audio, and project files.
                                </motion.p>
                            </div>

                            {/* Description 2 */}
                            <div className="md:text-left text-gray-800 text-base md:text-base font-medium max-w-sm w-full order-3 md:order-2">
                                <p className="leading-relaxed">
                                    Think of it as <br className="hidden md:block" />
                                    Google Drive + Frame.io + LucidLink + AI Search,<br />
                                    tailored exclusively for creative teams.
                                </p>
                            </div>

                            {/* Image */}
                            <div className="w-full md:col-span-3 order-2 md:order-3 mt-4 md:mt-0">
                                <motion.img
                                    initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    src="https://assets.adbuthverse.com/website-assets/pages/services/learning/adbuth-dam/what-adbuth-dam.webp"
                                    alt="What is Adbuth DAM Dashboard"
                                    className="w-full object-cover rounded shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Adbuth DAM Section */}
                <section className="pt-24 lg:py-24  px-6 md:px-12 lg:px-20 bg-gray-50/30 overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-16">
                            <motion.h2
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="text-3xl md:text-5xl font-bold mb-4"
                            >
                                Why Choose Adbuth DAM
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                                className="text-xl text-gray-500"
                            >
                                Scalable, Smart, Secure, Simplified.
                            </motion.p>
                        </div>

                        {/* Mobile & Tablet Slider */}
                        <div className="block lg:hidden mt-8 -mx-6 md:-mx-12 relative overflow-hidden">
                            <div
                                ref={sliderRef}
                                className="w-full flex overflow-x-auto gap-4 pb-8 scrollbar-hide px-6 md:px-12"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                {/* Triple cards for infinite loop illusion */}
                                {[...whyChooseCards, ...whyChooseCards, ...whyChooseCards].map((card, idx) => (
                                    <div
                                        key={`mobile-card-${idx}`}
                                        className="shrink-0 w-[85%] sm:w-[45%]"
                                    >
                                        <div className="relative bg-black p-6 min-h-[350px] flex flex-col justify-end overflow-hidden group border border-gray-800 shadow-sm rounded-sm h-full">
                                            <img src={card.image} alt={card.title} className="absolute inset-0 w-full h-full object-cover opacity-80 z-0" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 pointer-events-none"></div>
                                            <div className="relative z-20 mt-auto">
                                                <h3 className="text-xl font-bold mb-2 text-white leading-tight">{card.title}</h3>
                                                <p className="text-gray-300 text-sm leading-relaxed font-medium line-clamp-3">{card.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Grid Layout */}
                        <div className="hidden lg:grid grid-cols-6 gap-6 mt-8">
                            {/* Top Row: 3 Cards */}
                            {whyChooseCards.slice(0, 3).map((card, idx) => (
                                <motion.div
                                    key={`desktop-card-${idx}`}
                                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                                    className="relative bg-black p-8 min-h-[350px] xl:min-h-[380px] flex flex-col justify-end overflow-hidden group border border-gray-800 col-span-2 shadow-sm rounded-sm  object-cover"
                                >
                                    <img src={card.image} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 z-0" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 pointer-events-none"></div>
                                    <div className="relative z-20 mt-auto">
                                        <h3 className="text-xl xl:text-xl font-bold mb-3 text-white leading-tight">{card.title}</h3>
                                        <p className="text-gray-300 text-sm leading-relaxed font-medium line-clamp-2 ">{card.desc}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Bottom Row: 2 Cards */}
                            {whyChooseCards.slice(3, 5).map((card, idx) => (
                                <motion.div
                                    key={`desktop-card-${idx + 3}`}
                                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: (idx + 3) * 0.1 }}
                                    className="relative bg-black p-8 lg:min-h-[400px] xl:min-h-[380px] flex flex-col justify-end overflow-hidden group border border-gray-800 col-span-3 shadow-sm rounded-sm  object-cover"
                                >
                                    <img src={card.image} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 z-0" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 pointer-events-none"></div>
                                    <div className="relative z-20 mt-auto">
                                        <h3 className="text-xl xl:text-xl font-bold mb-3 text-white leading-tight">{card.title}</h3>
                                        <p className="text-gray-300 text-sm leading-relaxed font-medium max-w-md">{card.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Advanced Core Features Section */}
                <AnimatedCoreFeatures />

                {/* CTA Section */}
                <section className="relative py-24 px-6 md:px-12 lg:px-20 bg-[#7D287E] text-white overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10 text-left">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to transform your workflow?</h2>
                        <p className="text-lg text-gray-200 mb-10 max-w-xl">
                            Empower your team with Adbuth DAM where creative efficiency meets intelligent organization.
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
