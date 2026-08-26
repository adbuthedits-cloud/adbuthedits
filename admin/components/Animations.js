"use client";
import { motion } from 'framer-motion';

export const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
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

export const FadeIn = ({ children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.05 }}
    >
        {children}
    </motion.div>
);

export const SlideIn = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.05 }}
        >
            {children}
        </motion.div>
    );
};

export const ScaleIn = ({ children }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.05 }}
    >
        {children}
    </motion.div>
);

export const TableRowFade = ({ children, className = "" }) => (
    <tr className={`hover:bg-[#2d1b4e]/30 transition-colors ${className}`}>
        {children}
    </tr>
);
