"use client";
import { motion } from 'framer-motion';

export default function Loading() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#130C1C]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    {/* Main Pulse Circle */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-24 h-24 rounded-full bg-[#7C3AED]/20 absolute -inset-4 blur-xl"
                    />

                    {/* Spinning Ring */}
                    <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#7C3AED] animate-spin shadow-[0_0_15px_rgba(124,58,237,0.5)]"></div>

                    {/* Inner Logo/Icon placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/30 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-ping" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white font-bold tracking-widest text-sm uppercase"
                    >
                        Adbuth Admin
                    </motion.h2>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em]">Initialising System</span>
                        <span className="flex gap-1">
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1 h-1 bg-[#a78bfa] rounded-full" />
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-[#a78bfa] rounded-full" />
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-[#a78bfa] rounded-full" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
