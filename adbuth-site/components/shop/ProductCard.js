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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProductCard({ product, index = 0 }) {
    const [wishlisted, setWishlisted] = useState(false);
    // isPlaying: video is actively playing
    const [isPlaying, setIsPlaying] = useState(false);
    // isHovered: mouse is currently over the card
    const [isHovered, setIsHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    // Lazy-loaded video URL — fetched on first hover to keep page payload small
    const [lazyVideoSrc, setLazyVideoSrc] = useState(null);
    const [videoFetched, setVideoFetched] = useState(false);
    const containerRef = useRef(null);
    const videoRef = useRef(null);

    // ── Client-side mount + IntersectionObserver ──────────────────────────────
    useEffect(() => {
        setIsMounted(true);
        if (!containerRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin: '150px' }
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // ── Stop video when scrolled off-screen ───────────────────────────────────
    useEffect(() => {
        if (!isVisible && isPlaying) setIsPlaying(false);
    }, [isVisible, isPlaying]);

    // ── Drive the <video> element ─────────────────────────────────────────────
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;
        if (isPlaying) {
            const p = vid.play();
            if (p !== undefined) p.catch(() => {});
        } else {
            vid.pause();
            vid.currentTime = 0;
        }
    }, [isPlaying]);

    // ── Lazy-fetch video URL on first hover ───────────────────────────────────
    const handleMouseEnter = () => {
        setIsHovered(true);
        // Only fetch if no video data was included in the page props
        if (!videoFetched && product.slug && !product.video?.[0] && !product.video_url) {
            setVideoFetched(true);
            fetch(`${API_URL}/api/products/${product.slug}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data?.video?.[0] || data?.video_url) {
                        setLazyVideoSrc(cdnVideo(data.video?.[0] || data.video_url));
                    }
                })
                .catch(() => {});
        }
    };

    // ── Mouse leave: stop video + mark as not hovered ─────────────────────────
    const handleMouseLeave = () => {
        setIsHovered(false);
        setIsPlaying(false); // always stop when pointer leaves
    };

    // ── Click play: start video, button hides automatically ───────────────────
    const handlePlayClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPlaying(true); // button hides because showPlayButton = isHovered && !isPlaying
    };

    if (!product) return null;

    const isNew = isNewProduct(product.updatedAt || product.updated_at);
    const rating = (product.averageRating && !isNaN(parseFloat(product.averageRating)))
        ? parseFloat(product.averageRating).toFixed(1)
        : null;
    const reviewCount = product.reviewCount ? parseInt(product.reviewCount) : 0;

    const parentSlug = product.parentCategory?.slug || 'all';
    const eventSlug = product.assetCategory?.slug || 'general';
    const productSlug = product.slug || '';
    const productUrl = `/shop/category/${parentSlug}/${eventSlug}/${productSlug}`;

    const thumbnail = product.thumbnail ? cdnImage(product.thumbnail) : null;
    // lazyVideoSrc wins when lazy-loaded; fall back to inline props
    const videoSrc = lazyVideoSrc ||
        (product.video?.[0] || product.video_url
            ? cdnVideo(product.video?.[0] || product.video_url)
            : null);

    const hasDiscount = product.compared_price && product.compared_price > product.price;
    const discountPct = hasDiscount
        ? Math.round(((product.compared_price - product.price) / product.compared_price) * 100)
        : 0;

    // Button visibility (pure React state, no CSS group-hover tricks):
    //   • Not hovered            → hidden
    //   • Hovered + not playing  → visible (▶ play icon)
    //   • Hovered + playing      → hidden  (video is showing, no UI clutter)
    const showPlayButton = isHovered && !isPlaying && videoSrc;

    return (
        <div
            className="relative flex flex-col bg-white hover:shadow-md transition-shadow duration-200"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Image / Video Container ─────────────────────────────────── */}
            <Link
                href={productUrl}
                className="block relative overflow-hidden bg-gray-50"
                style={{ aspectRatio: '3/4' }}
                ref={containerRef}
            >
                {/* Thumbnail — fades out when video plays */}
                {thumbnail ? (
                    <Image
                        src={thumbnail}
                        alt={product.title || 'Product Image'}
                        fill
                        className={`object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        priority={index < 8}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-300 text-[10px]">No Preview</span>
                    </div>
                )}

                {/* Video element — mounted client-side only, when in viewport */}
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

                {/* ▶ Play button — only when hovered AND not playing */}
                {showPlayButton && (
                    <button
                        onClick={handlePlayClick}
                        aria-label="Play preview"
                        className="absolute inset-0 m-auto w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center z-20 shadow-lg border border-white/20 transition-colors duration-150"
                    >
                        <svg className="w-5 h-5 fill-white ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
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

            {/* ── Wishlist Button ─────────────────────────────────────────── */}
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

            {/* ── Product Info ────────────────────────────────────────────── */}
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
