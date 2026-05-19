import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SeoHead from '../../../components/SeoHead';
import useSeo from '../../../hooks/useSeo';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faChevronDown, faChevronUp, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';

const videoServices = [
    {
        id: 'adbuth-edits',
        title: 'Adbuth Edits',
        subtitle: 'Personal Stories & Celebrations',
        description: 'Wedding films, surprise edits, and personal storytelling crafted to capture the emotions that matter most. We transform raw footage into memories you can relive forever.',
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/Adbuth%20Edits.mp4%20V1.1.mp4'
    },
    {
        id: 'corporate',
        title: 'Adbuth Corporate',
        subtitle: 'Business Films & Brand Stories',
        description: 'From corporate profiles to employee training modules, we create videos that strengthen your brand identity and enhance internal communication.',
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/ADBUTHCORPORATE-V1.3.mp4'
    },
    {
        id: 'adds',
        title: 'Adbuth Ads',
        subtitle: 'Commercial Advertising for TV & Digital',
        description: 'High-impact ad films designed for television, OTT, and social media campaigns crafted to grab attention and drive conversions.',
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/ADBUTHADS.mp4'
    },
    {
        id: 'politics',
        title: 'Adbuth Politics',
        subtitle: 'Political Campaigns & Constituency Stories',
        description: 'Strategic storytelling for leaders and campaigns. We design constituency videos, campaign promos, and result-driven communication material.',
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/Adbuth%20Politics.06.mp4'
    },
    {
        id: 'music',
        title: 'Adbuth Music',
        subtitle: 'Original Music, Jingles & Sound Design',
        description: 'Music that moves people. From original jingles to professional voiceovers and BGM, we give your videos the sound they deserve.',
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/Music.mp4'
    },
    {
        id: 'movies',
        title: 'Adbuth Movies',
        subtitle: 'Cinematic Post-Production',
        description: 'Cinematic editing and finishing for films. Transform raw footage into compelling narratives with precision, visual depth, and storytelling impact.',
        videoUrl: '' // No video provided for Movies yet
    }
];

const heroServices = [
    {
        name: "Adbuth Edits",
        desc: "We craft polished, professional video editing services for brand storytelling that communicates your brand’s message with clarity, impact and enhanced user engagement.",
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/Adbuth%20Edits.mp4%20V1.1.mp4'
    },
    {
        name: "Adbuth Corporate",
        desc: "We create refined, professional corporate video solutions that communicate your brand vision with clarity, credibility, and strong business impact.",
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/ADBUTHCORPORATE-V1.3.mp4'
    },
    {
        name: "Adbuth Ads",
        desc: "We produce high-impact advertising videos that capture attention instantly, deliver your message clearly, and drive meaningful audience engagement.",
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/ADBUTHADS.mp4'
    },
    {
        name: "Adbuth Politics",
        desc: "We craft strategic political video content that communicates vision, builds trust, and connects effectively with the public and target audience.",
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/Adbuth%20Politics.06.mp4'
    },
    {
        name: "Adbuth Music",
        desc: "We create immersive music visuals and audio experiences that enhance storytelling, elevate emotion, and leave a lasting impression.",
        videoUrl: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/Music.mp4'
    },
    {
        name: "Adbuth Movies",
        desc: "We deliver cinematic post-production services that transform raw footage into compelling narratives with precision, depth, and visual excellence.",
        videoUrl: ''
    }
];

const TypingEffect = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const intervalId = setInterval(() => {
            setDisplayedText(text.slice(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(intervalId);
            }
        }, 15); // Typing speed
        return () => clearInterval(intervalId);
    }, [text]);

    return <>{displayedText}</>;
};

const VideoPlayer = ({ src, buttonSize = "small" }) => {
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);
    const isInView = useInView(videoRef, { once: false, margin: "400px" });
    
    // Reset mute state when src changes
    useEffect(() => {
        setIsMuted(true);
    }, [src]);

    useEffect(() => {
        if (isInView && videoRef.current) {
            videoRef.current.play().catch(() => {});
        } else if (!isInView && videoRef.current) {
            videoRef.current.pause();
        }
    }, [isInView]);

    const isLarge = buttonSize === "large";

    return (
        <div className="w-full h-full relative overflow-hidden">
            <video 
                ref={videoRef}
                src={isInView ? src : ""} 
                className="w-full h-full object-cover absolute inset-0"
                muted={isMuted}
                loop
                playsInline
                preload="none"
            />
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className={`absolute ${isLarge ? 'bottom-6 right-6 w-10 h-10' : 'bottom-4 right-4 w-8 h-8'} z-20 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300`}
            >
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} className={isLarge ? 'text-xs' : 'text-[10px]'} />
            </button>
        </div>
    );
};

export default function Videos() {
    const [activeService, setActiveService] = useState('adbuth-edits');
    const [selectedHeroService, setSelectedHeroService] = useState(heroServices[0]);
    const { seoData } = useSeo('videos');


    return (
        <div className="bg-[#0a0510] min-h-screen font-sans text-white overflow-x-hidden relative">
            {/* Background Gradient Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[#0a0510] opacity-50 pointer-events-none" />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[#0a0510] opacity-50 pointer-events-none" />

            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Video Services | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Professional video editing and production services."}
                image={seoData?.og_image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg"}
                data={seoData}
            />
            <Navbar highlight="services" />

            <main className="relative z-10">

                {/* Hero Section */}
                <div className="bg-[radial-gradient(circle_600px_at_center,_#2A2158,_transparent)] pt-32 pb-10">
                    <section className=" max-w-7xl mx-auto px-6 lg:mb-24 mb-16 text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl lg:text-6xl md:text-4xl font-bold mb-6 leading-tight"
                        >
                            Smarter Editing. Bigger Impact.<br />
                            All Things <span className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Video, Audio & Storytelling</span><br />
                            In One Place
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-300 max-w-2xl mx-auto mb-8 text-sm md:text-md lg:text-lg "
                        >
                            We craft videos that inspire and sound that moves.<br />
                            From weddings to ads, politics to music, we bring your story to life.
                        </motion.p>

                        <Link href="/enquiry-form">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white text-black px-8 py-3 rounded-full font-bold text-sm md:text-md lg:text-lg hover:bg-gray-100 transition-colors"
                            >
                                Get Started Now
                            </motion.button>
                        </Link>
                    </section>

                    {/* Hero Content Grid */}
                    <section className="max-w-6xl mx-auto px-6 lg:mb-32 mb-16">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-y-8 lg:gap-x-8 lg:gap-y-0 lg:items-stretch justify-items-center">

                            {/* Left: Form Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="lg:col-span-2  w-full max-w-[400px] bg-[#150d22] border border-[#fff] rounded-[2rem] p-8 md:p-10 shadow-2xl h-full flex flex-col justify-center"
                            >
                                <h3 className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent font-bold mb-8 md:text-lg text-xl text-center">Convert Your Ideas Into AI Videos</h3>

                                <div className="mb-6">
                                    <label className="block md:text-md text-xs  mb-3 text-white">Select Video Type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-[#231638] border border-[#fff] rounded-lg md:p-4 p-2 appearance-none focus:outline-none focus:border-[#d946ef] text-white md:text-sm text-xs"
                                            value={selectedHeroService.name}
                                            onChange={(e) => {
                                                const service = heroServices.find(s => s.name === e.target.value);
                                                if (service) setSelectedHeroService(service);
                                            }}
                                        >
                                            {heroServices.map((service) => (
                                                <option key={service.name} value={service.name}>{service.name}</option>
                                            ))}
                                        </select>
                                        <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-gray-400" />
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <label className="block md:text-md text-xs mb-3 text-white">What We Do</label>
                                    <div className="bg-[#231638] border border-[#fff] rounded-lg p-4 text-[10px] text-gray-300 leading-relaxed min-h-[140px] md:text-sm">
                                        <TypingEffect text={selectedHeroService.desc} />
                                    </div>
                                </div>

                                <Link href="/enquiry-form">
                                    <button className="w-full border border-[#3b2d5f] text-white py-4 rounded-3xl hover:bg-[#d946ef]/10 transition-colors md:text-sm text-xs font-medium mt-auto">
                                        Request a Free Quote
                                    </button>
                                </Link>
                            </motion.div>

                            {/* Right: Video Player */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-[#150d22] w-full md:max-w-[400px] lg:max-w-full order-first lg:order-last border border-[#fff] rounded-[2rem] flex items-center justify-center relative group overflow-hidden h-full min-h-[300px] col-span-3 shadow-2xl"
                            >
                                <VideoPlayer 
                                    src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/index/02%20Video%20Editing%20%E2%80%93%20Services%20Overview%20V1.1.mp4" 
                                    buttonSize="large"
                                />
                            </motion.div>

                        </div>
                    </section>
                </div>

                {/* Pick Your Video Style Section */}
                <section className="max-w-6xl mx-auto px-6 md:px-12 pb-20">
                    <div className="text-center mb-6">
                        <h2 className="text-4xl font-bold md:mb-2 mb-6">Pick Your Video Style <br className='md:block hidden' />
                            <span className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent text-4xl font-bold mb-4">We'll Handle The Magic</span></h2>
                        <p className="text-white md:text-sm text-md ">We polish every frame with care so your story shines on any screen, any platform.</p>
                    </div>

                    <div className="border-t border-purple-900/30">
                        {videoServices.map((service) => (
                            <div key={service.id} className="border-b border-purple-900/30">
                                {/* Accordion Header */}
                                <div
                                    className={`py-6 flex items-center justify-between cursor-pointer group ${activeService === service.id ? 'hidden' : 'flex'}`}
                                    onClick={() => setActiveService(service.id)}
                                >
                                    <h3 className=" bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent text-2xl font-bold group-hover:text-white transition-colors">
                                        {service.title}
                                    </h3>
                                    <FontAwesomeIcon icon={faChevronDown} className="text-white" />
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {activeService === service.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="md:py-12 bg-[#130a1f] rounded-3xl border border-purple-500/30 p-6 md:p-12 my-6 relative">
                                                <div className="grid md:grid-cols-2 md:gap-12 gap-6">
                                                    <div>
                                                        <h3 className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent md:text-3xl text-xl font-bold  mb-2">{service.title}</h3>
                                                        <p className="md:text-xs text-[10px] italic md:normal text-gray-400 mb-6 md:uppercase tracking-widest ">{service.subtitle}</p>
                                                        <p className="text-gray-300 mb-8 leading-relaxed">
                                                            {service.description}
                                                        </p>
                                                        <Link href="/enquiry-form">
                                                            <button className="border border-white px-8 py-2 rounded-full hover:bg-white hover:text-black transition-colors text-sm">
                                                                Enquiry Now
                                                            </button>
                                                        </Link>
                                                    </div>
                                                    <div className="bg-gray-900 rounded-xl min-h-[200px] order-first md:order-last overflow-hidden relative shadow-2xl">
                                                        {service.videoUrl ? (
                                                            <VideoPlayer src={service.videoUrl} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                                <FontAwesomeIcon icon={faPlay} className="text-4xl opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}
