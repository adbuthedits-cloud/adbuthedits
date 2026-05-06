import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import SeoHead from '../../../../components/SeoHead';

const DigitalInvitations = () => {
    const [activeOccasion, setActiveOccasion] = useState(0);

    const occasions = [
        {
            title: "Birthday Invitations",
            desc: "Make every year unforgettable with templates for him, her, kids, or friends from classic elegance to playful fun.",
            image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/occation-birthday-invitation.png"
        },
        {
            title: "Anniversary Invitations",
            desc: "Celebrate timeless love with beautifully crafted digital invitations for every milestone.",
            image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/occation-annivarsary-invitations.png"
        },
        {
            title: "Expression Cards",
            desc: "Say it your way love, thanks, sorry, or just because.",
            image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/occation-expression-cards.png"
        },
        {
            title: "Event Invitations",
            desc: "Professional and creative designs for any corporate or social gathering.",
            image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/occation-event-invitations.png"
        }
    ];

    const templateCategories = [
        {
            title: "Birthday Invitations",
            tagline: "Make every year unforgettable with templates for him, her, kids, or friends from classic elegance to playful fun.",
            templates: [1, 2, 3, 4]
        },
        {
            title: "Anniversary Invitations",
            tagline: "Celebrate timeless love with beautifully crafted digital invitations for every milestone.",
            templates: [1, 2, 3, 4]
        },
        {
            title: "Expression Cards",
            tagline: "Say it your way love, thanks, sorry, or just because.",
            templates: [1, 2, 3, 4]
        },
        {
            title: "Event Invitations",
            tagline: "Say it your way love, thanks, sorry, or just because.",
            templates: [1, 2, 3, 4]
        }
    ];

    return (
        <div className="bg-white min-h-screen font-sans text-gray-900">
            <SeoHead page="service-design-invitations" title="Digital Invitations | Adbuth Media Works" />

            <Navbar highlight="services" isdark={false} />

            {/* Hero Section */}
            <div className="relative w-full h-[80vh] min-h-[700px] flex flex-col items-start justify-center text-left px-4 overflow-hidden"
            >
                {/* Background */}
                <div className="mt-24 absolute inset-0 bg-[#B1B1B1]">
                    <img src="" alt="e-design hero" className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div className="lg:leading-normal relative z-10 max-w-4xl mx-24 text-white">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-semibold mb-8 mt-24 "
                    >
                        <span className='leading-[1.2]'>Your Moments</span><br />
                        <span className='leading-[1.2]'>Your Style.</span> <br />
                        <span className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent leading-[1.2]">Your Digital Invitation</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-lg text-gray-200 mb-8 max-w-2xl "
                    >
                        Custom-crafted invitations that reflect the uniqueness of your celebration.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-start justify-start gap-4"
                    >
                        <Link href="#browse" className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                            Explore Templates
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Explore By Occasion */}
            <section className="py-24 pl-24  mx-auto overflow-x-clip">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent max-w-xl">
                    Explore By Occasion
                </h2>
                <p className="text-gray-600 mb-12 text-lg">
                    Choose your moment, and we'll help you say it in style.
                </p>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-32 items-start">
                    {/* Left side: Sticky Titles and Descriptions */}
                    <div className="lg:w-[450px] lg:sticky lg:top-32">
                        <div className="flex flex-col space-y-2">
                            {occasions.map((item, idx) => (
                                <div key={idx} className="py-6 border-b border-gray-100 last:border-0">
                                    <h3
                                        className={`text-3xl font-semibold transition-all duration-500 cursor-pointer ${activeOccasion === idx ? 'text-black opacity-100' : 'text-gray-300 opacity-40'
                                            }`}
                                    >
                                        {item.title}
                                    </h3>
                                    <AnimatePresence>
                                        {activeOccasion === idx && (
                                            <motion.p
                                                initial={{ height: 0, opacity: 0, y: 10 }}
                                                animate={{ height: 'auto', opacity: 1, y: 0 }}
                                                exit={{ height: 0, opacity: 0, y: 10 }}
                                                className="text-gray-500 text-lg leading-relaxed mt-4 pr-4 overflow-hidden"
                                            >
                                                {item.desc}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right side: Scrolling Images */}
                    <div className="flex-1 space-y-32 py-32">
                        {occasions.map((item, idx) => (
                            <ScrollTriggerImage
                                key={idx}
                                item={item}
                                index={idx}
                                onInView={() => setActiveOccasion(idx)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Template Sections */}
            {
                templateCategories.map((cat, categoryIdx) => (
                    <section key={categoryIdx} className="py-20 px-6  max-w-7xl mx-auto">
                        <div className="flex flex-col mb-12">
                            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent w-fit">{cat.title}</h2>
                            <p className="text-gray-600 text-lg font-normal max-w-4xl">{cat.tagline}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {cat.templates.map((_, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02 }}
                                    className="aspect-[3/4] bg-[#C1C1C1] rounded-none overflow-hidden shadow-sm transition-all cursor-pointer relative group"
                                >
                                    {/* Placeholder styling to match image */}
                                    <div className="absolute inset-0 border-[3px] border-transparent group-first:border-[#38BDF8] transition-colors" />
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-8">
                            <Link href="/shop" className="flex items-center text-black text-sm font-semibold hover:translate-x-1 transition-transform">
                                View More <span className="ml-2 text-xs">→</span>
                            </Link>
                        </div>
                    </section>
                ))
            }

            {/* Featured Templates Marquee */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto mb-16 text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Featured Templates</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">Hundreds of ready-to-edit templates designed for every mood, every moment.</p>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Row 1 - Left to Right */}
                    <div className="relative flex overflow-hidden">
                        <motion.div
                            animate={{ x: [0, -1920] }}
                            transition={{
                                duration: 40,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="flex gap-6 whitespace-nowrap min-w-full"
                        >
                            {[...Array(10)].map((_, i) => (
                                <div key={`row1-set1-${i}`} className="w-[300px] h-[400px] bg-[#C1C1C1] flex-shrink-0" />
                            ))}
                            {[...Array(10)].map((_, i) => (
                                <div key={`row1-set2-${i}`} className="w-[300px] h-[400px] bg-[#C1C1C1] flex-shrink-0" />
                            ))}
                        </motion.div>
                    </div>

                    {/* Row 2 - Right to Left */}
                    <div className="relative flex overflow-hidden">
                        <motion.div
                            animate={{ x: [-1920, 0] }}
                            transition={{
                                duration: 40,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="flex gap-6 whitespace-nowrap min-w-full"
                        >
                            {[...Array(10)].map((_, i) => (
                                <div key={`row2-set1-${i}`} className="w-[300px] h-[400px] bg-[#C1C1C1] flex-shrink-0" />
                            ))}
                            {[...Array(10)].map((_, i) => (
                                <div key={`row2-set2-${i}`} className="w-[300px] h-[400px] bg-[#C1C1C1] flex-shrink-0" />
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Choose Adbuth */}
            <section className="py-24 px-6  max-w-7xl mx-auto">
                <div className="text-left mb-16">
                    <h2 className="text-4xl lg:text-5xl font-semibold mb-2 bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Why Choose Adbuth</h2>
                    <p className="text-gray-700 text-lg">Templates for Every Emotion</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
                    {[
                        { title: "Templates for Every Emotion", icon: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/every-emotion.svg" },
                        { title: "Instant Customization", icon: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/instant-customization.svg" },
                        { title: "Seamless Sharing", icon: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/seamless-sharing.svg" },
                        { title: "Cloud Storage & Access", icon: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/designing/adbuth-e-invitations/storage-and-access.svg" }
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className="w-24 h-24 mb-6 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                                <img src={feature.icon} alt={feature.title} className="w-full h-full object-contain" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-800 max-w-[160px] leading-snug">
                                {feature.title}
                            </h3>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-24 px-6 lg:px-24 bg-[#7D287E] ">

                <div className="relative z-10 text-left max-w-7xl mx-auto">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">
                        Start Your Invitation Journey Today!
                    </h2>
                    <p className="text-xl text-white mb-16 max-w-4xl font-normal leading-relaxed">
                        Bring your celebrations to life with digital cards that are beautiful, meaningful, and uniquely yours.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-start gap-6">
                        <Link href="/shop">
                            <button className="bg-white text-black px-12 py-5 rounded-full text-xl font-semibold hover:bg-[#b0aaaa] transition-all">
                                Explore Templates
                            </button>
                        </Link>
                    </div>
                </div>

            </section>

            <Footer />
        </div >
    );
};

const ScrollTriggerImage = ({ item, index, onInView }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, {
        margin: "-45% 0px -45% 0px",
        once: false
    });

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "start start"]
    });

    // Animation values for the image slide-in
    // Subtle slide from the right
    const opacity = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);
    const x = useTransform(scrollYProgress, [0, 1], [80, 0]); // Subtle offset
    const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

    useEffect(() => {
        if (isInView) {
            onInView();
        }
    }, [isInView]);

    return (
        <div ref={ref} className="relative aspect-[5/4] lg:aspect-[4/3] w-full ml-auto">
            <motion.div
                style={{ opacity, x, scale }}
                className="w-full h-full rounded-2xl shadow-2xl overflow-hidden shadow-black/5"
            >
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-fit object-center  transition-transform duration-700 group-hover:scale-105 rounded-2xl"
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop";
                    }}
                />

            </motion.div>
        </div>
    );
};

export default DigitalInvitations;
