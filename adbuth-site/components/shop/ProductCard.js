/**
 * ProductCard.js
 * 
 * A clean, professional product card with:
 * - No rounded corners (as per design spec)
 * - NEW badge only if product was updated within the last 15 days
 * - Heart/wishlist icon
 * - Star rating, price, title, description
 * - Links to /shop/category/[parent]/[event]/[slug]
 */
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid, faStar } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { cdnImage, cdnVideo } from '../../utils/cdn';

const NEW_BADGE_DAYS = 15;

function isNewProduct(updatedAt) {
    if (!updatedAt) return false;
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
    return diffDays <= NEW_BADGE_DAYS;
}

export default function ProductCard({ product, index = 0 }) {
    const [wishlisted, setWishlisted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);
    const videoRef = useRef(null);

    // Ensure client-side render and detect viewport visibility
    useEffect(() => {
        setIsMounted(true);

        if (!containerRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { rootMargin: '150px' } // Load video elements slightly before they enter the viewport
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Auto-pause/unload video when the card is scrolled offscreen
    useEffect(() => {
        if (!isVisible && isPlaying) {
            setIsPlaying(false);
        }
    }, [isVisible, isPlaying]);

    // Programmatically play/pause preview video based on isPlaying state
    useEffect(() => {
        if (!videoRef.current) return;
        if (isPlaying) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay prevented or interrupted - silently ignore
                });
            }
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isPlaying]);

    if (!product) return null;

    const isNew = isNewProduct(product.updatedAt || product.updated_at);
    const rating = (product.averageRating && !isNaN(parseFloat(product.averageRating))) 
        ? parseFloat(product.averageRating).toFixed(1) 
        : null;
    const reviewCount = product.reviewCount ? parseInt(product.reviewCount) : 0;

    // Build the product detail URL
    const parentSlug = product.parentCategory?.slug || 'all';
    const eventSlug = product.assetCategory?.slug || 'general';
    const productSlug = product.slug || '';
    const productUrl = `/shop/category/${parentSlug}/${eventSlug}/${productSlug}`;

    // Use web-optimized versions: WebP for images, _web.mp4 for videos
    const thumbnail = product.thumbnail ? cdnImage(product.thumbnail) : null;
    const videoSrc  = product.video?.[0] || product.video_url
        ? cdnVideo(product.video?.[0] || product.video_url)
        : null;

    const hasDiscount = product.compared_price && product.compared_price > product.price;
    const discountPct = hasDiscount
        ? Math.round(((product.compared_price - product.price) / product.compared_price) * 100)
        : 0;

    const handleMouseEnter = () => {
        // Handled automatically by dynamic mounting
    };

    const handleMouseLeave = () => {
        // Handled automatically by dynamic mounting
    };

    return (
        <div className="group relative flex flex-col bg-white hover:shadow-md transition-all duration-200">
            {/* Image Container */}
            <Link
                href={productUrl}
                className="block relative overflow-hidden bg-gray-50"
                style={{ aspectRatio: '3/4' }}
                ref={containerRef}
            >
                {/* Default Thumbnail - Always present for performance */}
                {thumbnail ? (
                    <Image
                        src={thumbnail}
                        alt={product.title || 'Product Image'}
                        fill
                        className={`object-cover transition-opacity duration-300 ${isPlaying && videoSrc ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        priority={index < 8}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-300 text-[10px]">No Preview</span>
                    </div>
                )}

                {/* Client-only video element — preload none to optimize network and only load on play */}
                {isMounted && isVisible && videoSrc && (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        muted
                        loop
                        playsInline
                        preload="none"
                    />
                )}

                {/* Play/Pause Button Overlay */}
                {videoSrc && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPlaying(prev => !prev);
                        }}
                        className="absolute inset-0 m-auto w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all duration-200 z-20 shadow-lg border border-white/20 group/play"
                        aria-label={isPlaying ? "Pause preview" : "Play preview"}
                    >
                        {isPlaying ? (
                            <svg className="w-5 h-5 fill-white transition-transform group-hover/play:scale-110" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 fill-white ml-0.5 transition-transform group-hover/play:scale-110" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>
                )}

                {/* NEW Badge */}
                {isNew && (
                    <span className="absolute top-2 left-0 bg-black text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest z-10">
                        New
                    </span>
                )}

                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute bottom-0 left-0 bg-black/60 text-white px-2.5 py-0.5 z-10 rounded-full ml-2 my-2">
                        <span className="text-[10px] font-bold tracking-tight">{discountPct}% OFF</span>
                    </div>
                )}
            </Link>

            {/* Wishlist Button */}
            <button
                onClick={(e) => { e.preventDefault(); setWishlisted(v => !v); }}
                className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-sm group/wishlist"
                aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            >
                <FontAwesomeIcon
                    icon={wishlisted ? faHeartSolid : faHeartOutline}
                    className={`text-sm transition-transform duration-200 group-active/wishlist:scale-125 ${wishlisted ? 'text-red-500' : 'text-gray-900'}`}
                    aria-hidden="true"
                />
            </button>

            {/* Product Info */}
            <Link href={productUrl} className="flex flex-col p-3 flex-1">
                <p className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-1 mb-1">
                    {product.title}
                </p>
                {product.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                        {product.description}
                    </p>
                )}

                {/* Rating */}
                {rating && (
                    <div className="flex items-center gap-1 mb-2">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[10px]" />
                        <span className="text-[11px] font-semibold text-gray-700">{rating}</span>
                        {reviewCount > 0 && (
                            <span className="text-[10px] text-gray-400">({reviewCount})</span>
                        )}
                    </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-auto">
                    <span className="text-[14px] font-bold text-gray-900">₹{product.price}</span>
                    {hasDiscount && (
                        <>
                            <span className="text-[11px] text-gray-400 line-through">₹{product.compared_price}</span>
                            <span className="text-[11px] font-bold text-green-600">{discountPct}% OFF</span>
                        </>
                    )}
                </div>
            </Link>
        </div>
    );
}
