import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ServiceDrawer({ subServices, isActive }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 100 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full h-full flex overflow-x-scroll md:overflow-x-hidden"
        >
            {subServices.map((sub, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                    className="flex-shrink-0 flex md:flex-1 h-full w-[200px] md:w-[300px] relative group cursor-pointer border-l border-white/20 first:border-l-0 "
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                        style={{ backgroundImage: `url(${sub.img})` }}
                    />
                    <Link href={sub.link}>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />

                        <div className="absolute bottom-0 left-0 w-full p-6">

                            <h3 className="text-white font-bold text-xl md:text-2xl leading-tight transform translate-y-0 transition-transform duration-300 group-hover:-translate-y-2">
                                {sub.title}
                            </h3>

                        </div>
                    </Link>

                </motion.div>
            ))}
        </motion.div>
    );
}
