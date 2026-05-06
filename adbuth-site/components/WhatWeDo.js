"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ClipTypeStagger from "./creative/ClipTypeStagger";

const services = [
    {
        title: "Video Editing",
        description: "Our video-editing services team has the perfect touch to amplify your story. Whether it's a corporate video, a cinematic masterpiece, or a social media content, we tailor every edit to your unique goals ensuring complete satisfaction.",
        image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/video-editing.png",
        color: "#E1CE78",
        icons: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/video-editing-icon.svg",
        link: "/services/videos"
    },
    {
        title: "Designing",
        description: "From logos to social media creatives, our design team crafts visual identities that resonate with your audience. We blend creativity with strategy to deliver designs that stand out.",
        image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/designing.png",
        color: "#23423F",
        icons: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/designing-icon.svg",
        link: "/services/designing"
    },
    {
        title: "Learning",
        description: "We create compelling commercial advertisements that drive action. From concept to final cut, we handle everything to ensure your brand message is delivered effectively.",
        image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/commercial.png",
        color: "#442F2B",
        icons: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/commercial-icon.svg",
        link: "/services/learning"
    }
];

// Hook for window size (Optional if needed, but we rely on CSS breakpoints now mainly)
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1280);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    return isMobile;
};

// Desktop Card Component (Only for XL screens now)
const CardDesktop = ({ i, title, description, image, progress, total, color, icons, link }) => {
    const activeIndex = useTransform(progress, [0, 1], [0, total - 1]);

    const y = useTransform(activeIndex, (current) => {
        const diff = i - current;
        if (diff <= 0) return `${diff * 800}px`; // Exit
        if (current < 0.1) return `${diff * -35}px`; // Stack
        return `${diff * 800}px`; // Feed
    });

    const scale = useTransform(activeIndex, (current) => {
        const diff = i - current;
        if (current < 0.1 && diff > 0) return 1 - (diff * 0.05);
        return 1;
    });

    const opacity = useTransform(activeIndex, (current) => {
        const diff = i - current;
        if (diff <= 0) return 1;
        if (current < 0.1) return 1 - (current * 10);
        return Math.max(0, 1 - (diff * 1.2));
    });

    const zIndex = total - i;

    return (
        <Link href={link}>
            <motion.div
                style={{ y, scale, opacity, zIndex, top: `calc(50% - 250px)`, borderColor: color, willChange: 'transform, opacity' }}
                className={`absolute left-0 right-0 mx-auto w-[500px] aspect-square rounded-3xl overflow-hidden  origin-top border-[3px] cursor-pointer `}
            >
                <div className="absolute inset-0">
                    <div className="relative w-full h-full">
                        <Image
                            src={image}
                            alt={title}
                            fill
                            sizes="(max-width: 1280px) 100vw, 500px"
                            priority={i === 0}
                            className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col justify-end h-full z-10">
                    <div className="relative w-10 h-10 mb-auto">
                        <Image src={icons} fill alt="icons" className="object-contain" />
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-4 leading-tight tracking-tight">{title}</h3>
                    <p className="text-[#E0E0E0] text-base leading-relaxed opacity-90">{description}</p>
                </div>
            </motion.div>
        </Link>
    );
};

// Mobile/Tablet Card Component (Vertical Stack)
const CardMobile = ({ i, title, description, image, progress, total, color, icons, isPureMobile, link }) => {
    const activeIndex = useTransform(progress, [0, 1], [0, total - 1]);

    const y = useTransform(activeIndex, (current) => {
        const diff = i - current;
        // Using percentage (%) instead of px to keep gaps proportional to card size
        if (diff <= 0) return `${diff * 115}%`;
        if (current < 0.1) return `${diff * -3}%`; // Proportional stack
        return `${diff * 115}%`;
    });

    const scale = useTransform(activeIndex, (current) => {
        const diff = i - current;
        if (current < 0.1 && diff > 0) return 1 - (diff * 0.05);
        return 1;
    });

    const opacity = useTransform(activeIndex, (current) => {
        const diff = i - current;
        if (diff <= 0) return 1;
        if (current < 0.1) return 1 - (current * 10);
        return Math.max(0, 1 - (diff * 1.5)); // Faster fade in
    });

    const zIndex = -10 + (total - i);

    return (
        <Link href={link}>
            <motion.div
                style={{ y, scale, opacity, zIndex, top: `30px`, borderColor: color, willChange: 'transform, opacity' }} // Fixed top
                className={`absolute left-0 right-0 mx-auto  w-[98%]  aspect-square md:w-[80%]   rounded-3xl overflow-hidden  origin-top border-[3px] cursor-pointer `}
            >
                <div className="absolute inset-0">
                    <div className="relative w-full h-full">
                        <Image
                            src={image}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, 80vw"
                            priority={i === 0}
                            className="object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end h-full z-10">
                    <div className="relative w-8 h-8 md:w-10 md:h-10 mb-auto">
                        <Image src={icons} fill alt="icons" className="object-contain" />
                    </div>
                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight tracking-tight">{title}</h3>
                    <p className="text-[#E0E0E0] text-xs md:text-base leading-relaxed opacity-90">{description}</p>
                </div>
            </motion.div>
        </Link>
    );
};

const WhatWeDoDesktop = () => {
    const container = useRef(null);
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end end']
    });

    return (
        <div ref={container} className="h-[400vh] relative">
            <div className="sticky top-0 h-screen overflow-hidden">
                <div className="container mx-auto px-6 h-full">
                    <div className="grid grid-cols-2 h-full w-full gap-8">
                        <div className="flex flex-col justify-center h-full relative z-10 justify-items-center items-center bg-white">
                            <div className="max-w-lg text-left">
                                <h2 className="text-9xl font-black uppercase tracking-tighter leading-none text-black mb-6">
                                    <ClipTypeStagger mode="word" duration={0.8} stagger={0.1}>
                                        WHAT WE DO
                                    </ClipTypeStagger>
                                </h2>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    className="text-gray-800 text-lg font-medium leading-tight mb-8"
                                >
                                    At Adbuth Media works post production studio, we don’t just edit videos; we curate experiences. With state-of-the-art technology and a team of skilled professionals, our studio offers a comprehensive range of top-notch services. Our company provide three major services
                                </motion.div>
                            </div>
                        </div>
                        <div className="relative h-full flex items-center justify-start  pt-20">
                            <div className="relative w-full h-[500px] flex justify-center">
                                {services.map((service, i) => (
                                    <CardDesktop key={i} i={i} {...service} progress={scrollYProgress} total={services.length} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Hook for strictly mobile check
const useIsPureMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
};

const WhatWeDoMobile = () => {
    const container = useRef(null);
    const isPureMobile = useIsPureMobile();
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end end']
    });

    return (
        // Vertical Layout for Mobile AND Tablet
        <div ref={container} className="h-[180vh] relative">
            <div className="sticky top-0 h-screen  overflow-hidden flex flex-col items-center justify-start ">
                <div className="container mx-auto px-6 relative z-10 text-center bg-white pt-10 pb-6  md:pt-10" >
                    <h2 className="text-[6vh] md:text-7xl font-black uppercase tracking-tighter leading-none text-black mb-4">
                        <ClipTypeStagger mode="word" duration={0.8} stagger={0.1}>
                            WHAT WE DO
                        </ClipTypeStagger>
                    </h2>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-gray-800 text-sm md:text-xl font-medium leading-relaxed mb-8 max-w-md md:max-w-xl mx-auto"
                    >
                        At Adbuth Media works post production studio, we don't just edit videos; we curate experiences.
                        We provide comprehensive top-notch services tailored to your goals.
                    </motion.div>
                </div>

                {/* Card Area */}
                <div className="relative w-full flex-1 flex flex-col justify-start items-center pt-[3vh]">
                    {/* Blur Overlay */}
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none"></div>

                    <div className="relative w-full aspect-square max-w-sm flex justify-center mt-4">
                        {services.map((service, i) => (
                            <CardMobile key={i} i={i} {...service} progress={scrollYProgress} total={services.length} isPureMobile={isPureMobile} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function WhatWeDo() {
    return (
        <section className="bg-white p-6">
            <div className="hidden lg:block">
                <WhatWeDoDesktop />
            </div>
            <div className="block lg:hidden">
                <WhatWeDoMobile />
            </div>
        </section>
    );
}
