import { useState, useEffect } from 'react';
import Link from 'next/link';
import SeoHead from '../../../../components/SeoHead';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import useSeo from '../../../../hooks/useSeo';

const craftServices = [
    {
        id: 'wedding',
        number: '1',
        title: 'Wedding Films',
        description: 'We craft cinematic wedding films that beautifully capture the essence of your big day. From emotional vows to candid laughter, we make sure every moment is told with elegance, artistry, and heart.',
        cards: [
            { title: 'Wedding Highlights', description: 'Cinematic moments captured forever.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Candid Shots', description: 'Pure emotions, unscripted.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Storytelling', description: 'Narrative driven edits.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Final Cut', description: 'Polished to perfection.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' }
        ]
    },
    {
        id: 'surprise',
        number: '2',
        title: 'Surprise Edits',
        description: 'Our surprise edits are perfect for birthdays, anniversaries, reunions, or just to say you matter. We stitch together photos, videos, and music into a heartfelt film that speaks louder than words.',
        cards: [
            { title: 'Birthday Bash', description: 'Celebrate another year of joy.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Anniversary Special', description: 'Relive your love story.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Reunion Recap', description: 'Memories with old friends.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Just Because', description: 'Small moments, big smiles.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' }
        ]
    },
    {
        id: 'personal',
        number: '3',
        title: 'Personal Stories',
        description: 'Whether it\'s a life journey, a special trip, or a milestone achievement, we create short films that celebrate you. Our editing style blends emotion with creativity, turning ordinary moments into extraordinary stories.',
        cards: [
            { title: 'Travel Diaries', description: 'Adventures around the world.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Life Journey', description: 'From childhood to now.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Milestone Moments', description: 'Achievements worth celebrating.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' },
            { title: 'Daily Vlogs', description: 'Everyday life, elevated.', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' }
        ]
    }
];

const CraftCard = ({ card, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
        className="bg-[#130a1f] p-4 rounded-2xl border border-purple-500/20 shadow-xl"
    >
        <div className="lg:h-[160px] lg:min-h-[160px]  md:h-[120px] md:min-h-[120px]  w-full bg-gray-700 rounded-xl mb-4 animate-pulse overflow-hidden relative">
            {/* <img src={card.image} alt={card.title} className="w-full h-full object-cover" /> */}
        </div>
        <div>
            <h4 className="text-white font-bold lg:text-lg md:text-sm mb-1">{card.title}</h4>
            <p className="text-gray-400 lg:text-xs md:text-[10px] leading-tight line-clamp-1">{card.description}</p>
        </div>
    </motion.div>
);

export default function AdbuthEdits() {
    const { seoData } = useSeo('adbuth-edits');
    const [activeService, setActiveService] = useState('wedding');
    const activeServiceData = craftServices.find(s => s.id === activeService);

    // Auto-play for mobile view
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveService(current => {
                const currentIndex = craftServices.findIndex(s => s.id === current);
                const nextIndex = (currentIndex + 1) % craftServices.length;
                return craftServices[nextIndex].id;
            });
        }, 100000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#000] min-h-screen font-sans text-white overflow-x-hidden relative">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Adbuth Edits | Professional Video Editing"}
                description={seoData?.meta_description || seoData?.description || "Turn memories into timeless stories with Adbuth Edits."}
                image={seoData?.og_image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg"}
                data={seoData}
            />
            <Navbar highlight="services" />

            <main className="pt-32 pb-20 relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 mb-32 text-center relative">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/30 rounded-full blur-[120px] -z-10" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >

                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            Turn Memories Into Timeless Stories<br />
                            <span className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">With Adbuth Edits</span>
                        </h1>

                        <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
                            Cinematic wedding films, surprise edits & personal stories crafted with creativity and AI precision.
                        </p>

                        <Link href="/enquiry-form">
                            <button className="bg-white text-black px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
                                Share Your Story
                            </button>
                        </Link>
                    </motion.div>

                    {/* AI Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto p-[1px] md:p-[3px] rounded-3xl md:bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-white relative shadow-2xl "
                    >
                        <div className="md:bg-[#130a1f] bg-[#1F1B38] md:rounded-[20px] rounded-[25px] h-full w-full overflow-hidden relative">
                            {/* Gradient Border Effect */}
                            <div className="absolute inset-0 md:bg-[radial-gradient(circle_500px_at_bottom_left,_#2B1317,_transparent)] pointer-events-none" />

                            <div className="grid md:grid-cols-2 gap-6 items-center relative z-10 px-6 md:px-8 lg:px-12 py-8 md:py-0">
                                {/* Robot Illustration Placeholder - Hidden on Mobile */}
                                <div className="hidden md:flex relative h-64 md:h-full min-h-[300px] items-end justify-center">
                                    {/* Replace with actual robot image/illustration */}
                                    <div className="lg:w-80 lg:h-80 md:w-72 md:h-72 flex items-center flex-end">
                                        <img src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/services/videos/adbuth-edits/blue-robot.png" alt="Robot" className="w-full h-full object-cover" />
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="text-center md:text-left md:my-6  my-2">
                                    <h3 className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent font-bold mb-6 text-xl md:text-base lg:text-2xl">
                                        Convert Your Ideas Into<br className="md:hidden" /> AI Videos
                                    </h3>

                                    <div className="md:mb-6 mb-3 text-left">
                                        <label className="block text-[12px] md:text-xs font-bold mb-2 text-white md:text-gray-300 md:uppercase md:tracking-wider">Memory Type</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-transparent border md:text-xs lg:text-sm text-xs border-white rounded-full md:p-3 p-2 md:px-6 px-3 text-white focus:border-[#d946ef] focus:outline-none appearance-none cursor-pointer"
                                                defaultValue="Wedding Films"
                                            >
                                                <option value="Wedding Films" className="bg-[#130a1f]">Wedding Films</option>
                                                <option value="Surprise Edits" className="bg-[#130a1f]">Surprise Edits</option>
                                                <option value="Personal Stories" className="bg-[#130a1f]">Personal Stories</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M6 8L0 0H12L6 8Z" fill="white" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:mb-8 mb-4 text-left">
                                        <label className="block text-xs md:text-xs font-bold mb-2 text-white md:text-gray-300 md:uppercase md:tracking-wider">What We Do</label>
                                        <div className="bg-transparent border border-white rounded-xl md:p-6 p-3 text-xs md:text-xs text-white/90 leading-relaxed shadow-sm">
                                            We craft cinematic wedding films that beautifully capture the essence of your big day. From emotional vows to candid laughter, we make sure every moment is told with elegance, artistry, and heart.
                                        </div>
                                    </div>

                                    <Link href="/enquiry-form">
                                        <button className="w-full border border-[#A17BF6] text-white md:py-3 lg:py-4 py-3 rounded-full bg-[#A17BF6]/10 hover:bg-[#A17BF6]/20 transition-all shadow-[0_0_15px_rgba(161,123,246,0.3)] md:text-xs lg:text-lg text-xs font-medium">
                                            Request a Free Quote
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Craft Memories Section */}
                <section className="max-w-7xl mx-auto px-6 mb-32 relative">
                    <div className="absolute right-96 top-96 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[100px] -z-20" />
                    <div className="text-center mb-8">
                        <h2 className="text-4xl md:text-5xl font-bold mb-2">Craft Memories</h2>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">That Last Forever</h2>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:grid md:grid-cols-2 lg:gap-16 md:gap-8 items-center">
                        {/* Left: Service List */}
                        <div className="lg:space-y-8 md:space-y-6">
                            {craftServices.map((service) => (
                                <div
                                    key={service.id}
                                    className={`cursor-pointer group transition-all duration-300 ${activeService === service.id ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                                    onClick={() => setActiveService(service.id)}
                                >
                                    <div className={`bg-[#1a1a1a] lg:p-8 md:p-6 rounded-2xl border transition-colors duration-300 ${activeService === service.id ? 'border-purple-500/50 bg-[#1f1235]' : 'border-transparent'}`}>
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`flex-shrink-0 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center md:text-xs lg:text-sm font-bold transition-colors ${activeService === service.id ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                                {service.number}
                                            </div>
                                            <div>
                                                <h3 className="md:text-base lg:text-xl font-bold mb-2">{service.title}</h3>
                                                <p className="text-gray-400 md:text-xs lg:text-sm leading-relaxed">
                                                    {service.description}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right: Interactive Image Grid (Desktop) */}
                        <div className="relative h-[600px] w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeService}
                                    className="absolute inset-0 grid grid-cols-2 gap-6"
                                >
                                    {/* Column 1: Left Cards */}
                                    <div className="flex flex-col h-full py-4 gap-6 pt-16">
                                        {activeServiceData?.cards.slice(0, 2).map((card, index) => (
                                            <CraftCard key={`left-${index}`} card={card} index={index} />
                                        ))}
                                    </div>

                                    {/* Column 2: Right Cards (Staggered) */}
                                    <div className="flex flex-col  h-full py-4  gap-6">
                                        {activeServiceData?.cards.slice(2, 4).map((card, index) => (
                                            <CraftCard key={`right-${index}`} card={card} index={index + 2} />
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="flex flex-col gap-6 md:hidden">
                        {/* Scrollable Main Cards Container */}
                        <div
                            className="flex overflow-x-auto gap-4 snap-x snap-mandatory pt-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            onScroll={(e) => {
                                const scrollLeft = e.target.scrollLeft;
                                const width = e.target.offsetWidth;
                                const index = Math.round(scrollLeft / width);
                                if (craftServices[index] && craftServices[index].id !== activeService) {
                                    setActiveService(craftServices[index].id);
                                }
                            }}
                        >
                            {craftServices.map((service, index) => (
                                <div
                                    key={service.id}
                                    className="min-w-full flex-shrink-0 snap-center relative w-full"
                                    style={{ scrollSnapAlign: 'center' }}
                                >
                                    <div className="bg-[#1f1a28] p-4 rounded-2xl border border-white/5 shadow-lg relative h-full flex flex-col justify-center min-h-[160px]">
                                        <div className="flex items-center gap-4 z-10 ">
                                            <div className="w-10 h-10 mt-1 flex-shrink-0 rounded-full bg-gradient-to-tr from-[#AE52FF] to-[#E188E2] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                {service.number}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                                                <p className="text-gray-400 text-[10px] leading-relaxed">
                                                    {service.description}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                const container = e.currentTarget.closest('.snap-x');
                                                if (container) {
                                                    if (index === craftServices.length - 1) {
                                                        container.scrollTo({ left: 0, behavior: 'smooth' });
                                                    } else {
                                                        container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
                                                    }
                                                }
                                            }}
                                            className="absolute right-2 top-10 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform z-20"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Dots */}
                        <div className="flex justify-center gap-2 -mt-2">
                            {craftServices.map((s) => (
                                <div key={s.id} className={"w-2 h-2 rounded-full transition-colors " + (s.id === activeService ? 'bg-[#AE52FF]' : 'bg-gray-700')} />
                            ))}
                        </div>

                        {/* 2x2 Image Grid */}
                        <div className="grid grid-cols-2 gap-4 px-1">
                            <AnimatePresence mode="popLayout">
                                {activeServiceData?.cards.map((card, index) => (
                                    <motion.div
                                        key={activeService + '-' + index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className={"bg-[#181824] p-2 rounded-2xl border border-white/5 shadow-lg "}
                                    >
                                        <div className="aspect-[4/3] w-full bg-[#8f8f8f] rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                                            {card.image && card.image !== 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg' ? (
                                                <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                                            ) : null}
                                        </div>
                                        <div className="px-1 pb-1">
                                            <h4 className="text-white font-bold text-xs mb-1 truncate">{card.title}</h4>
                                            <p className="text-[#a1a1aa] text-[10px] leading-tight line-clamp-2">{card.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-4xl mx-auto px-6 text-center md:mb-32 mb-10 relative">
                    {/* Background Glow */}
                    <div className="absolute -right-96 top-64 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-[100px] -z-10" />

                    <h2 className="text-4xl md:text-5xl font-bold mb-12">Ready To Tell Your Story?</h2>
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent mb-12">Start Today With Adbuth Edits.</h2>

                    <Link href="/enquiry-form">
                        <div className="flex items-center justify-center gap-6 cursor-pointer group">
                            <span className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">
                                Get A Quote
                            </span>
                            <div className="w-32 h-12 rounded-full bg-gradient-to-r from-[#AE52FF] to-[#E188E2] flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                                <FontAwesomeIcon icon={faArrowRight} className="text-black text-lg" />
                            </div>
                        </div>
                    </Link>
                </section>

            </main>
            <Footer />
        </div>
    );
}
