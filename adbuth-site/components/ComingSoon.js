import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import Head from 'next/head'
import Image from 'next/image'

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <Head>
        <title>Coming Soon | ADBUTH Verse</title>
      </Head>

      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="z-10 flex flex-col items-center text-center px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-12"
        >
          <Image 
            src="https://assets.adbuthverse.com/website-assets/brand/logo.webp" 
            alt="Adbuth Verse Logo" 
            width={240} 
            height={80} 
            className="w-48 md:w-64 object-contain"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Something Awesome Is <span className="text-purple-500">Brewing</span>
          </h1>
          
          <div className="w-20 h-1 bg-purple-600 mx-auto mb-8 rounded-full" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-base md:text-lg text-gray-400 mb-12 max-w-xl leading-relaxed"
        >
          We are refining our platform to provide you with the best experience in creative and technical excellence. Stay tuned for our upcoming launch.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex justify-center"
        >
          <a
            href="mailto:adbuthedits@gmail.com"
            className="group flex items-center justify-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 text-white rounded-full font-medium transition-all duration-500 backdrop-blur-sm"
          >
            <FontAwesomeIcon icon={faEnvelope} className="text-purple-500 group-hover:scale-110 transition-transform duration-300" />
            Contact Support
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-8 text-gray-600 text-xs tracking-widest z-10 font-medium">
        &copy; {new Date().getFullYear()} ADBUTH VERSE &bull; EST. 2024
      </div>
    </div>
  )
}
