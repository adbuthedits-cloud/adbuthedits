"use client";
import { motion } from 'framer-motion';

export const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
};

export const CardSkeleton = () => (
    <div className="bg-[#1E1628] rounded-[18px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] animate-pulse">
        <div className="h-40 bg-[#130C1C] rounded-xl mb-6"></div>
        <div className="h-4 bg-[#130C1C] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[#130C1C] rounded w-1/2"></div>
    </div>
);

export const TableSkeleton = () => (
    <div className="bg-[#1E1628] rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] overflow-hidden">
        <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-[#130C1C] rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#130C1C] rounded w-1/4"></div>
                        <div className="h-3 bg-[#130C1C] rounded w-1/3"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const FadeIn = ({ children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

export const SlideIn = ({ children, direction = 'left', delay = 0 }) => {
    // Professional subtle micro-displacements
    const directions = {
        left: { x: -8 },
        right: { x: 8 },
        up: { y: -8 },
        down: { y: 8 }
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction], scale: 0.995 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.22, 1, 0.36, 1]
            }}
        >
            {children}
        </motion.div>
    );
};

export const ScaleIn = ({ children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
        {children}
    </motion.div>
);

export const TableRowFade = ({ children, index = 0, className = "" }) => (
    <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{
            duration: 0.4,
            delay: index * 0.05,
            ease: [0.22, 1, 0.36, 1]
        }}
        className={`hover:bg-[#2d1b4e]/30 transition-colors ${className}`}
    >
        {children}
    </motion.tr>
);
