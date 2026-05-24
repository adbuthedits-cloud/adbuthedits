import { useState, useEffect } from 'react';
import Image from 'next/image';
import SeoHead from '../../components/SeoHead';
import useSeo from '../../hooks/useSeo';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceDrawer from '../../components/ServiceDrawer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { cdnImage } from '../../utils/cdn';


const servicesData = [
  {
    id: 'video',
    title: 'VIDEO EDITING',
    description: 'Crafting visual stories that captivate and inspire.',
    img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/service-video-editing.webp'),
    mainLink: '/services/videos',
    subServices: [
      { title: 'Adbuth Edits', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/adbuth-edits.webp'), link: '/services/videos/adbuth-edits' },
      { title: 'Adbuth Corporate', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/adbuth-coporate.webp'), link: '/services/videos/adbuth-corporate' },
      { title: 'Adbuth Ads', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/adbuth-ads.webp'), link: '/services/videos/adbuth-ads' },
      { title: 'Adbuth Politics', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/adbuth-politics.webp'), link: '/services/videos/adbuth-politics' },
      { title: 'Adbuth Music', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/adbuth-music.webp'), link: '/services/videos/adbuth-music' },
      { title: 'Adbuth Movies', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/adbuth-movies.webp'), link: '/services/videos/adbuth-movies' }
    ]
  },
  {
    id: 'design',
    title: 'DESIGN',
    description: 'Creative designs that communicate your brand\'s essence.',
    img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/service-design.webp'),
    mainLink: '/services/design',
    subServices: [
      { title: 'Adbuth E-Invitations', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/services-e-invitation.webp'), link: '/services/designing/adbuth-e-invitations' },
      { title: 'Adbuth Graphics', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/services-graphics.webp'), link: '/services/designing/adbuth-graphics' }
    ]
  },
  {
    id: 'learning',
    title: 'LEARNING',
    description: 'Strategic solutions to elevate your business presence.',
    img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/index/service-commercial.webp'),
    mainLink: '/services/learning',
    subServices: [
      { title: 'Adbuth DAM', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/learning/index/services-dam.webp'), link: '/services/learning/adbuth-dam' },
      { title: 'Adbuth Learnings', img: cdnImage('https://assets.adbuthverse.com/website-assets/pages/services/learning/index/services-e-learning.webp'), link: '/services/learning/adbuth-e-learning' }
    ]
  }
];

export default function Services() {
  const [activeService, setActiveService] = useState(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { seoData } = useSeo('services');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleServiceClick = (service) => {
    if (isMobile && service.mainLink) {
      router.push(service.mainLink);
    } else {
      setActiveService(activeService === service.id ? null : service.id);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setActiveService(null);
    }
  };

  return (
    <div className=" min-h-screen font-sans">
      <SeoHead
        title={seoData?.meta_title || seoData?.title || "Services | Adbuth Verse"}
        description={seoData?.meta_description || seoData?.description || "Explore our wide range of digital services tailored for your business."}
        image={seoData?.og_image || "https://assets.adbuthverse.com/website-assets/pages/services/index/service-video-editing.webp"}
        data={seoData}
      />
      <Navbar highlight="services" isdark={false} />

      <main className="w-full md:pt-24 pt-20 ">
        {/* Header Section */}
        <section className="bg-white w-full px-10 md:px-24 pt-12 pb-10 bg-white  -mb-1 ">
          <div className="flex justify-between items-end mb-8 max-w-7xl mx-auto">
            <h1
              className="text-5xl lg:text-8xl md:text-6xl font-black uppercase tracking-tighter leading-none "
            >
              <span className="text-[#7D287E]">OUR</span> <br />
              <span className="text-[#FCD804]">SERVICES</span>
            </h1>
            <p className="text-[12px] font-medium text-black leading-tight max-w-56 md:block hidden">
              Using state-of-the-art technologies and a collaborative spirit, we strive to exceed expectations, meet deadlines, and bring stories to life with brilliance, one frame at a time.
            </p>
          </div>
          <p className="text-lg lg:text-2xl md:text-xl mb-8 md:mb-0 font-medium text-black leading-tight w-full max-w-7xl mx-auto">
            “We bring your stories to life, helping you connect with people, cultures, trends and endless opportunities.”
          </p>
          <p className="text-sm font-medium text-black leading-tight w-full md:hidden block">
            Using state-of-the-art technologies and a collaborative spirit, we strive to exceed expectations, meet deadlines, and bring stories to life with brilliance, one frame at a time.
          </p>
        </section>

        {/* Interactive Services List */}
        <section className="w-full px-10 pt-10  lg:px-0 bg-white gap-6 lg:gap-0 flex flex-col" onMouseLeave={handleMouseLeave}>
          {servicesData.map((service) => {
            const isActive = activeService === service.id;

            return (
              <motion.div
                key={service.id}
                initial={false}
                animate={{ height: isMobile ? '350px' : (isActive ? '500px' : '400px') }}
                // Fixed mobile height to 350px to match design, preventing collapse
                whileHover={!isMobile ? { height: isActive ? '500px' : '500px' } : {}}
                className="relative w-full rounded-3xl lg:rounded-none  overflow-hidden border-b border-white last:border-0 flex h-[350px] max-h-[350px] lg:h-[500px] lg:max-h-[500px] "
              >
                {/* Main Service Area (Clickable) */}
                <motion.div
                  className={`relative cursor-pointer group transition-all duration-500 ease-in-out ${isActive ? 'w-[15%] lg:w-[10%]  bg-black' : 'w-full'}`}
                  onClick={() => handleServiceClick(service)}
                >
                  {/* Background Image - Only visible when NOT active */}
                  <div
                    className={`absolute top-0 left-0 w-full h-[500px] transition-opacity duration-500 ${isActive ? 'opacity-0' : 'opacity-100'}`}
                  >
                    <Image
                      src={service.img}
                      alt={service.title}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                  {/* Inactive Title (Horizontal) */}
                  <div className={`absolute inset-0 flex items-end justify-between px-6 lg:px-16 pb-8 transition-opacity duration-300 ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex flex-col items-start">
                      <h2 className="font-bold text-white drop-shadow-lg tracking-tight uppercase whitespace-nowrap text-3xl lg:text-7xl mb-2">
                        {service.title}
                      </h2>
                      <p className="hidden lg:block text-white text-lg lg:text-xl font-medium max-w-md opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                        {service.description}
                      </p>
                    </div>

                    {/* Arrow Icon */}
                    <div className="hidden lg:block text-white text-4xl lg:text-5xl opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out mb-4">
                      <FontAwesomeIcon icon={faArrowRight} />
                    </div>
                  </div>

                  {/* Active Title (Vertical) - Only on Desktop does this verify state matter */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 delay-200 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <h2 className="font-bold m-0 text-white drop-shadow-lg tracking-tight uppercase whitespace-nowrap -rotate-90 text-3xl lg:text-5xl ">
                      {service.title}
                    </h2>
                  </div>
                </motion.div>

                {/* Drawer Content (Sub-services) - Only show if active AND NOT MOBILE (redundant check but safe) */}
                <AnimatePresence>
                  {isActive && !isMobile && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="bg-[#1a1025] h-full flex-1 overflow-x-hidden "
                    >
                      <ServiceDrawer subServices={service.subServices} isActive={isActive} />
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })}
        </section>

      </main>
      <Footer />
    </div>
  );
}
