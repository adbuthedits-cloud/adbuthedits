import { motion } from 'framer-motion';
import React from 'react';

const ClipTypeStagger = ({ children, delay = 0, stagger = 0.05, duration = 0.8, className = "", mode = "line" }) => {
    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: stagger,
                delayChildren: delay,
            },
        },
    };

    const itemVariants = {
        hidden: { y: "100%", opacity: 0 },
        visible: {
            y: "0%",
            opacity: 1,
            transition: {
                duration: duration,
                ease: [0.33, 1, 0.68, 1],
            },
        },
    };

    const renderChildren = () => {
        if (mode === "word" && typeof children === "string") {
            return children.split(" ").map((word, i) => (
                <div key={i} className="inline-block overflow-hidden mr-[0.25em] pb-16 -mb-16 pr-1">
                    <motion.div variants={itemVariants} className="inline-block">
                        {word}
                    </motion.div>
                </div>
            ));
        }

        return React.Children.map(children, (child, i) => (
            <div key={i} className="overflow-hidden pb-16 -mb-16">
                <motion.div variants={itemVariants}>
                    {child}
                </motion.div>
            </div>
        ));
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className={`${mode === "word" ? "inline-block" : "flex flex-col"} ${className}`}
        >
            {renderChildren()}
        </motion.div>
    );
};

export default ClipTypeStagger;
