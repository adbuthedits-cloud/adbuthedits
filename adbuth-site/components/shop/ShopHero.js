import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ShopHero({
    title = (
        <>
            Celebrate Birthdays In Style — Send <br /> Joy Digitally!
        </>
    ),
    description = "From fun and quirky to elegant and heartfelt, explore birthday invitations for everyone you love.",
    bgImage = "images/shop banner.png",
    height = "100vh",
    showAiButton = true
}) {
    return (
        <div className="relative w-full h-[100vh] min-h-[500px] flex flex-col items-start justify-center text-left px-4 overflow-hidden">
            {/* Background - placeholder color or image */}
            <div className="mt-24 absolute inset-0  z-0">
                <Image 
                    src={bgImage} 
                    alt="shop hero" 
                    fill 
                    priority 
                    sizes="100vw"
                    className="object-cover" 
                />
            </div>


            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-24  text-white">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-semibold mb-8 mt-24 leading-normal"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-lg text-gray-200 mb-8 max-w-2xl "
                >
                    {description}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-start justify-start gap-4"
                >
                    <Link href="#browse" className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                        Browse Templates
                    </Link>
                    {showAiButton && (
                        <button className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors">
                            Let AI pick for me
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
