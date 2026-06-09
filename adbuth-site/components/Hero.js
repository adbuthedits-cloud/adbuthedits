import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ClipTypeStagger from "./creative/ClipTypeStagger";
import { cdnUrl } from "../utils/cdn";

const HERO_BG = cdnUrl("https://assets.adbuthverse.com/website-assets/pages/home/hero-section.webp");

export default function Hero() {
  return (
    <section className="relative w-full lg:min-h-screen  mb-56 md:mb-12 lg:mb-0 flex items-center pt-32 pb-56 md:pb-24 lg:py-0 bg-[#0a0118] text-white">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src={HERO_BG}
          alt="Hero Background"
          fill
          priority
          fetchpriority="high"
          quality={80}
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Background Effects */}


      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-14 lg:px-6 relative z-10 lg:pt-24">

        {/* Text Section */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <h1 className="text-4xl md:text-4xl lg:text-7xl font-bold leading-tight tracking-tight">
            Great stories deserve great editing
          </h1>
          <div className="mt-6">
            <p className="text-gray-200 text-lg md:text-xl">
              At Adbuth Verse, we make sure your visions don't just come to life, they shine.
            </p>
          </div>
        </div>

        {/* Mobile Card Section - Perfectly Centered */}
        <div className="md:hidden w-full flex justify-center mt-12 -mb-96">
          <div className="w-full max-w-[320px]">
            <HeroCard />
          </div>
        </div>

        {/* Desktop Card Section - Unchanged */}
        <div className="hidden md:flex md:justify-end md:ml-auto w-full md:max-w-xs lg:max-w-sm">
          <div className="w-full">
            <HeroCard />
          </div>
        </div>
      </div>
    </section>
  )
}

// Sub-component to keep the card design consistent across both views
function HeroCard() {
  return (
    <div className="relative w-full h-full">
      {/* Card Container with Glow */}
      <div className="relative bg-[#0f0518] border border-purple-500 rounded-[2rem] p-6 lg:p-10 md:p-8 shadow-[0_0_30px_rgba(124,58,237,0.6)]">
        {/* Inner Glow Border Effect */}
        <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_40px_rgba(124,58,237,0.25)] pointer-events-none"></div>

        <div className="text-center mb-6 md:mb-6 lg:mb-8 relative z-10">
          <p className="text-sm md:text-sm lg:text-lg font-medium text-white leading-relaxed">
            "Lights. Camera, Action!
            <br />
            I'm Adi, your creative assistant at
            <br />
            Adbuth Edits, Want help picking
            <br />
            the perfect service or just here
            <br />
            to explore our studio magic?'
          </p>
        </div>

        <div className="flex flex-col gap-3 md:gap-4 relative z-10">
          <Link href="/services/videos" className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[13px] md:text-xs lg:text-sm font-medium text-center">
            I want to edit a video
          </Link>
          <Link href="/services/designing/adbuth-e-invitations" className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[13px] md:text-xs lg:text-sm font-medium text-center">
            I want to design a Digital Invitations
          </Link>
          <Link href="/contact-us" className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[13px] md:text-xs lg:text-sm font-medium text-center">
            Connect with our team
          </Link>
          <Link href="/contact-us" className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[13px] md:text-xs lg:text-sm font-medium text-center">
            Message Adi
          </Link>
        </div>
      </div>
    </div>
  )
}
