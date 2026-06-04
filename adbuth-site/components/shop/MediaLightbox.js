import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Image as ImageIcon, Volume2, VolumeX } from 'lucide-react';

export default function MediaLightbox({ media = [], initialIndex = 0, onClose }) {
    const [index, setIndex] = useState(initialIndex);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef(null);
    const touchStartX = useRef(null);

    const current = media[index];
    const total = media.length;

    const next = () => setIndex(i => (i + 1) % total);
    const prev = () => setIndex(i => (i - 1 + total) % total);

    // Auto play video when it becomes current
    useEffect(() => {
        if (videoRef.current && current?.type === 'video') {
            videoRef.current.play().catch(() => { });
        }
    }, [index]);

    // Sync volume/muted state with ref
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted, index]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Touch swipe
    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) next();
            else prev();
        }
        touchStartX.current = null;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[3000] flex flex-col"
                style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Top bar: Close + Counter */}
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-2 flex-shrink-0">
                    {/* Counter */}
                    <div
                        className="text-sm text-white/70 font-medium px-3 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
                    >
                        {index + 1} / {total}
                    </div>

                    {/* Type badge */}
                    <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold"
                        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)' }}
                    >
                        {current?.type === 'video'
                            ? <><Play size={11} className="fill-white" /> Video</>
                            : <><ImageIcon size={11} /> Image</>
                        }
                    </div>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-white transition"
                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main media + side nav */}
                <div className="flex-1 flex items-center justify-center min-h-0 px-2 sm:px-12 py-2 gap-3">
                    {/* Prev */}
                    {total > 1 && (
                        <button
                            onClick={prev}
                            className="hidden sm:flex flex-shrink-0 w-11 h-11 items-center justify-center rounded-full text-white transition hover:scale-110"
                            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
                        >
                            <ChevronLeft size={22} />
                        </button>
                    )}

                    {/* Media display */}
                    <div className="flex-1 flex items-center justify-center min-h-0 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="relative w-full flex items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl"
                                style={{
                                    maxHeight: '70vh'
                                }}
                            >
                                {current?.type === 'video' ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            src={current.src}
                                            className="h-[70vh] w-auto max-w-full object-contain mx-auto"
                                            controls
                                            autoPlay
                                            muted={isMuted}
                                            playsInline
                                            loop
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMuted(!isMuted);
                                            }}
                                            className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/10 hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto shadow-lg outline-none"
                                            aria-label={isMuted ? "Unmute video" : "Mute video"}
                                            title={isMuted ? "Unmute" : "Mute"}
                                        >
                                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                        </button>
                                    </>
                                ) : (
                                    <img
                                        src={current?.src}
                                        alt={`Media ${index + 1}`}
                                        className="max-w-full max-h-[70vh] w-auto object-contain"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Next */}
                    {total > 1 && (
                        <button
                            onClick={next}
                            className="hidden sm:flex flex-shrink-0 w-11 h-11 items-center justify-center rounded-full text-white transition hover:scale-110"
                            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
                        >
                            <ChevronRight size={22} />
                        </button>
                    )}
                </div>

                {/* Mobile prev/next row (shown below on small screens) */}
                {total > 1 && (
                    <div className="sm:hidden flex justify-center gap-6 pt-1 pb-2">
                        <button
                            onClick={prev}
                            className="w-11 h-11 flex items-center justify-center rounded-full text-white"
                            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            onClick={next}
                            className="w-11 h-11 flex items-center justify-center rounded-full text-white"
                            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                )}

                {/* Thumbnail strip */}
                {total > 1 && (
                    <div className="flex-shrink-0 px-4 pb-4 sm:pb-5 pt-2">
                        <div
                            className="flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl overflow-x-auto justify-start sm:justify-center"
                            style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {media.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    className={`relative flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden transition-all ${i === index
                                        ? 'ring-2 ring-purple-400 scale-105 opacity-100'
                                        : 'opacity-50 hover:opacity-80'
                                        }`}
                                    style={{ width: 'clamp(44px, 10vw, 64px)', height: 'clamp(56px, 13vw, 80px)' }}
                                >
                                    {item.type === 'video' ? (
                                        <>
                                            <video
                                                src={item.src}
                                                className="w-full h-full object-cover pointer-events-none"
                                                muted
                                                preload="metadata"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <Play size={12} className="text-white fill-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <img
                                            src={item.src}
                                            alt={`Thumb ${i + 1}`}
                                            className="w-full h-full object-cover pointer-events-none"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
