import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Image from "next/image";

export default function FAQ({ questions = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(prev => prev === i ? null : i);
  }

  return (
    <section className="py-24 -mt-24 md:mt-0 md:px-10 px-6 bg-[#E8E8E8] lg:bg-[#fff] text-black overflow-hidden relative min-h-screen">
      <div className="absolute inset-0 z-0 hidden lg:block">
        <Image
          src="https://assets.adbuthverse.com/website-assets/pages/home/faq-bg.webp"
          alt="FAQ Background"
          fill
          className="object-cover"
        />
      </div>



      <div className="max-w-3xl mx-auto mdpx-6 relative z-10" >

        <div className="text-center mb-16">
          <h3 className="text-6xl font-medium mb-4 tracking-tight">FAQs</h3>
          <p className="text-gray-500 text-lg">
            Everything You Need to Know Before <br /> Saying Action!
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <button
                onClick={() => toggle(i)}
                className="w-full text-left md:px-8 px-4 py-6 flex justify-between items-center group"
              >
                <span className="font-bold text-gray-900 md:text-lg text-sm pr-8">{q.q}</span>
                <span className={`transform transition-transform duration-300 text-gray-400 ${openIndex === i ? 'rotate-180' : ''}`}>
                  <FontAwesomeIcon icon={faChevronDown} />
                </span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="md:px-8 px-4 pb-8 text-gray-500 text-sm leading-relaxed">
                      {q.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
