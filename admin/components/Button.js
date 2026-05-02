"use client";
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

const Button = ({
    children,
    onClick,
    loading = false,
    disabled = false,
    variant = 'primary',
    icon = null,
    className = "",
    type = "button"
}) => {
    const variants = {
        primary: "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-purple-900/20",
        secondary: "bg-[#2d1b4e] text-gray-200 hover:bg-[#3b2a5f] hover:text-white border border-[#3b2a5f]",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
        ghost: "bg-transparent text-gray-400 hover:bg-[#2d1b4e] hover:text-white"
    };

    return (
        <motion.button
            whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-lg 
                ${variants[variant]} 
                ${(disabled || loading) ? 'opacity-60 cursor-not-allowed grayscale-[0.5]' : ''} 
                ${className}
            `}
        >
            {loading ? (
                <>
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-lg" />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    {icon && <FontAwesomeIcon icon={icon} className={children ? "text-sm" : "text-lg"} />}
                    {children}
                </>
            )}
        </motion.button>
    );
};

export default Button;
