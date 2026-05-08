import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTools, faRocket, faEnvelope } from '@fortawesome/free-solid-svg-icons'
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/30 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />
      </div>

      <div className="z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo Placeholder - Can be replaced with actual image if needed */}
          <div className="mb-8 text-4xl md:text-5xl font-playfair font-bold text-white tracking-wider">
            ADBUTH <span className="text-purple-500">VERSE</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 flex justify-center items-center gap-4 text-purple-400"
        >
          <FontAwesomeIcon icon={faTools} className="text-3xl" />
          <FontAwesomeIcon icon={faRocket} className="text-4xl text-white" />
          <FontAwesomeIcon icon={faTools} className="text-3xl" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl md:text-6xl font-bold mb-6"
        >
          Something Awesome Is <span className="text-purple-500">Brewing</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl"
        >
          We are currently working hard behind the scenes to bring you the ultimate creative and tech platform. The new Adbuth Verse experience is almost ready to launch.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md"
        >
          <a
            href="mailto:contact@adbuthverse.com"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            Contact Us
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-8 text-gray-500 text-sm z-10">
        &copy; {new Date().getFullYear()} Adbuth Verse. All rights reserved.
      </div>
    </div>
  )
}
