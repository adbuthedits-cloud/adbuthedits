/**
 * ProductCard.js
 *
 * LightboxPro-style bento card:
 * - Pure image block - no text footer below the image
 * - Overlay details appear IMMEDIATELY on hover with a smooth slide-up animation
 * - Video starts after 0.5s hover delay
 * - Minimal, elegant overlay: title + price + type badge
 * - Click navigates to full product detail page
 */
import Link from 'next/link';
import { useState, useRef, useEffect, forwardRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid, faStar } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { cdnImage, cdnVideo } from '../../utils/cdn';
import { useWishlist } from '../../context/WishlistContext';

const NEW_BADGE_DAYS = 15;

function isNewProduct(updatedAt) {
    if (!updatedAt) return false;
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
    return diffDays <= NEW_BADGE_DAYS;
}

function getAssetTypeName(product, masterData) {
    if (!product) return null;
    const rawName = product.assetType?.name ||
        (typeof product.assetType === 'string' ? product.assetType : null) ||
        product.asset_type?.name ||
        (typeof product.asset_type === 'string' ? product.asset_type : null) ||
        product.asset_type_name;
    if (rawName) return rawName;
    const typeId = product.asset_type_id || product.assetType?.type_id;
    if (typeId && masterData?.types?.length) {
        const found = masterData.types.find(t => t.type_id === typeId);
        if (found?.name) return found.name;
    }
    return null;
}

export function getOrientation(product, masterData) {
    if (!product) return 'portrait';
    const orientId = product.asset_orientation_id;
    const orient = masterData?.orientations?.find(
        o => o.orientation_id === orientId || o.slug === orientId
    );
    const orientName = orient?.name?.toLowerCase() || '';
    const orientCode = orient?.code?.toLowerCase() || '';

    if (orientName.includes('horizontal') || orientCode === 'hor' || orientCode === 'h&v') return 'landscape';
    if (orientName.includes('square') || orientCode === 'sq') return 'square';
    if (orientName.includes('vertical') || orientCode === 'ver') return 'portrait';

    if (orientId === 2 || orientId === '2') return 'landscape';
    if (orientId === 3 || orientId === '3') return 'square';
    if (orientId === 1 || orientId === '1') return 'portrait';

    const thumb = (product.thumbnail || '').toLowerCase();
    if (thumb.includes('landscape') || thumb.includes('banner') || thumb.includes('horizontal') || thumb.includes('/hor/')) return 'landscape';
    if (thumb.includes('square') || thumb.includes('/sq/')) return 'square';
    if (thumb.includes('vertical') || thumb.includes('/ver/')) return 'portrait';

    const title = (product.title || '').toLowerCase();
    if (title.includes('landscape') || title.includes('horizontal') || title.includes('website')) return 'landscape';
    if (title.includes('square')) return 'square';

    return 'portrait';
}

export function getVariationSeed(product, index) {
    const idx = typeof index === 'number' ? index : 0;
    const str = String(product?.products_id || product?.id || product?.slug || idx);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getRealAspectRatio(product, masterData) {
    const raw = product?.aspect_ratio || product?.aspectRatio;
    if (raw) {
        const clean = String(raw).trim().toLowerCase().replace(/\s+/g, '');
        if (clean === '16:9' || clean === '16/9') return '16 / 9';
        if (clean === '9:16' || clean === '9/16' || clean === 'vertical') return '9 / 16';
        if (clean === '1:1' || clean === '1/1' || clean === 'square') return '1 / 1';
        if (clean === '4:3' || clean === '4/3') return '4 / 3';
        if (clean === '3:4' || clean === '3/4') return '3 / 4';
        if (clean === '4:5' || clean === '4/5') return '4 / 5';
        if (clean === '5:4' || clean === '5/4') return '5 / 4';
        if (clean === '21:9' || clean === '21/9') return '21 / 9';
        if (clean === '3:2' || clean === '3/2') return '3 / 2';
        if (clean === '2:3' || clean === '2/3') return '2 / 3';
        if (clean === '2.35:1' || clean === '2.35/1') return '2.35 / 1';
        if (clean.includes(':')) {
            const [w, h] = clean.split(':');
            if (Number(w) && Number(h)) return `${w} / ${h}`;
        }
        if (clean.includes('/')) {
            const [w, h] = clean.split('/');
            if (Number(w) && Number(h)) return `${w} / ${h}`;
        }
        const num = parseFloat(clean);
        if (!isNaN(num) && num > 0) return `${num} / 1`;
    }

    const orient = getOrientation(product, masterData);
    if (orient === 'landscape') return '16 / 9';
    if (orient === 'square') return '1 / 1';
    return '9 / 16';
}

export function parseAspectRatio(ratioStr, orientation) {
    if (ratioStr) {
        const str = String(ratioStr).trim().toLowerCase().replace(/\s+/g, '');
        if (str === '16:9' || str === '16/9') return '16 / 9';
        if (str === '9:16' || str === '9/16' || str === 'vertical') return '9 / 16';
        if (str === '1:1' || str === '1/1' || str === 'square') return '1 / 1';
        if (str === '4:3' || str === '4/3') return '4 / 3';
        if (str === '3:4' || str === '3/4') return '3 / 4';
        if (str === '4:5' || str === '4/5') return '4 / 5';
        if (str === '5:4' || str === '5/4') return '5 / 4';
        if (str === '21:9' || str === '21/9') return '21 / 9';
        if (str === '3:2' || str === '3/2') return '3 / 2';
        if (str === '2:3' || str === '2/3') return '2 / 3';
        if (str === '2.35:1' || str === '2.35/1') return '2.35 / 1';
        if (str.includes(':')) {
            const [w, h] = str.split(':');
            if (Number(w) && Number(h)) return `${w} / ${h}`;
        }
        if (str.includes('/')) {
            const [w, h] = str.split('/');
            if (Number(w) && Number(h)) return `${w} / ${h}`;
        }
        const num = parseFloat(str);
        if (!isNaN(num) && num > 0) return `${num} / 1`;
    }
    if (orientation === 'landscape') return '16 / 9';
    if (orientation === 'square') return '1 / 1';
    return '9 / 16';
}

// ──────────────────────────────────────────────────────────────────────────────
// EXACT ASPECT RATIO MATH (5 columns, auto-rows-[127px], gap-3=12px at lg)
//
// col_width = (1200 - 4×12) / 5 = 230px (approx at lg)
//
// Landscape col-span-2 row-span-2: W=2×230+12=472px, H=2×127+12=266px → 472/266 = 1.78 ≈ 16:9 ✓
// Portrait  col-span-1 row-span-3: W=230px,         H=3×127+24=405px → 230/405 = 0.568 ≈ 9:16 ✓
// Square    col-span-1 row-span-2: W=230px,         H=2×127+12=266px → 230/266 = 0.865 ≈ 1:1  ✓
//
// Pattern: L(2,2rows) + P(1,3rows) + P(1,3rows) + P(1,3rows) = 5 cols
// grid-flow-dense fills the 2-row gap in row3,col1-2 with the NEXT landscape automatically ✓
// ──────────────────────────────────────────────────────────────────────────────

// Landscape scale variants
const LANDSCAPE_SCALES = [
    [4, 'col-span-4'], // 2× scale — fills 4 cols
    [2, 'col-span-2'], // 1× default — fills 2 cols
];

function getLandscapeSpan(spaceLeft) {
    for (const [c, sc] of LANDSCAPE_SCALES) {
        if (c <= spaceLeft) return { cols: c, spanClass: sc };
    }
    return { cols: 2, spanClass: 'col-span-2' };
}

export function getOptimalColSpan(product, masterData, index = 0) {
    const ratioStr = getRealAspectRatio(product, masterData);
    const parts = ratioStr.split('/').map(s => parseFloat(s.trim()));
    const ratio = (parts.length === 2 && parts[0] > 0 && parts[1] > 0) ? (parts[0] / parts[1]) : 0.5625;

    // Extra-wide landscape (21:9, panoramic, etc.) → col-span-3
    if (ratio >= 2.0) return { spanClass: 'col-span-3', cols: 3, type: 'landscape-wide', aspectRatio: ratioStr };
    // Standard landscape (16:9, 3:2, 4:3, etc.) → col-span-2
    if (ratio >= 1.25) return { spanClass: 'col-span-2', cols: 2, type: 'landscape', aspectRatio: ratioStr };
    // Square (1:1) → col-span-1
    if (ratio >= 0.85) return { spanClass: 'col-span-1', cols: 1, type: 'square', aspectRatio: ratioStr };
    // Portrait (9:16, 4:5, etc.) → col-span-1
    return { spanClass: 'col-span-1', cols: 1, type: 'portrait', aspectRatio: ratioStr };
}

export function optimizeBentoLayout(products, masterData, targetColumns = 5) {
    if (!products || !products.length) return [];

    const tagged = products.map((p, i) => ({
        ...p,
        _spanInfo: getOptimalColSpan(p, masterData, i),
    }));

    const L = tagged.filter(p => p._spanInfo.type === 'landscape');
    const P = tagged.filter(p => p._spanInfo.type === 'portrait');
    const S = tagged.filter(p => p._spanInfo.type === 'square');

    // Patterns filling 5 columns cleanly
    const result = [];
    let cycle = 0;

    while (L.length || P.length || S.length) {
        const pat = cycle % 4;
        cycle++;

        if (pat === 0 && L.length >= 1 && P.length >= 3) {
            result.push(L.shift(), P.shift(), P.shift(), P.shift());
        } else if (pat === 1 && L.length >= 2 && P.length >= 1) {
            result.push(L.shift(), L.shift(), P.shift());
        } else if (pat === 2 && L.length >= 1 && P.length >= 3) {
            result.push(P.shift(), P.shift(), P.shift(), L.shift());
        } else if (pat === 3 && L.length >= 1 && S.length >= 3) {
            result.push(L.shift(), S.shift(), S.shift(), S.shift());
        } else {
            let cols = 0;
            while (cols < targetColumns) {
                const spaceLeft = targetColumns - cols;
                if (L.length && spaceLeft >= 2) {
                    const span = getLandscapeSpan(spaceLeft);
                    const item = L.shift();
                    result.push({ ...item, _spanInfo: { ...item._spanInfo, ...span } });
                    cols += span.cols;
                } else if (P.length && spaceLeft >= 1) {
                    result.push(P.shift()); cols += 1;
                } else if (S.length && spaceLeft >= 1) {
                    result.push(S.shift()); cols += 1;
                } else if (L.length) {
                    const span = getLandscapeSpan(Math.max(spaceLeft, 2));
                    const item = L.shift();
                    result.push({ ...item, _spanInfo: { ...item._spanInfo, ...span } });
                    cols += span.cols;
                } else if (P.length) { result.push(P.shift()); cols += 1; }
                else if (S.length) { result.push(S.shift()); cols += 1; }
                else break;
            }
        }
    }

    return result;
}

export function getRatioMultiplier(aspectRatioStr) {
    if (!aspectRatioStr) return 1.77;
    const parts = String(aspectRatioStr).split('/').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        return parts[1] / parts[0];
    }
    return 1.77;
}

/**
 * Returns width/height as a float for use in justified flex row layout.
 * e.g. 16/9 ≈ 1.778, 9/16 ≈ 0.5625, 1/1 = 1.0
 */
export function getNumericRatio(product, masterData) {
    const ratioStr = getRealAspectRatio(product, masterData);
    const parts = ratioStr.split('/').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        return parts[0] / parts[1];
    }
    return 0.5625; // default portrait 9/16
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const ProductCard = forwardRef(function ProductCard({ product, index = 0, masterData, initialRatio }, forwardedRef) {
    const { toggleWishlist, isInWishlist } = useWishlist();
    const productId = product?.products_id || product?.id;
    const [isMounted, setIsMounted] = useState(false);
    const wishlisted = isMounted ? isInWishlist(productId) : false;

    const thumbnail = product?.thumbnail ? cdnImage(product.thumbnail) : null;
    // Use span chosen by optimizer (may be scaled-up landscape); fall back to default
    const spanInfo = useMemo(() => {
        const si = product?._spanInfo;
        if (si?.spanClass) return si;
        return getOptimalColSpan(product, masterData, index);
    }, [product, masterData, index]);
    const spanClass = spanInfo.spanClass;

    const [isPlaying, setIsPlaying] = useState(false);
    const [lazyVideoSrc, setLazyVideoSrc] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const isHoveredRef = useRef(false);
    const videoTimerRef = useRef(null);
    const maxPlayTimerRef = useRef(null);
    const videoElementRef = useRef(null);
    const localRef = useRef(null);

    const containerRef = forwardedRef || localRef;

    const rawVideo = lazyVideoSrc ||
        (Array.isArray(product?.video) && product?.video[0]
            ? product.video[0]
            : typeof product?.video === 'string' && product?.video
                ? product.video
                : product?.video_url || null);
    const videoSrc = rawVideo ? cdnVideo(rawVideo) : null;

    useEffect(() => {
        setIsMounted(true);
        const el = containerRef?.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin: '150px' }
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
            if (maxPlayTimerRef.current) clearTimeout(maxPlayTimerRef.current);
        };
    }, [containerRef]);

    useEffect(() => {
        if (!isVisible && isPlaying) {
            setIsPlaying(false);
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
            if (maxPlayTimerRef.current) clearTimeout(maxPlayTimerRef.current);
        }
    }, [isVisible, isPlaying]);

    const playVideo = useCallback(() => {
        const vid = videoElementRef.current;
        if (!vid) return;
        vid.muted = true;
        vid.defaultMuted = true;
        try {
            const p = vid.play();
            if (p !== undefined) {
                p.catch(() => {
                    if (isHoveredRef.current) {
                        vid.muted = true;
                        vid.play().catch(() => { });
                    }
                });
            }
        } catch { }

        // Restrict video playback to at most 10 seconds
        if (maxPlayTimerRef.current) clearTimeout(maxPlayTimerRef.current);
        maxPlayTimerRef.current = setTimeout(() => {
            setIsPlaying(false);
            if (videoElementRef.current) {
                videoElementRef.current.pause();
                videoElementRef.current.currentTime = 0;
            }
        }, 10000);
    }, []);

    useEffect(() => {
        const vid = videoElementRef.current;
        if (!vid) return;
        if (isPlaying) {
            playVideo();
        } else {
            vid.pause();
            vid.currentTime = 0;
            if (maxPlayTimerRef.current) {
                clearTimeout(maxPlayTimerRef.current);
                maxPlayTimerRef.current = null;
            }
        }
    }, [isPlaying, videoSrc, playVideo]);

    const handleMouseEnter = () => {
        isHoveredRef.current = true;
        setIsHovered(true);

        const vid = videoElementRef.current;
        if (vid) {
            vid.muted = true;
            vid.defaultMuted = true;
            if (vid.readyState >= 2) {
                vid.play().catch(() => { });
            } else {
                vid.load();
            }
        }

        if (!videoSrc && productId) {
            const lookup = product?.slug || productId;
            fetch(`${API_URL}/api/products/${lookup}`)
                .then(res => res.json())
                .then(data => {
                    const foundVid = Array.isArray(data?.video) ? data.video[0] : (data?.video || data?.video_url);
                    if (foundVid) {
                        setLazyVideoSrc(cdnVideo(foundVid));
                    }
                })
                .catch(() => { });
        }

        if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
        videoTimerRef.current = setTimeout(() => {
            if (isHoveredRef.current) {
                setIsPlaying(true);
            }
        }, 50);
    };

    const handleMouseLeave = () => {
        isHoveredRef.current = false;
        setIsHovered(false);
        setIsPlaying(false);
        if (videoTimerRef.current) {
            clearTimeout(videoTimerRef.current);
            videoTimerRef.current = null;
        }
        if (maxPlayTimerRef.current) {
            clearTimeout(maxPlayTimerRef.current);
            maxPlayTimerRef.current = null;
        }
        const vid = videoElementRef.current;
        if (vid) {
            vid.pause();
            vid.currentTime = 0;
        }
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

    const hasDiscount = product.compared_price && product.compared_price > product.price;
    const discountPct = hasDiscount
        ? Math.round(((product.compared_price - product.price) / product.compared_price) * 100)
        : 0;

    const assetTypeName = getAssetTypeName(product, masterData);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
                duration: 0.25,
                ease: 'easeOut'
            }}
            className="group relative overflow-hidden w-full h-full rounded-[16px] bg-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={containerRef}
        >
            <Link
                href={productUrl}
                onClick={() => {
                    if (typeof window !== 'undefined') {
                        try {
                            sessionStorage.setItem('adbuth_shop_saved_scroll', String(window.scrollY));
                            sessionStorage.setItem('adbuth_shop_from_detail', 'true');
                        } catch { }
                    }
                }}
                className="block absolute inset-0 w-full h-full"
            >
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={product.title || 'Product Image'}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        loading={index < 8 ? 'eager' : 'lazy'}
                    />
                ) : videoSrc ? (
                    <video
                        src={videoSrc}
                        autoPlay
                        muted
                        playsInline
                        preload="metadata"
                        onTimeUpdate={(e) => {
                            if (e.target.currentTime >= 10) {
                                e.target.pause();
                            }
                        }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Preview</span>
                    </div>
                )}

                {isMounted && isVisible && (isHovered || isPlaying) && videoSrc && (
                    <video
                        ref={videoElementRef}
                        src={videoSrc}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        muted
                        playsInline
                        preload="metadata"
                        onCanPlay={() => {
                            if (isHoveredRef.current || isPlaying) {
                                playVideo();
                            }
                        }}
                        onTimeUpdate={(e) => {
                            if (e.target.currentTime >= 10) {
                                e.target.pause();
                                e.target.currentTime = 0;
                                setIsPlaying(false);
                            }
                        }}
                    />
                )}

                <div
                    className="absolute inset-0 flex flex-col justify-end z-20 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.28) 45%, transparent 100%)',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.18s ease-out',
                    }}
                >
                    <div
                        className="px-3 pb-3 pt-10"
                        style={{
                            transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
                            transition: 'transform 0.22s ease-out',
                        }}
                    >
                        {assetTypeName && (
                            <span className="block text-[9px] font-bold tracking-widest uppercase text-purple-300 mb-1">
                                {assetTypeName}
                            </span>
                        )}
                        <p className="text-white text-[13px] font-bold leading-snug line-clamp-1 mb-2 drop-shadow">
                            {product.title}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-white text-[13px] font-black">Rs.{product.price}</span>
                                {hasDiscount && (
                                    <span className="text-gray-300 text-[10px] line-through">Rs.{product.compared_price}</span>
                                )}
                                {rating && (
                                    <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                                        <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[8px]" />
                                        <span className="text-white text-[9px] font-bold">{rating}</span>
                                        {reviewCount > 0 && (
                                            <span className="text-gray-300 text-[8px]">({reviewCount})</span>
                                        )}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold bg-white text-gray-900 px-3 py-1 rounded-full shadow-sm shrink-0">
                                View
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-30 pointer-events-none">
                {isNew && (
                    <span className="bg-black/75 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        New
                    </span>
                )}
                {hasDiscount && (
                    <span className="bg-purple-600/90 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {discountPct}% OFF
                    </span>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (productId) toggleWishlist(productId);
                }}
                className={`absolute top-2.5 right-2.5 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${wishlisted
                    ? 'bg-white text-red-500 opacity-100 scale-100'
                    : 'bg-black/40 hover:bg-white text-white hover:text-gray-900 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                    }`}
                aria-label={wishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
            >
                <FontAwesomeIcon
                    icon={wishlisted ? faHeartSolid : faHeartOutline}
                    className={`text-xs transition-transform duration-200 active:scale-125 ${wishlisted ? 'text-red-500' : ''}`}
                    aria-hidden="true"
                />
            </button>
        </motion.div>
    );
});

export default ProductCard;
