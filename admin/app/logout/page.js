"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faArrowRight, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { logout } from '../../utils/auth';

export default function Logout() {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(3);

    useEffect(() => {
        logout(); // Clear all tokens

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        const timer = setTimeout(() => {
            router.push('/login');
        }, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#130C1C] px-4 font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#a78bfa]/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="relative z-10 w-full max-w-md bg-[#1a1025] border border-[#2d1b4e] p-8 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center backdrop-blur-sm"
            >
                {/* Icon Wrapper */}
                <div className="w-20 h-20 mx-auto mb-6 relative">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-[#7C3AED]/20 rounded-full blur-md"
                    />
                    <div className="relative w-full h-full bg-[#2d1b4e] rounded-full flex items-center justify-center border border-[#3b2a5f] shadow-inner text-[#a78bfa]">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-3xl" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#130C1C] rounded-full flex items-center justify-center border border-[#2d1b4e]">
                        <FontAwesomeIcon icon={faSignOutAlt} className="text-[10px] text-gray-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Logged Out</h1>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    You have been successfully signed out.<br />
                    Redirecting to login in <span className="text-[#a78bfa] font-bold">{timeLeft}s</span>...
                </p>

                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="group w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                    >
                        <span>Sign In Again</span>
                        <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <div className="text-xs text-gray-500 font-medium">
                        © 2025 Adbuth Admin Panel
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
