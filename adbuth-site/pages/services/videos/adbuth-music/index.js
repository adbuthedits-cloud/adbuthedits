import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { motion } from 'framer-motion';
import { ServicesDesktop, ServicesMobile } from '../../../../components/MusicServices';
import SeoHead from '../../../../components/SeoHead';
import useSeo from '../../../../hooks/useSeo';

export default function AdbuthMusic() {
    const { seoData } = useSeo('adbuth-music');
    const services = [
        {
            title: "Original Music",
            desc: "Powered by creativity and AI-assisted tools, we compose tracks that are unique, dynamic, and perfectly tuned to your vision. From cinematic scores to contemporary beats, your project gets a soundtrack that truly stands out.",
            images: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/original-music.png"
        },
        {
            title: "Jingles",
            desc: "Memorable, catchy, and designed to hook listeners instantly. Our AI-enhanced process ensures every jingle hits the right emotional note, perfect for ads, podcasts, and campaigns.",
            images: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/jingles.png"
        },
        {
            title: "Voiceovers",
            desc: "Professional, expressive, and AI-optimized for clarity and tone. Whether it's narration, storytelling, or brand messaging, we deliver voiceovers that connect instantly with your audience.",
            images: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/voiceovers.png"
        },
        {
            title: "Background Music (BGM)",
            desc: "Set the mood, drive the rhythm, and amplify your visuals. Using AI-assisted audio design, our BGMs seamlessly adapt to your content, enhancing every scene, every frame, every moment.",
            images: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/background-music.png"
        }
    ];

    return (
        <div className="bg-[#000] min-h-screen font-sans selection:bg-pink-500 selection:text-white" >
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Adbuth Music Services"}
                description={seoData?.meta_description || seoData?.description || "Compose, Create, Captivate with our original music services."}
                image={seoData?.og_image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/music-banner.png"}
                data={seoData}
            />
            <Navbar isdark={true} />

            {/* Hero Section */}
            <section className="relative h-[70vh] md:h-[100vh] flex items-center justify-center overflow-hidden" style={{ fontFamily: "DM Sans, sans-serif" }}>
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center z-0 opacity-70"
                    style={{ backgroundImage: "url('https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/music-banner.png')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0118]/30 via-transparent to-[#0a0118]"></div>
                </div>

                <div className="relative z-10 text-center px-4  mx-auto mt-18 ">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent"
                    >
                        Compose.  Create.  Captivate.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto"
                    >
                        Let Your Sound Take Center Stage.<br />
                        We fuse music, creativity, and AI to craft audio that inspires and elevates.
                    </motion.p>
                    <Link href="/enquiry-form">
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-[#7D287E] hover:bg-[#a02cb8] text-white px-8 py-3 rounded-full font-semibold transition-all "
                        >
                            Lets Create Now
                        </motion.button>
                    </Link>
                </div>
            </section>

            {/* Infinite Marquee "Vibe Elevated" */}
            <div className="overflow-hidden h-[150px] md:h-[250px] absolute bottom-52 md:-bottom-24  w-full z-20">
                <div className="relative  top-12 md:top-24 left-0 py-8 md:py-12 z-20  md:bg-[#7D287E85] bg-[#7D287E80] w-full " style={{ fontFamily: "DM Sans, sans-serif" }}>
                </div>

                <div className="relative py-4 md:py-8 -mt-36 w-[110%] top-32 -left-6 z-20 overflow-hidden transform -rotate-[3deg] bg-[#7D287E]">

                    <div className="flex whitespace-nowrap overflow-hidden">
                        <motion.div
                            className="flex"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                        >
                            {[...Array(20)].map((_, i) => (
                                <span
                                    key={i}
                                    className="text-2xl md:text-5xl font-black 
                                    mx-8 flex-shrink-0 text-stroke-responsive"
                                    style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        color: "transparent"
                                    }}
                                >
                                    Vibe Elevated
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Services Section (Sticky Scroll) */}
            <div className="hidden lg:block">
                <ServicesDesktop services={services} />
            </div>
            <div className="block lg:hidden">
                <ServicesMobile services={services} />
            </div>

            {/* Why Choose Us */}
            <section className="py-20 md:bg-black bg-white md:text-white text-black overflow-hidden" style={{ fontFamily: "DM Sans, sans-serif" }}>
                <div className="max-w-6xl mx-auto mb-16 px-6 md:px-16 text-left md:text-left">
                    <h2 className="text-5xl md:text-5xl font-bold mb-6 ">Why<br />Choose <span className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Us</span></h2>
                    <p className="md:text-gray-400 text-black mb-8 max-w-xl text-lg">
                        At Adbuth Music, every note is crafted with intention. We blend creativity, technical excellence, and modern production tools to deliver music that elevates your story.
                    </p>
                </div>

                {/* Infinite Slider for Icons */}
                <div className="relative w-full">
                    <div className="flex w-full overflow-hidden mask-gradient-sides">
                        {/* We duplicate the array 3 times to ensure smooth infinite loop on wide screens */}
                        <motion.div
                            className="flex gap-10 items-start"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                        >
                            {[...[
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/industry-grade-sound-quality.svg', title: "Industry-Grade Sound Quality", description: "From composition to mastering, our audio workflow matches broadcast and cinematic standards." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/ai-enhanced-precision.svg', title: "AI-Enhanced Precision", description: "We integrate smart tools to speed up production and elevate clarity without losing the human touch." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/genre-versatile-composers.svg', title: "Genre-Versatile Composers", description: "Whether you need emotional orchestral scores, catchy jingles, or upbeat commercial music. We match any style, any tone." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/one-stop-audio-production.svg', title: "One-Stop Audio Production Studio", description: "Music composition, jingles, voiceovers, BGM, SFX and everything handled in house for seamless delivery." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/custom-crafted-sound.svg', title: "100% Custom Crafted Sound", description: "Every piece we create is original, unique, and tailored exclusively to your project and audience." }
                            ], ...[
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/industry-grade-sound-quality.svg', title: "Industry-Grade Sound Quality", description: "From composition to mastering, our audio workflow matches broadcast and cinematic standards." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/ai-enhanced-precision.svg', title: "AI-Enhanced Precision", description: "We integrate smart tools to speed up production and elevate clarity without losing the human touch." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/genre-versatile-composers.svg', title: "Genre-Versatile Composers", description: "Whether you need emotional orchestral scores, catchy jingles, or upbeat commercial music. We match any style, any tone." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/one-stop-audio-production.svg', title: "One-Stop Audio Production Studio", description: "Music composition, jingles, voiceovers, BGM, SFX and everything handled in house for seamless delivery." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/custom-crafted-sound.svg', title: "100% Custom Crafted Sound", description: "Every piece we create is original, unique, and tailored exclusively to your project and audience." }
                            ], ...[
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/industry-grade-sound-quality.svg', title: "Industry-Grade Sound Quality", description: "From composition to mastering, our audio workflow matches broadcast and cinematic standards." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/ai-enhanced-precision.svg', title: "AI-Enhanced Precision", description: "We integrate smart tools to speed up production and elevate clarity without losing the human touch." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/genre-versatile-composers.svg', title: "Genre-Versatile Composers", description: "Whether you need emotional orchestral scores, catchy jingles, or upbeat commercial music. We match any style, any tone." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/one-stop-audio-production.svg', title: "One-Stop Audio Production Studio", description: "Music composition, jingles, voiceovers, BGM, SFX and everything handled in house for seamless delivery." },
                                { icon: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/custom-crafted-sound.svg', title: "100% Custom Crafted Sound", description: "Every piece we create is original, unique, and tailored exclusively to your project and audience." }
                            ]].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center min-w-[180px]">
                                    <div className=" h-12 w-12 flex items-center justify-center mb-6  ">
                                        <img src={item.icon} alt={item.title} className='w-full h-full object-contain' />
                                    </div>
                                    <h3 className="font-bold text-sm md:text-base mb-2 max-w-[150px] leading-tight md:text-white text-black">{item.title}</h3>
                                    <p className="text-[10px] md:text-xs md:text-gray-400 text-black max-w-[160px]">{item.description}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 px-6 md:px-20 overflow-hidden" style={{ fontFamily: "DM Sans, sans-serif" }}>
                <div
                    className="absolute inset-0 bg-cover bg-center "
                    style={{ backgroundImage: "url('https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-music/sound-to-life.png')" }}
                >

                </div>


                <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 text-left">
                    <div className="max-w-2xl">
                        {/* Desktop Version */}
                        <div className="hidden lg:block">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Ready To Bring <br /> Your Sound To <span className="text-[#E188E2]">Life?</span></h2>
                            <p className="text-gray-300 text-lg mb-10 max-w-lg">
                                Let's craft music that elevates your brand, enhances your visuals, and creates a lasting emotional connection with your audience.
                            </p>
                            <Link href="/enquiry-form">
                                <button className="bg-white hover:bg-gray-100 text-black px-10 py-4 text-lg  font-bold transition-all transform hover:scale-105 shadow-lg">
                                    Start Your Music Project
                                </button>
                            </Link>
                        </div>

                        {/* Mobile and Tablet Version */}
                        <div className="block lg:hidden">
                            <h2 className="text-4xl md:text-5xl font-bold text-[#E188E2] mb-4 leading-tight">
                                Ready To Bring Your <br /> Sound To Life?
                            </h2>
                            <p className="text-gray-200 text-base md:text-lg mb-8 max-w-lg">
                                Let Your Sound Take Center Stage.<br /> We fuse music, creativity, and AI to craft audio that inspires and elevates.
                            </p>
                            <Link href="/enquiry-form">
                                <button className="bg-[#8A2B93] hover:bg-[#a02cb8] text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg">
                                    Start Your Music Project
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
            <style jsx>{`
                .text-stroke-responsive {
                    -webkit-text-stroke: 0.5px white;
                }
                @media (min-width: 768px) {
                    .text-stroke-responsive {
                        -webkit-text-stroke: 1px white;
                    }
                }
                .font-outline-2 {
                    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.5);
                }
                .mask-gradient-sides {
                    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                }
            `}</style>
        </div>
    );
}
