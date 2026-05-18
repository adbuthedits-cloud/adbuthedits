import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

// `media` prop: array of { src: string, type: 'image' | 'video' }
// `images` prop: legacy string array (backwards compat)
// `onCardClick(index)`: called when center card is clicked — opens lightbox
export default function ImageStack({ media, images = [], layout = 'vertical', productTitle = "Product Title", onCardClick }) {
    const mediaItems = media
        ? media
        : images.map(src => ({ src, type: 'image' }));

    const containerRef = useRef(null);
    const scrollAccumulator = useRef(0);
    const isHovering = useRef(false);
    const videoRef = useRef(null);
    const touchStartX = useRef(null);
    const [index, setIndex] = useState(0);

    const nextCard = () => setIndex((prev) => (prev + 1) % mediaItems.length);
    const prevCard = () => setIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

    // Auto-play video when it becomes center
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    }, [index]);

    // Mouse wheel navigation (desktop)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheelNative = (e) => {
            if (!isHovering.current || mediaItems.length <= 1) return;
            e.preventDefault();
            e.stopPropagation();
            scrollAccumulator.current += e.deltaY;
            if (Math.abs(scrollAccumulator.current) > 80) {
                if (scrollAccumulator.current > 0) nextCard();
                else prevCard();
                scrollAccumulator.current = 0;
            }
        };
        container.addEventListener('wheel', handleWheelNative, { passive: false });
        return () => container.removeEventListener('wheel', handleWheelNative);
    }, [mediaItems.length]);

    // Touch swipe navigation (mobile/tablet)
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) nextCard();
            else prevCard();
        }
        touchStartX.current = null;
    };

    if (!mediaItems || mediaItems.length === 0) return null;

    const handleCardClick = (i, isCenter) => {
        if (!isCenter) {
            setIndex(i);
        } else {
            if (onCardClick) onCardClick(i);
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-center select-none">
            {/* Stack area */}
            <div
                ref={containerRef}
                onMouseEnter={() => { isHovering.current = true; }}
                onMouseLeave={() => { isHovering.current = false; scrollAccumulator.current = 0; }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative w-full flex items-start justify-center overflow-hidden"
                style={{
                    height: layout === 'horizontal'
                        ? 'clamp(200px, 60vw, 460px)'   // shorter for 16:9 cards, increased to fit wider card
                        : 'clamp(410px, 83vw, 640px)'   // taller for 9:16 portrait cards
                }}
            >
                {mediaItems.map((item, i) => {
                    const isCenter = i === index;
                    const isNext = !isCenter && i === (index + 1) % mediaItems.length;
                    const isPrev = !isCenter && !isNext && i === (index - 1 + mediaItems.length) % mediaItems.length;

                    const isVisible = isCenter || isNext || isPrev || mediaItems.length <= 3;

                    // Responsive offsets: larger for horizontal cards because they are wider
                    const offset = layout === 'horizontal' ? 250 : 130;

                    return (
                        <motion.div
                            key={`${item.src || 'media'}-${i}`}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: isCenter ? 1 : isVisible ? 0.4 : 0,
                                scale: isCenter ? 1 : isVisible ? 0.82 : 0.8,
                                zIndex: isCenter ? 30 : isNext ? 20 : isPrev ? 10 : 0,
                                y: 0,
                                x: isPrev ? -offset : isNext ? offset : 0,
                                rotateX: 0,
                                rotateY: isPrev ? -12 : isNext ? 12 : 0,
                                filter: isCenter ? 'blur(0px)' : isVisible ? 'blur(2px)' : 'blur(4px)',
                            }}
                            transition={{ type: "spring", stiffness: 260, damping: 25 }}
                            style={{
                                perspective: 1200,
                                // Horizontal (16:9): wider card, landscape ratio
                                // Vertical (9:16): narrower card, portrait ratio
                                width: layout === 'horizontal'
                                    ? 'clamp(280px, 85vw, 580px)'
                                    : 'clamp(200px, 42vw, 330px)',
                                aspectRatio: layout === 'horizontal' ? '16 / 9' : '9 / 16',
                                pointerEvents: isVisible ? 'auto' : 'none',
                            }}
                            onClick={() => {
                                if (isVisible) handleCardClick(i, isCenter);
                            }}
                            className={`absolute rounded-2xl sm:rounded-3xl overflow-hidden  bg-black border border-gray-100 ${isCenter ? 'cursor-zoom-in' : 'cursor-pointer'}`}
                        >
                            {item.type === 'video' ? (
                                <video
                                    ref={isCenter ? videoRef : null}
                                    src={item.src}
                                    className="w-full h-full object-cover pointer-events-none"
                                    autoPlay={isCenter}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                />
                            ) : (
                                <img
                                    src={item.src}
                                    alt={`Product media ${i + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-700 pointer-events-none"
                                />
                            )}

                            {/* Center card overlay */}
                            {isCenter && (
                                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/70 to-transparent text-white flex justify-between items-end pointer-events-none">
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-purple-300 font-bold flex items-center gap-1">
                                            {item.type === 'video'
                                                ? <><Play size={9} className="fill-purple-300" /> Tap to Watch</>
                                                : 'Premium'
                                            }
                                        </p>
                                        <h3 className="text-sm sm:text-lg font-semibold line-clamp-1">{productTitle}</h3>
                                    </div>
                                    <ChevronRight size={18} />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Prev / Next arrow buttons (visible on all screens) */}
            {mediaItems.length > 1 && (
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <button
                        onClick={prevCard}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200  shadow-sm hover:border-purple-400 hover:text-purple-600 transition"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {/* Dot indicators */}
                    <div className="flex gap-2">
                        {mediaItems.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === index ? 'w-8 bg-purple-600' : 'w-2 bg-gray-300'}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextCard}
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:border-purple-400 hover:text-purple-600 transition"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
