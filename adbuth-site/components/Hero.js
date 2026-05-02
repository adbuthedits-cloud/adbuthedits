import { motion } from "framer-motion";
import Image from "next/image";
import ClipTypeStagger from "./creative/ClipTypeStagger";

export default function Hero() {
  return (
    <section className="relative lg:min-h-screen  mb-56 md:mb-12 lg:mb-0 flex items-center pt-32 pb-56 md:pb-24 lg:py-0 bg-[#0a0118] text-white">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/hero-section.png"
          alt="Hero Background"
          fill
          priority
          quality={90}
          className="object-cover"
        />
      </div>

      {/* Background Effects */}


      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-14 lg:px-6 relative z-10 lg:pt-24">

        {/* Text Section */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <h1 className="text-4xl md:text-4xl lg:text-7xl font-bold leading-tight tracking-tight">
            <ClipTypeStagger mode="word" duration={.6} stagger={0.2}>
              Great stories deserve great editing
            </ClipTypeStagger>
          </h1>
          <div className="mt-6">
            <ClipTypeStagger mode="word" delay={0.6} duration={1} stagger={0.03}>
              At Adbuth Media works, we make sure your visions don't just come to life, they shine.
            </ClipTypeStagger>
          </div>
        </div>

        {/* Card Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute -bottom-96 left-16 -translate-x-1/2 w-[68%] max-w-[320px] md:static md:transform-none md:w-full md:max-w-xs lg:max-w-sm md:translate-x-0 md:flex md:justify-end md:ml-auto"
        >
          <div className="relative w-full h-full">
            {/* Card Container with Glow */}
            <div className="relative bg-[#0f0518] border border-purple-500 rounded-[2rem] p-6 lg:p-10 md:p-8 shadow-[0_0_30px_rgba(124,58,237,0.6)]">
              {/* Inner Glow Border Effect */}
              <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_0_40px_rgba(124,58,237,0.25)] pointer-events-none"></div>

              <div className="text-center mb-6 md:mb-6 lg:mb-8 relative z-10">
                <p className="text-xs lg:text-lg md:text-sm font-medium text-white leading-relaxed">
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
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { message: "I want to edit a video" } }))} className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[10px] lg:text-sm font-medium">
                  I want to edit a video
                </button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { message: "I want to design a 'Save the Date' card" } }))} className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[10px] lg:text-sm font-medium">
                  I want to design a 'Save the Date card
                </button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { message: "Let's talk commercials & ads" } }))} className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[10px] lg:text-sm font-medium">
                  Let's talk commercials & ads
                </button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { message: "I have a question for Adi" } }))} className="w-full py-2.5 px-4 md:py-3 md:px-6 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-800/40 border border-purple-500 text-white hover:bg-purple-800/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all text-[10px] lg:text-sm font-medium">
                  Message Adi
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
