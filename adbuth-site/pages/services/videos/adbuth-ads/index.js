import SeoHead from '../../../../components/SeoHead';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import useSeo from '../../../../hooks/useSeo';
import { cdnImage } from '../../../../utils/cdn';


export default function AdbuthAds() {
    const { seoData } = useSeo('adbuth-ads');
    const playSectionRef = useRef(null);
    const { scrollYProgress: playScrollY } = useScroll({
        target: playSectionRef,
        offset: ["start center", "center center"]
    });

    const { scrollYProgress: simplyAdsScrollY } = useScroll({
        target: playSectionRef,
        offset: ["start center", "end center"]
    });

    const playX = useTransform(playScrollY, [0, 1], ["-100%", "0%"]);
    const simplyAdsX = useTransform(simplyAdsScrollY, [0, 1], ["-100%", "0%"]);

    const [hoveredCard, setHoveredCard] = useState(null);

    const cards = [
        {
            id: '01',
            title: 'Create Concepts That',
            subtitle: 'Hook Audiences Instantly',
            image: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-ads/ams-1.webp'),
            desc: 'We brainstorm unique ideas that resonate with your target audience.'
        },
        {
            id: '02',
            title: 'Design High-Quality Ads',
            subtitle: 'That Stop The Scroll',
            image: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-ads/ams-2.webp'),
            desc: 'Visually stunning designs that capture attention in milliseconds.'
        },
        {
            id: '03',
            title: 'Compelling Copy That Convert',
            subtitle: 'Into Customers',
            image: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-ads/ams-3.webp'),
            desc: 'Persuasive writing that drives action and sales.'
        }
    ];

    return (
        <div className="font-sans bg-white text-black overflow-x-hidden">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Adbuth Ads | Commercial Video Services"}
                description={seoData?.meta_description || seoData?.description || "Commercial ads that sell, inspire, and stick."}
                image={seoData?.og_image || "https://assets.adbuthverse.com/website-assets/pages/services/videos/adbuth-ads/ams-1.webp"}
                data={seoData}
            />
            <Navbar highlight="services" isdark={false} />

            <main className='pt-24' >
                {/* Hero Section */}
                <section className="bg-[#7D287E] min-h-[600px] md:min-h-[600px] lg:min-h-[700px] flex flex-col items-center justify-start text-center py-24 px-6 text-white relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl z-10 flex flex-col items-center"
                    >
                        {/* Desktop Heading */}
                        <h1 className="hidden md:block lg:text-6xl md:text-5xl font-bold mb-6 leading-tight">
                            Commercial Ads That Sell,<br />
                            Inspire & Stick
                        </h1>

                        {/* Mobile Heading */}
                        <div className="md:hidden flex flex-col items-center text-4xl font-bold mb-8 gap-2">
                            <span className=" pb-1">Commercial Ads</span>
                            <span className=" pb-1">That Sell,</span>
                            <span className=" pb-1">Inspire & Stick</span>
                        </div>

                        <p className="text-sm lg:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                            At Adbuth Ads, we craft high-impact TV and digital commercials that cut through the noise, capture attention, and leave a lasting impression.
                        </p>
                        <Link href="/enquiry-form">
                            <button className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform text-sm lg:text-base">
                                Request for quote
                            </button>
                        </Link>
                    </motion.div>

                    {/* Vertical Line */}
                    <div className="lg:mt-10 mt-6 w-[2px] h-10 bg-white"></div>
                </section>

                {/* Welcome / Play Section */}
                <section ref={playSectionRef} className="py-0 lg:py-24 pl-0 lg:pl-24 bg-white relative">
                    <div className="grid lg:grid-cols-2 items-center relative z-10">
                        {/* Left Content (Welcome Text) - Mobile Order 2 */}
                        <div className='max-w-lg px-6 md:px-12 lg:px-0 pt-[250px] md:pt-[300px] lg:pt-0 pb-20 lg:pb-0' >
                            <h2 className="text-4xl font-bold mb-2 text-black">Welcome To</h2>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent mb-8">Adbuth Ads</h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                We don't just make ads. We tell stories that make audiences stop, watch, and remember your brand. Whether it's a 30-second TV spot or a viral online campaign, our ads are designed to connect emotionally and deliver results.
                            </p>
                        </div>

                        {/* Right Content (Video Placeholder) - Mobile Order 1 (Overlap) */}
                        <div className="lg:h-[500px] md:h-[400px] lg:w-[54%] w-[88%] h-[250px] bg-gray-400 overflow-hidden flex items-center absolute -top-16 md:-top-40 md:left-12 lg:-top-56 left-6 lg:left-auto lg:right-0 z-20 shadow-xl">
                            {/* Video Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-0 bg-[#aaaaaa]">
                                {/* Video Placeholder */}
                            </div>

                            {/* Scrolling PLAY Text */}
                            <motion.div
                                style={{ x: playX }}
                                className="absolute -bottom-2 md:-bottom-4 lg:-bottom-6 left-0 lg:left-auto whitespace-nowrap pointer-events-none z-10 mix-blend-overlay opacity-100"
                            >
                                <span className="text-[60px] md:text-[100px] lg:text-[140px] font-black uppercase text-white leading-none">PLAY</span>
                            </motion.div>
                        </div>
                    </div>
                </section>
                {/* Scrolling SIMPLY ADS Text */}
                <div className='relative h-[100px] lg:h-[200px]'>
                    <motion.div
                        style={{ x: simplyAdsX }}
                        className="absolute md:-bottom-10 lg:-bottom-14 -bottom-6 left-0 whitespace-nowrap pointer-events-none z-0 opacity-15 "
                    >
                        <span className="text-[60px] md:text-[100px] lg:text-[150px] font-black uppercase text-gray-400">
                            SIMPLY ADS
                        </span>
                    </motion.div>

                </div>

                {/* Quote Section */}
                <section className="lg:py-32 py-20 px-6 lg:px-24 bg-[#333333] text-white text-center hidden lg:block ">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-12 leading-[1.3]">
                            FROM TV SCREENS TO MOBILE FEEDS, YOUR BRAND DESERVES AN AD THAT SPEAKS LOUDER, SMARTER, AND SHARPER.
                        </h2>
                        <Link href="/enquiry-form">
                            <button className="bg-[#7D287E] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#963097] transition-colors">
                                Let's Create Together
                            </button>
                        </Link>
                    </div>
                </section>

                {/* Advertising Made Simple (Cards) */}
                <section className="py-24 px-6 lg:px-24 bg-white hidden lg:block">
                    <div className="mb-16">
                        <h2 className="text-4xl font-bold">Advertising Made Simple</h2>
                    </div>

                    <div className="flex flex-row justify-center items-center gap-10">
                        {cards.map((card, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2, duration: 0.6 }}
                                onHoverStart={() => setHoveredCard(index)}
                                onHoverEnd={() => setHoveredCard(null)}
                                className={`${index % 2 === 0 ? 'mb-0' : 'mb-16'} relative w-[330px] h-[500px] group overflow-hidden cursor-pointer`}
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0 bg-black">
                                    {/* Replace with actual image */}
                                    <img src={card.image} alt={card.title} className="w-full h-full object-cover opacity-100 group-hover:opacity-40 transition-opacity duration-500" />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 -mt-5  flex flex-col justify-between z-10">
                                    {/* Number Animation */}
                                    <motion.div
                                        initial={{ x: -50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.4 + (index * 0.2), duration: 0.5 }}
                                    >
                                        <span className="text-8xl font-bold text-white -ml-3">{card.id}</span>
                                    </motion.div>

                                    <div className="flex flex-col justify-end">


                                        {/* Hover Reveal Content */}
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: hoveredCard === index ? "auto" : 0,
                                                opacity: hoveredCard === index ? 1 : 0
                                            }}
                                            transition={{ duration: 0.4, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4">
                                                <p className="text-gray-300 text-sm mb-6 ml-5">
                                                    {card.desc}
                                                </p>
                                                <button className="bg-white text-black px-6 py-3 text-sm font-bold hover:bg-gray-200 transition-colors">
                                                    Explore More
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Footer CTA Desktop */}
                <section className="py-6 pb-24 px-6 lg:px-24 bg-white text-black hidden lg:block">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-4xl lg:text-4xl font-bold mb-4 leading-tight">
                            Your Story Deserves The Spotlight.<br />
                            Let's <span className="bg-gradient-to-r from-[#AE52FF] to-[#E188E2] bg-clip-text text-transparent">Create Ads</span> That People Don't Skip.
                        </h2>

                        <div className="mt-12">
                            <Link href="/enquiry-form">
                                <button className="bg-[#7D287E] text-white px-24 py-6 rounded-full text-xl font-bold shadow-lg hover:bg-[#963097] transition-colors">
                                    Request for Quote
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer CTA Mobile */}
                <section className="py-20 px-6 lg:px-24 bg-[#1A1A1A] text-white block lg:hidden">
                    <div className="max-w-4xl text-center lg:text-start">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4 leading-[1.3]">
                            From TV Screens<br />
                            To Mobile Feeds,<br />
                            Your Brand<br />
                            Deserves An Ad<br />
                            That Speaks<br />
                            Louder, Smarter,<br />
                            And Sharper.
                        </h2>

                        <div className="mt-12">
                            <Link href="/enquiry-form">
                                <button className="bg-white text-black px-10 py-4 rounded-full text-lg lg:text-xl font-bold shadow-lg hover:bg-gray-200 transition-colors">
                                    Request for quote
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
