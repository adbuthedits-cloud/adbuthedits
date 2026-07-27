import SeoHead from '../../../components/SeoHead';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import useSeo from '../../../hooks/useSeo';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Designing() {
    const { seoData } = useSeo('designing');

    return (
        <div className="bg-[#000] min-h-screen font-sans selection:bg-purple-500 selection:text-white">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Designing Services | Adbuth"}
                description={seoData?.meta_description || seoData?.description || "Creative designing services including E-Invitations and Graphics."}
                image={seoData?.og_image || "https://assets.adbuthverse.com/website-assets/pages/services/designing/index/designing_the_shapes.webp"}
                data={seoData}
            />
            <Navbar isdark={true} highlight="services" />

            <div style={{ fontFamily: "DM Sans, sans-serif" }}>
                {/* Hero Section */}
                <section className="pt-24 md:pt-32 pb-12 md:pb-24 max-w-[1440px] mx-auto overflow-hidden relative lg:min-h-[700px] xl:min-h-[800px] flex flex-col lg:flex-row items-center w-full">

                    {/* Text Content */}
                    <div className="w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left px-6 md:px-12 lg:pl-20 xl:pl-28 mt-4 lg:mt-0 relative z-10 order-1">
                        <h1 className="text-[40px] md:text-6xl lg:text-[72px] font-bold mb-6 lg:mb-8 leading-[1.2] lg:leading-[1.1] text-[#D060F3] lg:whitespace-nowrap drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex flex-col lg:block">
                            <span>Design <br />
                                That Shapes First <br />
                                Impressions</span>
                        </h1>
                        <p className="text-gray-300 text-sm md:text-base lg:text-[22px] mb-8 lg:mb-12 max-w-[420px] mx-auto lg:mx-0 font-light leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            From brand visuals to unforgettable invitations, our design vertical helps businesses and individuals stand out with clarity, consistency, and creativity.
                        </p>

                        {/* Gradient animated border button */}
                        <Link href="/enquiry-form">
                            <div className="p-[2px] rounded-full bg-gradient-to-r from-[#D060F3] via-[#8A2B93] to-[#D060F3] bg-[length:200%_auto] animate-gradient-x hover:shadow-[0_0_20px_rgba(208,96,243,0.5)] transition-shadow w-fit relative z-20">
                                <button className="bg-black text-white px-8 py-3 lg:px-10 lg:py-4 rounded-full font-medium transition-all text-sm md:text-base lg:text-xl h-full w-full hover:bg-transparent">
                                    Explore Our Services
                                </button>
                            </div>
                        </Link>
                    </div>

                    {/* Mobile/Tablet Static Image */}
                    <div className="w-full lg:hidden px-6 md:px-12 mt-12 order-2 z-0">
                        <img
                            src="https://assets.adbuthverse.com/website-assets/pages/services/designing/index/designing_the_shapes.webp"
                            alt="Design team collaborating"
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    {/* Desktop Absolute Image */}
                    <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[55%] z-0">
                        <img
                            src="https://assets.adbuthverse.com/website-assets/pages/services/designing/index/designing_the_shapes.webp"
                            alt="Design team collaborating"
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </section>

                {/* Services Section */}
                <section className="px-6 md:px-12 lg:px-20 max-w-[1440px] mx-auto mb-20 lg:mb-32 mt-10 lg:mt-0">
                    <h2 className="text-[40px] leading-[1.1] md:text-5xl lg:text-6xl font-bold mb-12 lg:mb-24 text-center lg:text-left text-[#D060F3]">
                        Our<br className="lg:hidden" /> Design<span className="hidden lg:inline"> Services</span>
                    </h2>

                    {/* E-Invitations Card */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-24 mb-16 lg:mb-32">
                        <div className="w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left lg:max-w-lg">
                            <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-2 lg:mb-4">Adbuth E-Invitations</h3>
                            <h4 className="text-[#707070] text-sm md:text-base lg:text-lg mb-6 lg:mb-8 font-medium">Invite with Style. Celebrate with Heart.</h4>

                            {/* Mobile/Tablet Image */}
                            <div className="w-full lg:hidden mb-6">
                                <img
                                    src="https://assets.adbuthverse.com/website-assets/pages/services/designing/index/our_design_services_1.webp"
                                    alt="Adbuth E-Invitations Design"
                                    className="w-full h-auto object-cover"
                                />
                            </div>

                            <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-8 lg:mb-12 font-light leading-relaxed">
                                From weddings to corporate gatherings, we create digital and animated invitations that set the perfect tone before your event begins.
                            </p>
                            <Link href="/enquiry-form">
                                <button className="text-white border border-[#D060F3] hover:bg-[#D060F3] transition-colors rounded-full px-8 py-2.5 lg:px-10 lg:py-4 text-sm md:text-base w-fit tracking-wide font-medium">
                                    Enquiry Now
                                </button>
                            </Link>
                        </div>
                        {/* Desktop Image */}
                        <div className="hidden lg:block lg:w-[50%]">
                            <img
                                src="https://assets.adbuthverse.com/website-assets/pages/services/designing/index/our_design_services_1.webp"
                                alt="Adbuth E-Invitations Design"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>

                    {/* Graphics Card */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-24">
                        {/* Desktop Image */}
                        <div className="hidden lg:block lg:w-[50%]">
                            <img
                                src="https://assets.adbuthverse.com/website-assets/pages/services/designing/index/our_design_services_2.webp"
                                alt="Adbuth Graphics Design"
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                    e.target.src = "https://assets.adbuthverse.com/website-assets/pages/services/designing/index/our_design_services_1.webp";
                                }}
                            />
                        </div>
                        <div className="w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left lg:max-w-lg">
                            <h3 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-2 lg:mb-4">Adbuth Graphics</h3>
                            <h4 className="text-[#707070] text-sm md:text-base lg:text-lg mb-6 lg:mb-8 font-medium">Visuals That Captivate. Stories That Stick.</h4>

                            {/* Mobile/Tablet Image */}
                            <div className="w-full lg:hidden mb-6">
                                <img
                                    src="https://assets.adbuthverse.com/website-assets/pages/services/designing/index/our_design_services_2.webp"
                                    alt="Adbuth Graphics Design"
                                    className="w-full h-auto object-cover"
                                    onError={(e) => {
                                        e.target.src = "https://assets.adbuthverse.com/website-assets/pages/services/designing/index/our_design_services_1.webp";
                                    }}
                                />
                            </div>

                            <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-8 lg:mb-12 font-light leading-relaxed">
                                We craft branding, posters, social media creatives, and thumbnails that keep your audience engaged and your brand memorable.
                            </p>
                            <Link href="/enquiry-form">
                                <button className="text-white border border-[#D060F3] hover:bg-[#D060F3] transition-colors rounded-full px-8 py-2.5 lg:px-10 lg:py-4 text-sm md:text-base w-fit tracking-wide font-medium">
                                    Enquiry Now
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative py-24 px-6 md:px-12 lg:px-20 bg-[#7D287E] text-white overflow-hidden">
                    <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Let's Bring Your Vision to Life</h2>
                        <p className="text-lg text-gray-200 mb-10 max-w-xl">
                            Whether it's a brand asset or a special invitation, we'll design something that feels
                            meaningful and memorable.
                        </p>
                        <Link href="/enquiry-form">
                            <button className="bg-white text-lg text-black px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors">
                                Let's Create
                            </button>
                        </Link>
                    </div>
                </section>
            </div>

            <Footer />
            <style jsx>{`
                @keyframes gradient-x {
                    0%, 100% {
                        background-size: 200% 200%;
                        background-position: left center;
                    }
                    50% {
                        background-size: 200% 200%;
                        background-position: right center;
                    }
                }
                .animate-gradient-x {
                    animation: gradient-x 3s ease infinite;
                }
            `}</style>
        </div>
    );
}
