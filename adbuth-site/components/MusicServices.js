import { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Image from 'next/image';

export function ServicesDesktop({ services }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const slideIndex = Math.min(Math.floor(latest * 4), 3);
        setCurrentSlide(slideIndex);
    });

    return (
        <div ref={targetRef} className="relative h-[400vh] pt-20" style={{ fontFamily: "DM Sans, sans-serif" }}>
            <div className="sticky top-0 h-screen bg-[#000] overflow-hidden flex items-center">
                <div className="max-w-7xl mx-auto flex justify-around gap-24 items-center w-full px-6 md:px-20">

                    {/* Left Side: Static Text */}
                    <div className="text-white max-w-[300px]">
                        <h2 className="text-5xl md:text-6xl font-bold mb-10">Our<br />Services</h2>
                        <div className="space-y-6 text-white text-sm leading-relaxed w-[200px]">
                            <p>
                                At Adbuth Edits post production studio, we don’t just edit videos; we curate experiences. With state-of-the-art technology and a team of skilled professionals, our studio offers a comprehensive range of top-notch services. Our company provide three major services
                            </p>
                        </div>
                    </div>

                    {/* Right Side: 3D Card Slider & Dynamic Text */}
                    <div className="flex flex-col items-center justify-center w-full max-w-[650px]">

                        {/* 3D Cards Stack */}
                        <div className="relative h-[400px] w-full max-w-[600px] flex items-center justify-center perspective-1000 mb-6">

                            {/* Cards Stack */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                <AnimatePresence mode='popLayout'>
                                    {services.map((_, index) => {
                                        let offset = (index - currentSlide);
                                        const N = services.length;
                                        while (offset > N / 2) offset -= N;
                                        while (offset <= -N / 2) offset += N;

                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ scale: 0.8, opacity: 0, x: 200 }}
                                                animate={{
                                                    scale: offset === 0 ? 1 : 0.85,
                                                    opacity: offset === 0 ? 1 : (Math.abs(offset) > 1 ? 0 : 0.4),
                                                    x: offset === 0 ? 0 : (offset > 0 ? 110 : -110),
                                                    z: offset === 0 ? 100 : 0,
                                                    rotateZ: offset === 0 ? 0 : (offset > 0 ? 5 : -5),
                                                    rotateY: offset === 0 ? 0 : (offset > 0 ? -20 : 20),
                                                    zIndex: offset === 0 ? 20 : 10,
                                                    backgroundColor: "#BFBFBF",
                                                }}
                                                exit={{ scale: 0.8, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                                className={`absolute w-[300px] h-[400px] rounded-sm shadow-2xl border border-gray-400 overflow-hidden`}
                                            >
                                                {services[index]?.images && (
                                                    <Image
                                                        src={services[index].images}
                                                        alt={services[index].title || 'Service Image'}
                                                        fill
                                                        sizes="300px"
                                                        className="object-cover"
                                                    />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Dynamic Text Content */}
                        <div className="text-center max-w-lg px-6" >
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h3 className="text-3xl font-bold text-white mb-4">{services[currentSlide].title}</h3>
                                <p className="text-white text-base leading-relaxed">
                                    {services[currentSlide].desc}
                                </p>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export function ServicesMobile({ services }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const slideIndex = Math.min(Math.floor(latest * 4), 3);
        setCurrentSlide(slideIndex);
    });

    return (
        <div ref={targetRef} className="relative h-[250vh] pt-20 bg-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
            <div className="sticky top-0 h-screen bg-white overflow-hidden flex flex-col justify-center px-6 md:px-16 lg:px-24">

                {/* Header Text */}
                <div className="text-black mb-10 md:mb-16 lg:mb-24 w-full text-left">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Our<br />Services</h2>
                    <p className="text-black text-sm md:text-base leading-relaxed w-full md:max-w-full lg:max-w-md">
                        At Adbuth Edits post production studio, we don’t just edit videos; we curate experiences.
                        With state-of-the-art technology and a team of skilled professionals, our studio offers a
                        comprehensive range of top-notch services. Our company provide three major services
                    </p>
                </div>

                {/* 3D Cards Stack - Centered */}
                <div className="relative h-[400px]  w-full flex items-center justify-center perspective-1000 mb-6 md:mb-12">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <AnimatePresence mode='popLayout'>
                            {services.map((_, index) => {
                                let offset = (index - currentSlide);
                                const N = services.length;
                                while (offset > N / 2) offset -= N;
                                while (offset <= -N / 2) offset += N;

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ scale: 0.8, opacity: 0, x: 200 }}
                                        animate={{
                                            scale: offset === 0 ? 1 : 0.85,
                                            opacity: offset === 0 ? 1 : (Math.abs(offset) > 1 ? 0 : 0.4),
                                            x: offset === 0 ? 0 : (offset > 0 ? 40 : -40), // Reduced spacing for mobile width
                                            z: offset === 0 ? 100 : 0,
                                            rotateZ: offset === 0 ? 0 : (offset > 0 ? 5 : -5),
                                            rotateY: offset === 0 ? 0 : (offset > 0 ? -5 : 5),
                                            zIndex: offset === 0 ? 20 : 10,
                                            backgroundColor: "#BFBFBF",
                                        }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                        className={`absolute w-[240px] h-[320px] md:w-[320px] md:h-[420px] rounded-sm shadow-2xl border border-gray-300 overflow-hidden`}
                                    >
                                        {services[index]?.images && (
                                            <Image
                                                src={services[index].images}
                                                alt={services[index].title || 'Service Image'}
                                                fill
                                                sizes="(min-width: 768px) 320px, 240px"
                                                className="object-cover"
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Dynamic Text Content */}
                <div className="text-center w-full px-2" >
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-xl md:text-3xl font-bold text-black mb-2">{services[currentSlide].title}</h3>
                        <p className="text-black text-xs md:text-sm leading-relaxed max-w-xs md:max-w-md mx-auto">
                            {services[currentSlide].desc}
                        </p>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
