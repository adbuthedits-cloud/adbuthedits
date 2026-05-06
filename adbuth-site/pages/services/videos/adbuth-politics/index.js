import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SeoHead from '../../../../components/SeoHead';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faChevronLeft, faChevronRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import useSeo from '../../../../hooks/useSeo';

export default function AdbuthPolitics() {
    const { seoData } = useSeo('adbuth-politics');
    const [isMobile, setIsMobile] = useState(false);
    const [currentService, setCurrentService] = useState(0);

    const servicesList = [
        {
            title: "Political Campaign Films",
            desc: "From campaign launch videos to manifesto explainers. We create high-impact films that showcase your leadership vision, party values, and achievements designed to emotionally engage and energize supporters. Perfect for rallies, social media, and TV ads.",
            image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-politics/Political%20Campaign%20Films.png"
        },
        {
            title: "Constituency Videos",
            desc: "Every voter wants to know what their leader does. Our constituency videos highlight ground-level development, public interactions, and your role in driving change within the community. These videos strengthen your local reputation and help you stay connected with your people regularly.",
            image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-politics/Constituency%20Videos.png"
        }
    ];

    const nextService = () => setCurrentService((prev) => (prev + 1) % servicesList.length);
    const prevService = () => setCurrentService((prev) => (prev - 1 + servicesList.length) % servicesList.length);

    // Scroll Animation Setup for Desktop/Tablet Cards
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Smooth vertical staggered movement based on scroll
    const y1 = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const y2 = useTransform(scrollYProgress, [0, 1], [100, -100]);

    useEffect(() => {
        const handleResize = () => {
            // Using 1024px to cover mobile and tablet
            setIsMobile(window.innerWidth < 1024);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="font-sans bg-white text-black overflow-x-hidden">
            {/* Custom Header & Hero Section */}
            <div className="relative bg-white">
                <SeoHead
                    title={seoData?.meta_title || seoData?.title || "Adbuth Politics | Political Campaign Services"}
                    description={seoData?.meta_description || seoData?.description || "Shaping narratives and winning hearts with powerful political videos."}
                    image={seoData?.og_image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/shop/shop-banner.png"}
                    data={seoData}
                />
                <Navbar highlight="services" isdark={!isMobile} />

                {/* Split Background Layer */}
                <div className="absolute inset-0 flex h-[870px]">
                    <div className="w-[40%] bg-white hidden md:block "></div>
                    <div className="w-[60%] bg-[#7D287E] hidden md:block"></div>
                </div>

                {/* Hero Content Card */}
                <div className="relative z-10 w-full md:w-[80%] lg:w-3/4 lg:ml-24 md:px-6 md:pt-32 pt-24 pb-24">
                    <div className="relative  overflow-visible h-[600px]  flex flex-col md:justify-end justify-start items-center md:items-start">
                        {/* Main Hero Image Background */}
                        <div className="absolute inset-0 overflow-hidden">
                            {/* Placeholder for Crowd Image */}
                            <div className="w-full h-full blur-sm  bg-[url('https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/shop/shop-banner.png')] bg-cover bg-center"></div>
                            <div className="absolute inset-0 bg-black/40"></div>
                        </div>

                        <div className="relative z-10 pt-12 md:p-8 lg:p-16 max-w-4xl">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <h1 className="hidden md:block  md:w-full md:mx-0 md:text-4xl font-bold text-white mb-6 leading-tight text-center md:text-left">
                                    Shaping Narratives,
                                    Winning Hearts.
                                </h1>
                                <h1 className='block md:hidden w-[80%] text-[38px] mx-auto font-bold mb-6 leading-tight text-center  bg-gradient-to-r from-[#AE52FF] to-[#E188E2] w-fit bg-clip-text text-transparent'>
                                    Shaping Narratives,
                                    Winning Hearts.
                                </h1>
                                <p className="lg:text-lg text-sm w-[80%] md:w-full mx-auto md:mx-0 text-gray-200 mb-10 max-w-2xl leading-relaxed text-center md:text-left">
                                    At Adbuth Politics, we create powerful political videos that influence, inspire, and mobilize. From campaign films to constituency storytelling, we help leaders connect with people at scale.
                                </p>
                                <Link href="/enquiry-form">
                                    <button className="bg-[#7D287E] text-white md:text-black md:bg-white mx-auto md:mx-0 block md:inline-block px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                                        Request for Quote
                                    </button>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Overlapping Gray Box */}
                        <div className=" absolute md:top-24 md:-right-28 lg:-right-44 -bottom-28 right-[50%] md:bottom-0 translate-x-1/2 md:translate-x-0 lg:w-[350px] lg:h-[400px] md:w-[250px] md:h-[300px] w-[200px] h-[250px] bg-gray-400 shadow-2xl overflow-hidden">
                            <Image
                                src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-politics/adbuth-politics-hero-image.png"
                                alt="Adbuth Politics Hero"
                                fill
                                priority
                                sizes="350px"
                                className="object-cover object-center "
                            />
                        </div>
                    </div>
                </div>
            </div>

            <main>
                {/* Why Political Videos Matter Section */}
                <section className="py-16 md:py-24 px-6 md:px-24 bg-white">
                    <div className="max-w-6xl mx-auto flex flex-col md:grid lg:grid-cols-2 gap-10 md:gap-16 items-start">
                        {/* Text Content */}
                        <div className="w-full  lg:order-2">
                            <h2 className="text-[32px] md:text-4xl font-bold text-black mb-0 leading-[1.1] tracking-tight text-left">Why Political</h2>
                            <h2 className="text-[32px] md:text-4xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] w-fit bg-clip-text text-transparent mb-6 tracking-tight text-left">Videos Matter</h2>
                            <p className="text-black text-[15px] md:text-base font-medium mb-4 leading-relaxed max-w-xl text-left">
                                In today's fast moving digital and TV driven world, a compelling video is one of the strongest tools for any political leader.
                            </p>

                            <p className="text-black text-[15px] md:text-base font-bold mb-3 text-left">It can:</p>
                            <ul className="space-y-3 text-black text-[15px] md:text-base max-w-xl text-left">
                                <li className="flex items-start gap-3">
                                    <span className="text-[#A238A3] mt-1.5 text-[10px]"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CircleIcon" className="w-3 h-3 fill-current"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z"></path></svg></span>
                                    <span className="leading-[1.4] font-medium text-black">Showcase your vision and promises with clarity.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#A238A3] mt-1.5 text-[10px]"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CircleIcon" className="w-3 h-3 fill-current"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z"></path></svg></span>
                                    <span className="leading-[1.4] font-medium text-black">Build credibility and trust among voters.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#A238A3] mt-1.5 text-[10px]"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CircleIcon" className="w-3 h-3 fill-current"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z"></path></svg></span>
                                    <span className="leading-[1.4] font-medium text-black">Connect emotionally with diverse audiences.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#A238A3] mt-1.5 text-[10px]"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CircleIcon" className="w-3 h-3 fill-current"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z"></path></svg></span>
                                    <span className="leading-[1.4] font-medium text-black">Amplify your reach across television, social media, and local events.</span>
                                </li>
                            </ul>

                            <p className="mt-6 text-[15px] md:text-base text-black font-medium leading-[1.4] max-w-xl text-left">
                                At Adbuth Politics, we combine storytelling, strategic messaging, and cinematic editing to ensure your voice resonates with every voter.
                            </p>
                        </div>

                        {/* Staggered Masonry Images (2 Columns) */}
                        <div className="w-full max-w-[360px] mx-auto md:max-w-none md:mx-0  lg:order-1 mt-4 md:mt-0 grid grid-cols-2 gap-2 md:gap-4 items-start ">
                            {/* Left Column */}
                            <div className="flex flex-col gap-2 md:gap-4 mt-8 md:mt-12">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="overflow-hidden w-full aspect-square"
                                >
                                    <Image src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-politics/why-politics-1.png" alt="Political Rally" width={400} height={400} className="object-cover w-full h-full border-[6px] border-white shadow-sm" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="overflow-hidden w-full aspect-square"
                                >
                                    <Image src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-politics/why-politics-3.png" alt="Crowd Action" width={400} height={400} className="object-cover w-full h-full border-[6px] border-white shadow-sm" />
                                </motion.div>
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col gap-2 md:gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="overflow-hidden w-full aspect-square"
                                >
                                    <Image src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-politics/why-politics-2.png" alt="Digital Reach" width={400} height={400} className="object-cover w-full h-full border-[6px] border-white shadow-sm" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    className="overflow-hidden w-full aspect-square"
                                >
                                    <Image src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-politics/why-politics-4.png" alt="Government Building" width={400} height={400} className="object-cover w-full h-full border-[6px] border-white shadow-sm" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Services Section */}
                <section ref={containerRef} className="py-24 px-6 md:px-24 bg-white overflow-hidden">
                    <h2 className="text-4xl font-bold mb-16 text-center md:text-left">Our Services</h2>

                    {/* Mobile Carousel View */}
                    <div className="block md:hidden max-w-[360px] mx-auto relative cursor-grab active:cursor-grabbing">
                        {/* Left Arrow - Positioned absolutely to the left of the image */}
                        <button
                            onClick={prevService}
                            className="absolute left-0 top-[175px] z-10 -translate-y-1/2 w-10 h-10 bg-[#7D287E] text-white flex items-center justify-center hover:bg-purple-800 transition-colors shadow-md"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>

                        {/* Right Arrow - Positioned absolutely to the right of the image */}
                        <button
                            onClick={nextService}
                            className="absolute right-0 top-[175px] z-10 -translate-y-1/2 w-10 h-10 bg-[#7D287E] text-white flex items-center justify-center hover:bg-purple-800 transition-colors shadow-md"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>

                        <motion.div
                            key={currentService}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ y: y1 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset }) => {
                                if (offset.x < -50) {
                                    nextService();
                                } else if (offset.x > 50) {
                                    prevService();
                                }
                            }}
                            className="text-center group px-12"
                        >
                            <div className="h-[350px] w-full max-w-[280px] mx-auto bg-gray-200 mb-6 overflow-hidden relative shadow-sm">
                                <Image
                                    src={servicesList[currentService].image}
                                    alt={servicesList[currentService].title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 280px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">{servicesList[currentService].title}</h3>
                            <p className="text-[#7D287E] text-sm max-w-sm mx-auto leading-relaxed">
                                {servicesList[currentService].desc}
                            </p>
                        </motion.div>

                        {/* Carousel Indicators */}
                        <div className="flex justify-center items-center gap-2 mt-6">
                            {servicesList.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 transition-all duration-300 ${idx === currentService ? 'w-6 bg-[#7D287E]' : 'w-2 bg-gray-300'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Tablet & Desktop Grid View with Parallax Scroll */}
                    <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto mt-12 md:mt-0">
                        {servicesList.map((service, idx) => (
                            <motion.div
                                key={idx}
                                style={{ y: idx % 2 === 0 ? y1 : y2 }}
                                className="text-center group cursor-pointer"
                            >
                                <div className="h-[400px] w-[300px] md:h-[300px] md:w-[240px] lg:h-[400px] lg:w-[300px] mx-auto bg-gray-200 mb-6 overflow-hidden relative shadow-sm">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        sizes="(max-width: 1024px) 240px, 300px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="text-2xl md:text-xl lg:text-2xl font-bold mb-3">{service.title}</h3>
                                <p className="text-[#7D287E] text-sm md:text-xs lg:text-sm max-w-sm mx-auto leading-relaxed">
                                    {service.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="py-28 px-6 md:px-24 bg-[#7D287E]">
                    <div className="max-w-4xl">
                        <h2 className="text-4xl font-bold mb-2 text-white">Your Story Deserves The Spotlight</h2>
                        <h2 className="text-4xl font-bold mb-8 text-white">Let's Tell It With Impact.</h2>

                        <Link href="/enquiry-form">
                            <button className="bg-white text-black px-10 py-4 font-bold text-lg shadow-lg hover:bg-gray-100 transition-colors">
                                Request for Quote
                            </button>
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
