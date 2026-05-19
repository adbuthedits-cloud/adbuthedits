import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons"
import SeoHead from "../components/SeoHead"
import useSeo from "../hooks/useSeo"

export default function About() {
  const officeImages = [
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_789.png",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_777.png",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_768.png",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1138%20copy.jpg.jpeg",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1129%20copy.jpg.jpeg",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1077%20copy.jpg.jpeg",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1046%20copy.jpg.jpeg",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1045%20copy.jpg.jpeg",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1039%20copy.jpg.jpeg",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1025%20copy.jpg.jpeg",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1013%20office.png",
    "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/office/IMG_1006%20copy.jpg.jpeg"
  ]
  const [isExpanded, setIsExpanded] = useState(false)
  const { seoData } = useSeo("about")
  const [duration, setDuration] = useState(120)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDuration(60)
      } else if (window.innerWidth < 1024) {
        setDuration(40)
      } else {
        setDuration(80)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div>
      <SeoHead
        title={seoData?.meta_title || seoData?.title || "About Us | Adbuth Verse"}
        description={seoData?.meta_description || seoData?.description || "Learn more about Adbuth Verse, our team, and our mission."}
        image={seoData?.og_image || "/images/about-bg.jpg"}
        data={seoData}
      />
      <Navbar highlight="about" isdark={false} />

      <main className="pt-24">
        {/* Slider Section - Infinite scroll with no gaps */}
        <div className="w-full overflow-hidden bg-gray-950 relative h-[30vh] md:h-[60vh] flex items-center">
          <motion.div
            className="flex w-max h-full"
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: duration,
                ease: "linear",
              },
            }}
          >
            {[...officeImages, ...officeImages].map((src, index) => (
              <Image
                key={index}
                src={src}
                alt={`Adbuth Office ${index}`}
                width={800}
                height={600}
                className="h-full w-auto object-cover max-w-none flex-shrink-0"
                priority={true}
              />
            ))}
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* About Us Text Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto md:px-12 px-8 ">
            <motion.h2
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "transform, opacity" }}
              className="md:text-6xl text-4xl text-capitalize md:text-uppercase font-semibold md:font-bold font-black uppercase tracking-tight mb-8"
            >
              <span className="text-[#7D287E]">About</span> <span className="text-[#FCD804]">Us</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-6 text-gray-700 text-sm leading-relaxed text-justify"
            >
              <p>
                Adbuth Verse is a dynamic post production studio fueled by a team of passionate, skilled professionals from all across India, united by a shared commitment to excellence. Our exceptional expertise and innovative spirit form the foundation of every project we undertake. We are your trusted partner for all your video editing needs, from the initial creative concept to the final polished masterpiece.
              </p>
              <p className="md:font-semibold">
                We don't just edit; we transform your ideas into stunning visual stories.
              </p>

              {/* Mobile: Collapsible content */}
              <div className="md:hidden">
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-6 overflow-hidden"
                    >
                      <p>
                        At Adbuth Verse, every client is unique, and we pride ourselves on offering a versatile suite of services tailored to projects of any size or scope. Equipped with the latest industry-standard tools, we harness cutting-edge software like DaVinci Resolve, Adobe Creative Cloud, and Final Cut Pro to provide you with excellent online editing service. Additionally, specialized hardware like colour-calibrated high-resolution monitors, Apple devices, and colour-grading panels by Black Magic play pivotal roles in achieving seamless post-production workflows and delivering highest quality video editing products to our customers. Our online editing services involve high-quality rendering, color grading, visual effects, and sound synchronization.
                      </p>
                      <p>
                        At Adbuth Verse, creativity and precision are at the core of everything we do. Whether it's crafting a flawless advertisement, a cinematic short film, a corporate video, a vibrant YouTube video, or a cherished personal memory brought to life, our top-tier video editing services cater to both professional and personal aspirations. We're here to refine your footage, enhance your visuals, and elevate your story with unmatched brilliance.
                      </p>
                      <p>
                        Adbuth Verse is your go-to partner for all your video editing and post-production needs.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* View More Button */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-4 text-[#7D287E] font-bold text-sm uppercase tracking-widest    transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  {isExpanded ? "View Less" : "View More"}
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronUp : faChevronDown}
                    className="text-xs transition-transform duration-300"
                  />
                </button>
              </div>

              {/* Desktop: Always show full content */}
              <div className="hidden md:block space-y-6">
                <p>
                  At Adbuth Verse, every client is unique, and we pride ourselves on offering a versatile suite of services tailored to projects of any size or scope. Equipped with the latest industry-standard tools, we harness cutting-edge software like DaVinci Resolve, Adobe Creative Cloud, and Final Cut Pro to provide you with excellent online editing service. Additionally, specialized hardware like colour-calibrated high-resolution monitors, Apple devices, and colour-grading panels by Black Magic play pivotal roles in achieving seamless post-production workflows and delivering highest quality video editing products to our customers. Our online editing services involve high-quality rendering, color grading, visual effects, and sound synchronization.
                </p>
                <p>
                  At Adbuth Verse, creativity and precision are at the core of everything we do. Whether it's crafting a flawless advertisement, a cinematic short film, a corporate video, a vibrant YouTube video, or a cherished personal memory brought to life, our top-tier video editing services cater to both professional and personal aspirations. We're here to refine your footage, enhance your visuals, and elevate your story with unmatched brilliance.
                </p>
                <p>
                  Adbuth Verse is your go-to partner for all your video editing and post-production needs.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Vision and Mission Section */}
        <section className="py-16 bg-black text-white">
          <div className="max-w-7xl mx-auto md:px-12 px-8">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl font-black uppercase tracking-wider mb-12 text-gray-400 "
            >
              VISION AND MISSION
            </motion.h3>

            <div className="space-y-10">
              <div>
                <h4 className="text-xl font-bold mb-3 text-white">Vision</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  To be a symbol of limitless creativity and unwavering quality as our company strives to be recognized for delivering exceptional post production work to a global audience, inspiring creators and businesses worldwide with visuals that captivate, resonate, and endure through our video editing services.
                </p>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-3 text-white">Mission</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We aim to transform every creative vision into a masterpiece with precision, passion, and unparalleled video editing expertise and to be inspiring-encouraging individuals who pursue their passion and reach for the stars.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Meet The Founders Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto md:px-6 px-8 text-center">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold uppercase text-gray-700 mb-12"
            >
              MEET THE FOUNDERS OF ADBUTH VERSE
            </motion.h3>

            <div className="flex flex-wrap justify-center gap-12">
              {/* Founder 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center group"
              >
                <div className="relative w-64 h-64 rounded-xl mb-4 overflow-hidden shadow-lg border border-purple-100/10">
                  <Image src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Angilika%20Jaya%20Venkata%20Kiran.png" alt="Angilika Jaya Venkat Kiran" fill className="object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h4 className="font-bold text-black text-sm group-hover:text-[#7D287E] transition-colors">Angilika Jaya Venkat Kiran</h4>
                <p className="text-xs text-gray-500">Managing Director</p>
              </motion.div>
              {/* Founder 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileHover={{ y: -10 }}
                className="flex flex-col items-center group"
              >
                <div className="relative w-64 h-64 rounded-xl mb-4 overflow-hidden shadow-lg border border-purple-100/10">
                  <Image src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Thorani%20Venu.png" alt="Venu Thorani" fill className="object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h4 className="font-bold text-black text-sm group-hover:text-[#7D287E] transition-colors">Venu Thorani</h4>
                <p className="text-xs text-gray-500">Managing Director</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="py-16 bg-gray-200">
          <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold uppercase text-gray-700 mb-12"
            >
              OUR TEAM AT ADBUTH VERSE
            </motion.h3>

            {/* Mobile: Infinite Scrolling Rows */}
            <div className="md:hidden overflow-hidden space-y-6">
              {/* First Row - Scroll Right */}
              <motion.div
                className="flex gap-4"
                style={{ willChange: "transform" }}
                animate={{
                  x: [0, -1000],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 30,
                    ease: "linear",
                  },
                }}
              >
                {[...Array(3)].map((_, repeatIndex) => (
                  <div key={repeatIndex} className="flex gap-4">
                    {[
                      { name: "Rakesh Mungara", role: "Business Development Manager", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Rakesh%20Mungara.png" },
                      { name: "Murali Krishna", role: "HR Manager", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Murali%20Krishna.png" },
                      { name: "Sai Sireesha", role: "Data Management Executive", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Sai%20Sireesha.png" },
                      { name: "Rajesh Alathore", role: "Senior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Rajesh.png" },
                      { name: "Vikram Kishore", role: "Senior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Vikram%20Kishore.png" },
                      { name: "Sukumar", role: "Senior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Sukumar.png" },
                      { name: "Sai Chaitanya", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Sai%20Chaitanya.png" },
                    ].map((member, i) => (
                      <div
                        key={`row1-${repeatIndex}-${i}`}
                        className="flex flex-col items-start text-left flex-shrink-0 w-[150px]"
                      >
                        <div className="relative w-full aspect-square rounded-xl mb-3 overflow-hidden shadow-md bg-black">
                          <Image src={member.image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg"} alt={member.name} fill className="object-cover object-top" />
                        </div>
                        <h4 className="font-bold text-black text-sm">{member.name}</h4>
                        <p className="text-[10px] text-gray-600">{member.role}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </motion.div>

              {/* Second Row - Scroll Left */}
              <motion.div
                className="flex gap-4"
                style={{ willChange: "transform" }}
                animate={{
                  x: [-1000, 0],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 30,
                    ease: "linear",
                  },
                }}
              >
                {[...Array(3)].map((_, repeatIndex) => (
                  <div key={repeatIndex} className="flex gap-4">
                    {[
                      { name: "Simhadri", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Simahadri.png" },
                      { name: "Praneeth", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Praneeth%20..png" },
                      { name: "Yaswanth Kumar", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Yaswanth%20Kumar.png" },
                      { name: "Yaseen Shareef", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Yassen%20Shareef.png" },
                      { name: "Shah Basha", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Shah%20basha.png" },
                      { name: "Prudhivi Raj", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/prudhvi%20raj.png" },
                      { name: "Venkata Lokesh", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Venkata%20Lokesh.png" },
                    ].map((member, i) => (
                      <div
                        key={`row2-${repeatIndex}-${i}`}
                        className="flex flex-col items-start text-left flex-shrink-0 w-[150px]"
                      >
                        <div className="relative w-full aspect-square rounded-xl mb-3 overflow-hidden shadow-md bg-black">
                          <Image src={member.image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg"} alt={member.name} fill className="object-cover object-top" />
                        </div>
                        <h4 className="font-bold text-black text-sm">{member.name}</h4>
                        <p className="text-[10px] text-gray-600">{member.role}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Desktop: Static Grid */}
            <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-8 ">
              {[
                { name: "Rakesh Mungara", role: "Business Development Manager", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Rakesh%20Mungara.png" },
                { name: "Murali Krishna", role: "HR Manager", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Murali%20Krishna.png" },
                { name: "Sai Sireesha", role: "Data Management Executive", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Sai%20Sireesha.png" },
                { name: "Rajesh Alathore", role: "Senior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Rajesh.png" },
                { name: "Vikram Kishore", role: "Senior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Vikram%20Kishore.png" },
                { name: "Sukumar", role: "Senior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Sukumar.png" },
                { name: "Sai Chaitanya", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Sai%20Chaitanya.png" },
                { name: "Simhadri", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Simahadri.png" },
                { name: "Praneeth", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Praneeth%20..png" },
                { name: "Yaswanth Kumar", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Yaswanth%20Kumar.png" },
                { name: "Yaseen Shareef", role: "Junior Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Yassen%20Shareef.png" },
                { name: "Shah Basha", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Shah%20basha.png" },
                { name: "Prudhivi Raj", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/prudhvi%20raj.png" },
                { name: "Venkata Lokesh", role: "Editor", image: "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/about/Venkata%20Lokesh.png" },
              ].map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  style={{ willChange: "transform, opacity" }}
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-start text-left group"
                >
                  <div className="relative w-full aspect-square rounded-xl mb-3 overflow-hidden shadow-md border-2 border-transparent group-hover:border-[#FCD804] transition-all duration-300">
                    <div className="relative w-full h-full">
                      <Image src={member.image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg"} alt={member.name} fill className="object-cover object-top transition-transform duration-500" />
                    </div>
                  </div>
                  <h4 className="font-bold text-black text-sm group-hover:text-[#7D287E] transition-colors">{member.name}</h4>
                  <p className="text-[10px] text-gray-600">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
