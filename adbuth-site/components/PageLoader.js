import { motion } from 'framer-motion';

export default function PageLoader() {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            {/* Top Progress Bar */}
            <motion.div
                className="h-1 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-400 origin-left"
                initial={{ scaleX: 0 }}
                animate={{
                    scaleX: [0, 0.5, 0.8, 0.95],
                }}
                transition={{
                    duration: 10,
                    ease: "easeOut"
                }}
            />
        </div>
    );
}
