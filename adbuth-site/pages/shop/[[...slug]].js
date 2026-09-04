/**
 * pages/shop/[[...slug]].js
 *
 * High-performance shop page:
 * - Static props with compact array-of-arrays payload (under 128 kB)
 * - Client-side filtering via URL query params (no page reload)
 * - IntersectionObserver-based infinite scroll (forward only, simple & reliable)
 * - ProductCard handles video lifecycle (lazy load on hover, clear on leave)
 */
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../../components/Navbar';
import ShopSidebar from '../../components/shop/ShopSidebar';
import ShopTopBar from '../../components/shop/ShopTopBar';
import ShopSearchBar from '../../components/shop/ShopSearchBar';
import ProductCard, { getNumericRatio, getOptimalColSpan } from '../../components/shop/ProductCard';
import ProductDetailView from '../../components/shop/ProductDetailView';

const Footer = dynamic(() => import('../../components/Footer'));

const PAGE_SIZE = 24;

// ─── Deserialize compact array tuples from getStaticProps ─────────────────────
function deserializeProducts(raw) {
    if (!raw || !raw.length) return [];
    // Already deserialized (object form)
    if (!Array.isArray(raw[0])) return raw;
    return raw.map(p => ({
        products_id: p[0],
        title: p[1],
        description: p[2],
        price: p[3],
        compared_price: p[4],
        slug: p[5],
        thumbnail: p[6],
        updatedAt: p[7],
        averageRating: p[8],
        reviewCount: p[9],
        parentCategory: p[10] ? { slug: p[10] } : null,
        assetCategory: p[11] ? { slug: p[11] } : null,
        assetSubCategory: p[12] ? { slug: p[12] } : null,
        asset_type_id: p[13],
        asset_variant_id: p[14],
        asset_orientation_id: p[15],
        language: p[16] || 'English',
        assetType: p[17] ? { name: p[17] } : null,
        aspect_ratio: p[18] || null,
        video: p[19] ? [p[19]] : null,
        video_url: p[19] || null,
    }));
}

// ─── Skeleton card (bento-style — pure image block, no text rows) ──────────────
function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-[16px] overflow-hidden w-full h-full bg-gray-100" />
    );
}

// ─── Shop Banner ───────────────────────────────────────────────────────────────
function ShopBanner({ masterData, activeParentSlug, onBrowseClick, isShopBase }) {
    if (!masterData) return null;
    let bannerData = null;
    if (activeParentSlug) {
        const parent = masterData.parentCategories?.find(p => p.slug === activeParentSlug);
        if (parent && (parent.banner_image || parent.banner_title || parent.banner_subtitle)) {
            bannerData = { image: parent.banner_image || null, title: parent.banner_title || parent.category_name, subtitle: parent.banner_subtitle || null };
        }
    } else if (isShopBase) {
        const s = masterData.shopSettings;
        if (s && (s.shop_banner_image || s.shop_banner_title || s.shop_banner_subtitle)) {
            bannerData = { image: s.shop_banner_image || null, title: s.shop_banner_title || null, subtitle: s.shop_banner_subtitle || null };
        }
    }
    if (!bannerData) return null;
    const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
    const fallbackImage = "https://assets.adbuthverse.com/banners/1776536159973-481757187.webp";
    return (
        <div className="relative w-full min-h-[400px] aspect-video lg:h-screen overflow-hidden" id="shop-banner">
            {bannerData.image ? (
                isVideoUrl(bannerData.image) ? (
                    <video src={bannerData.image} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <Image src={bannerData.image} alt={bannerData.title || 'Shop Banner'} fill priority className="object-cover" />
                )
            ) : (
                <Image src={fallbackImage} alt="Adbuth Shop Banner" fill priority className="object-cover" />
            )}
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24">
                <div className="max-w-xl">
                    {bannerData.title && <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-3 lg:mb-4">{bannerData.title}</h1>}
                    {bannerData.subtitle && <p className="text-gray-600 text-[13px] sm:text-base md:text-lg leading-relaxed mb-6 lg:mb-8 max-w-md line-clamp-2 lg:line-clamp-none">{bannerData.subtitle}</p>}
                    <button onClick={onBrowseClick} className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-8 py-3.5 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 active:scale-95">
                        Browse Templates
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton Grid — responsive grid matching ProductGrid ───────────────────
function SkeletonGrid() {
    const skeletonItems = [
        { cols: 1, isLandscape: false },
        { cols: 2, isLandscape: true },
        { cols: 1, isLandscape: false },
        { cols: 1, isLandscape: false },
        { cols: 2, isLandscape: true },
        { cols: 1, isLandscape: false },
        { cols: 1, isLandscape: false },
        { cols: 1, isLandscape: false },
        { cols: 3, isLandscape: true },
        { cols: 1, isLandscape: false },
    ];
    return (
        <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[1800px]:grid-cols-7 min-[2200px]:grid-cols-8 gap-3.5 w-full"
            style={{ gridAutoFlow: 'dense' }}
        >
            {skeletonItems.map(({ cols, isLandscape }, sIdx) => {
                const colClass = isLandscape ? 'col-span-2 lg:col-span-3' : 'col-span-1';
                const heightClass = isLandscape
                    ? 'h-[200px] sm:h-[285px] md:h-[300px] lg:h-[310px] xl:h-[310px] 2xl:h-[335px] min-[1800px]:h-[400px]'
                    : 'h-[270px] sm:h-[285px] md:h-[300px] lg:h-[310px] xl:h-[310px] 2xl:h-[335px] min-[1800px]:h-[400px]';
                return (
                    <div
                        key={sIdx}
                        className={`rounded-[16px] overflow-hidden bg-gray-100 ${colClass} ${heightClass}`}
                    >
                        <div
                            className="w-full h-full animate-pulse bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200"
                            style={{ animationDelay: `${sIdx * 40}ms` }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

// ─── Product Grid — Responsive CSS Grid ──────────────────────────────────
//
// Layout rules:
//   • Progressive column scaling across all screen sizes:
//     - Mobile (< 640px): 2 cols
//     - Tablet (640px - 767px): 3 cols
//     - Medium (768px - 1023px): 4 cols
//     - Laptop (1024px - 1279px with sidebar): 4 cols
//     - Desktop (1280px - 1535px): 5 cols
//     - Large Wide Desktop (1536px - 1799px): 6 cols
//     - Full HD 1080p Widescreen (1800px+): 7 cols
//     - 2K/4K Ultrawide (2200px+): 8 cols
//   • Column heights managed accordingly (tall & elegant on wide devices):
//     - Vertical / square: 270px (mobile) → 285px (sm) → 310px (md) → 360px (lg) → 390px (xl) → 415px (2xl) → 440px (3xl)
//     - Horizontal on mobile: reduced to 200px (preserves sleek 16:9 aspect ratio)
//     - Horizontal on large laptop & desktop (lg:): occupies 3 columns (col-span-3) to fit wide screens
//
// grid-auto-flow:dense packs gaps; zero JS reordering; zero layout shift.
function ProductGrid({ products, loading, masterData }) {
    return (
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <SkeletonGrid />
                </motion.div>
            ) : !products?.length ? null : (
                <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 min-[1800px]:grid-cols-7 min-[2200px]:grid-cols-8 gap-3.5 w-full"
                    style={{ gridAutoFlow: 'dense' }}
                >
                    {products.map((p, i) => {
                        const { spanClass, type } = getOptimalColSpan(p, masterData, i);
                        const isLandscape = spanClass === 'col-span-2' || spanClass === 'col-span-3' || type?.includes('landscape');
                        // Horizontal templates occupy 2 cols on mobile/tablet, and 3 cols on large laptop/desktop screens
                        const colSpan = isLandscape ? 'col-span-2 lg:col-span-3' : 'col-span-1';
                        const heightClass = isLandscape
                            ? 'h-[200px] sm:h-[285px] md:h-[300px] lg:h-[310px] xl:h-[310px] 2xl:h-[335px] min-[1800px]:h-[400px]'
                            : 'h-[270px] sm:h-[285px] md:h-[300px] lg:h-[310px] xl:h-[310px] 2xl:h-[335px] min-[1800px]:h-[400px]';
                        return (
                            <div key={p.products_id || p.slug || i} className={`${colSpan} ${heightClass}`}>
                                <ProductCard
                                    product={p}
                                    index={i}
                                    masterData={masterData}
                                />
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
    );
}


// ─── Seeded shuffle — deterministic random for recommended picks ──────────────
function seededShuffle(arr, seed = 42) {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── Smart recommended picks: blend newest, highest-rated, discounted ─────────
function getRecommendedItems(allProducts, count = 20) {
    if (!allProducts?.length) return [];
    const sorted = [...allProducts];

    // Score each product: recency + rating + discount
    const now = Date.now();
    const scored = sorted.map(p => {
        const ageDays = (now - new Date(p.updatedAt || 0).getTime()) / 86400000;
        const recencyScore = Math.max(0, 30 - ageDays) / 30; // 0-1, higher = newer
        const ratingScore = parseFloat(p.averageRating || 0) / 5;
        const discountScore = (p.compared_price && p.price && p.compared_price > p.price)
            ? ((p.compared_price - p.price) / p.compared_price)
            : 0;
        const score = recencyScore * 0.4 + ratingScore * 0.35 + discountScore * 0.25;
        return { ...p, _score: score };
    });

    // Take top half by score, then shuffle for variety
    scored.sort((a, b) => b._score - a._score);
    const topPool = scored.slice(0, Math.max(count * 2, 40));
    return seededShuffle(topPool, 17).slice(0, count);
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onClear, allProducts, masterData }) {
    const recommended = useMemo(() => getRecommendedItems(allProducts, 20), [allProducts]);

    return (
        <div>
            <div className="py-16 px-6 text-center bg-gray-50/80 border border-gray-100 rounded-3xl shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-1">No products found</p>
                <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">Try adjusting your filters or clearing search terms to find what you're looking for.</p>
                <button onClick={onClear} className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95">
                    Clear All Filters
                </button>
            </div>
            {recommended.length > 0 && (
                <div className="mt-10">
                    <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                        ✨ Recommended For You
                    </h3>
                    <ProductGrid products={recommended} loading={false} masterData={masterData} />
                </div>
            )}
        </div>
    );
}

// ─── Mobile Filter Button (Centered Floating Pill to avoid Zoho Chat collision) ──
function MobileFilterButton({ count, onClick }) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-6 py-3 bg-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-2xl hover:bg-purple-800 transition-all active:scale-95 whitespace-nowrap backdrop-blur-sm"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
            {count > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-white text-purple-700 rounded-full text-[10px] px-1 font-bold">{count}</span>
            )}
        </button>
    );
}

// ─── Mobile Filter Drawer ──────────────────────────────────────────────────────
function MobileFilterDrawer({ isOpen, onClose, filters, onFilterChange, masterData, maxPrice }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute top-0 left-0 w-[300px] max-w-[85%] h-full bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <span className="text-sm font-black uppercase tracking-widest text-gray-900">Filters</span>
                            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ShopSidebar filters={filters} onFilterChange={onFilterChange} masterData={masterData} maxPrice={maxPrice} isMobile={true} />
                        </div>
                        <div className="p-5 bg-gray-50 border-t border-gray-100">
                            <button onClick={onClose} className="w-full py-4 bg-purple-700 text-white font-bold text-[10px] uppercase tracking-[0.25em] shadow-lg active:scale-95 transition-all">
                                Show Results
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const SORT_FNS = {
    'Price: Low to High': (a, b) => (a.price || 0) - (b.price || 0),
    'Price: High to Low': (a, b) => (b.price || 0) - (a.price || 0),
    'Newest First': (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
};

function parseQArray(val) {
    if (!val) return [];
    return (Array.isArray(val) ? val : val.split(',')).filter(Boolean);
}

function readFiltersFromQuery(query) {
    return {
        parentCategory: parseQArray(query.parentCategory),
        assetCategory: parseQArray(query.assetCategory),
        assetSubCategory: parseQArray(query.assetSubCategory),
        assetType: parseQArray(query.assetType),
        assetVariant: parseQArray(query.assetVariant),
        orientation: parseQArray(query.orientation),
        language: parseQArray(query.language),
        maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
        search: query.search || '',
    };
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default function ShopPage({ initialProducts, masterData, maxPrice, initialSlug }) {
    const router = useRouter();
    const { slug: querySlug, ...queryParams } = router.query;
    const slug = querySlug || initialSlug;

    const slugArr = Array.isArray(slug) ? slug : (slug ? [slug] : []);
    const slugParentCategory = slugArr[0] === 'category' && slugArr[1] ? slugArr[1] : null;
    const productSlug = slugArr.length >= 3 ? slugArr[slugArr.length - 1] : null;
    const isProductDetail = slugArr[0] === 'category' && slugArr.length === 4;

    // Deserialize once on mount
    const [allProducts] = useState(() => deserializeProducts(initialProducts));

    const [filters, setFilters] = useState(() => {
        const f = readFiltersFromQuery(queryParams);
        if (slugParentCategory && !f.parentCategory.length) f.parentCategory = [slugParentCategory];
        return f;
    });
    const [sortBy, setSortBy] = useState('Recommended');
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

    // Restore saved displayCount after mount (prevents SSR hydration mismatch)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = sessionStorage.getItem('adbuth_shop_display_count');
                if (saved) {
                    const parsed = parseInt(saved, 10);
                    if (parsed > PAGE_SIZE) setDisplayCount(parsed);
                }
            } catch { }
        }
    }, []);
    // ─── Hydration gate ──────────────────────────────────────────────────────
    // Keep skeleton visible until router.isReady fires AND sessionStorage
    // display-count has been restored. This prevents the visible layout shift
    // that happens when router.isReady causes setFilters() post-hydration.
    const [isHydrated, setIsHydrated] = useState(false);

    const [filterLoading, setFilterLoading] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const queryStr = useMemo(() => JSON.stringify(queryParams), [queryParams]);

    // Save displayCount & scroll position
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try { sessionStorage.setItem('adbuth_shop_display_count', String(displayCount)); } catch { }
    }, [displayCount]);

    useEffect(() => {
        let timer = null;
        const handleScroll = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                // Only update saved position when on shop grid AND scroll is non-zero
                if (!isProductDetail && window.scrollY > 0) {
                    try {
                        sessionStorage.setItem('adbuth_shop_scroll_pos', String(window.scrollY));
                        sessionStorage.setItem('adbuth_shop_saved_scroll', String(window.scrollY));
                    } catch { }
                }
            }, 100);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isProductDetail]);

    // Sync filters when URL changes + mark as hydrated once stable
    const prevQueryStr = useRef(queryStr);
    useEffect(() => {
        if (!router.isReady) return;
        const f = readFiltersFromQuery(queryParams);
        if (slugParentCategory && !f.parentCategory.length) f.parentCategory = [slugParentCategory];
        setFilters(f);
        if (prevQueryStr.current !== queryStr) {
            prevQueryStr.current = queryStr;
            setDisplayCount(PAGE_SIZE);
        }
        // Small delay lets the grid paint once before removing skeleton
        // This prevents any flash of unstyled/mismatched content
        setTimeout(() => setIsHydrated(true), 80);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.isReady, queryStr]);

    // Scroll to top of products grid on filter change
    useEffect(() => {
        if (filterLoading) document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [filterLoading]);

    const handleFilterChange = useCallback((key, value) => {
        setFilterLoading(true);
        setIsHydrated(false); // re-show skeleton during filter transition
        setDisplayCount(PAGE_SIZE);
        setFilters(prev => {
            const newFilters = key === 'bulk' ? { ...prev, ...value } : { ...prev, [key]: value };
            const q = {};
            if (newFilters.parentCategory?.length) q.parentCategory = newFilters.parentCategory.join(',');
            if (newFilters.assetCategory?.length) q.assetCategory = newFilters.assetCategory.join(',');
            if (newFilters.assetSubCategory?.length) q.assetSubCategory = newFilters.assetSubCategory.join(',');
            if (newFilters.assetType?.length) q.assetType = newFilters.assetType.join(',');
            if (newFilters.assetVariant?.length) q.assetVariant = newFilters.assetVariant.join(',');
            if (newFilters.orientation?.length) q.orientation = newFilters.orientation.join(',');
            if (newFilters.language?.length) q.language = newFilters.language.join(',');
            if (newFilters.maxPrice) q.maxPrice = newFilters.maxPrice;
            if (newFilters.search) q.search = newFilters.search;
            const pathname = slugParentCategory ? `/shop/category/${slugParentCategory}` : '/shop';
            router.push({ pathname, query: q }, undefined, { shallow: true, scroll: false })
                .then(() => setTimeout(() => {
                    setFilterLoading(false);
                    setIsHydrated(true);
                }, 150));
            return newFilters;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slugParentCategory]);

    // Client-side filtering
    const filteredProducts = useMemo(() => {
        let list = allProducts;
        if (filters.search) {
            const q = filters.search.toLowerCase();
            list = list.filter(p => p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
        }
        if (filters.parentCategory?.length) list = list.filter(p => filters.parentCategory.includes(p.parentCategory?.slug));
        if (filters.assetCategory?.length) list = list.filter(p => filters.assetCategory.includes(p.assetCategory?.slug));
        if (filters.assetSubCategory?.length) list = list.filter(p => filters.assetSubCategory.includes(p.assetSubCategory?.slug));
        if (filters.assetType?.length) {
            const ids = filters.assetType.map(slug => masterData?.types?.find(t => t.slug === slug || t.type_id === slug)?.type_id).filter(Boolean);
            if (ids.length) list = list.filter(p => ids.includes(p.asset_type_id));
        }
        if (filters.assetVariant?.length) {
            const ids = filters.assetVariant.map(slug => masterData?.variants?.find(v => v.slug === slug || v.variant_id === slug)?.variant_id).filter(Boolean);
            if (ids.length) list = list.filter(p => ids.includes(p.asset_variant_id));
        }
        if (filters.orientation?.length) {
            const ids = filters.orientation.map(slug => masterData?.orientations?.find(o => o.slug === slug || o.orientation_id === slug)?.orientation_id).filter(Boolean);
            if (ids.length) list = list.filter(p => ids.includes(p.asset_orientation_id));
        }
        if (filters.language?.length) list = list.filter(p => filters.language.includes(p.language));
        if (filters.maxPrice) list = list.filter(p => (p.price || 0) <= filters.maxPrice);
        if (SORT_FNS[sortBy]) {
            list = [...list].sort(SORT_FNS[sortBy]);
        } else {
            // Default "Recommended": stable seeded shuffle for a Pinterest-like random mix
            // Use a fixed seed so SSR and client render match (no hydration mismatch)
            list = seededShuffle(list, 31337);
        }
        return list;
    }, [allProducts, filters, sortBy, masterData]);

    const visibleProducts = useMemo(() => filteredProducts.slice(0, displayCount), [filteredProducts, displayCount]);
    const hasMore = displayCount < filteredProducts.length;

    // Infinite scroll observer - re-runs whenever hasMore, displayCount, or isProductDetail changes
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);

    const setupObserver = useCallback((node) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (!node || !hasMore) return;
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredProducts.length));
                }
            },
            { rootMargin: '600px' }
        );
        observerRef.current.observe(node);
    }, [hasMore, filteredProducts.length]);

    const setSentinelNode = useCallback((node) => {
        sentinelRef.current = node;
        setupObserver(node);
    }, [setupObserver]);

    useEffect(() => {
        if (sentinelRef.current) {
            setupObserver(sentinelRef.current);
        }
        return () => observerRef.current?.disconnect();
    }, [setupObserver, isProductDetail]);

    // Restore scroll position ONLY when returning from ProductDetailView to Shop grid
    useEffect(() => {
        if (!isProductDetail && typeof window !== 'undefined') {
            try {
                const isFromDetail = sessionStorage.getItem('adbuth_shop_from_detail') === 'true';
                if (isFromDetail) {
                    const saved = sessionStorage.getItem('adbuth_shop_saved_scroll');
                    if (saved) {
                        const y = parseInt(saved, 10);
                        if (y > 0) {
                            [0, 50, 150, 350, 600].forEach(d => {
                                setTimeout(() => {
                                    window.scrollTo({ top: y, behavior: 'instant' });
                                }, d);
                            });
                        }
                    }
                    sessionStorage.removeItem('adbuth_shop_from_detail');
                    sessionStorage.removeItem('adbuth_shop_saved_scroll');
                }
            } catch { }
        }
    }, [isProductDetail]);

    const activeFilterCount = [
        ...(filters.parentCategory ?? []),
        ...(filters.assetCategory ?? []),
        ...(filters.assetSubCategory ?? []),
        ...(filters.assetType ?? []),
        ...(filters.assetVariant ?? []),
        ...(filters.orientation ?? []),
        ...(filters.language ?? []),
    ].length;

    const isShopBase = activeFilterCount === 0 && !filters.search && !filters.maxPrice;
    const bannerParentSlug = (activeFilterCount === 1 && filters.parentCategory?.length === 1 && !filters.search && !filters.maxPrice)
        ? filters.parentCategory[0] : null;

    // Product detail mode
    if (isProductDetail && productSlug) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar isdark={false} highlight='shop' />
                <main className="pt-24">
                    <ProductDetailView slug={productSlug} masterData={masterData} />
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Shop – Adbuth Edits</title>
                <meta name="description" content="Browse premium digital invitation templates, greetings, and more." />
            </Head>

            <div className="min-h-screen bg-white">
                <Navbar isdark={false} highlight='shop' />
                <main className="pt-24">
                    {/* Main Shop Grid — Full width on wide screens: filter at side, products up to the right */}
                    <div id="shop-products" className="flex items-start w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 scroll-m-[100px]">
                        {/* Left Sidebar — Positioned at left edge */}
                        <div className="hidden lg:block sticky top-5 self-start flex-shrink-0">
                            <ShopSidebar filters={filters} onFilterChange={handleFilterChange} masterData={masterData} maxPrice={maxPrice} />
                        </div>

                        {/* Main content — Perfectly balanced spacing across mobile, tablet, and desktop */}
                        <div className="flex-1 min-w-0 lg:pl-6 xl:pl-8 pt-2 pb-20">
                            {/* Search Bar */}
                            <div className="mb-6">
                                <ShopSearchBar masterData={masterData} allProducts={allProducts} onSearch={(term) => handleFilterChange('search', term)} currentSearch={filters.search} />
                            </div>

                            {/* Top Bar */}
                            <div className="mb-5">
                                <ShopTopBar filters={filters} onFilterChange={handleFilterChange} masterData={masterData} resultCount={filteredProducts.length} loading={filterLoading} sortBy={sortBy} onSortChange={setSortBy} />
                            </div>

                            <div className="border-t border-gray-100 mb-6" />

                            {/* Product Grid or Empty */}
                            {filteredProducts.length > 0 ? (
                                <>
                                    <ProductGrid
                                        products={visibleProducts}
                                        loading={!isHydrated || filterLoading}
                                        masterData={masterData}
                                    />

                                    {/* Infinite scroll sentinel + load-more button */}
                                    <div ref={setSentinelNode} className="w-full flex justify-center py-10">
                                        {hasMore && (
                                            <button
                                                type="button"
                                                onClick={() => setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredProducts.length))}
                                                className="group flex items-center gap-2.5 px-7 py-3 bg-white hover:bg-purple-700 border border-gray-200 hover:border-purple-700 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
                                            >
                                                <div className="w-4 h-4 border-2 border-gray-300 group-hover:border-purple-300 border-t-purple-600 group-hover:border-t-white rounded-full animate-spin" />
                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-white transition-colors">Load more</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                !filterLoading && (
                                    <EmptyState
                                        allProducts={allProducts}
                                        masterData={masterData}
                                        onClear={() => handleFilterChange('bulk', {
                                            parentCategory: [], assetCategory: [], assetSubCategory: [],
                                            assetType: [], assetVariant: [], orientation: [],
                                            language: [], maxPrice: null, search: ''
                                        })}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <Footer />

            <MobileFilterButton count={activeFilterCount} onClick={() => setMobileFiltersOpen(true)} />
            <MobileFilterDrawer
                isOpen={mobileFiltersOpen}
                onClose={() => setMobileFiltersOpen(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                masterData={masterData}
                maxPrice={maxPrice}
            />
        </>
    );
}

// ─── Static Props ──────────────────────────────────────────────────────────────
export async function getStaticPaths() {
    return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ params = {} } = {}) {
    let API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    if (API_URL.includes('localhost')) {
        API_URL = API_URL.replace('localhost', '127.0.0.1');
    }
    try {
        const [productsRes, masterRes, maxPriceRes] = await Promise.all([
            fetch(`${API_URL}/api/products`),
            fetch(`${API_URL}/api/products/master-data`),
            fetch(`${API_URL}/api/products/max-price`),
        ]);

        if (!productsRes.ok || !masterRes.ok) throw new Error('API fetch failed');

        const [rawProducts, masterData, maxPriceData] = await Promise.all([
            productsRes.json(),
            masterRes.json(),
            maxPriceRes.ok ? maxPriceRes.json() : { maxPrice: 10000 },
        ]);

        // Pack products as array-of-arrays to massively reduce JSON key overhead
        const initialProducts = (rawProducts || []).map(p => [
            p.products_id || null,
            p.title || null,
            p.description ? p.description.replace(/<[^>]*>?/gm, '').substring(0, 50) : null,
            p.price || null,
            p.compared_price || null,
            p.slug || null,
            p.thumbnail || null,
            p.updatedAt || p.updated_at || null,
            p.averageRating || null,
            p.reviewCount || null,
            p.parentCategory?.slug || null,
            p.assetCategory?.slug || null,
            p.assetSubCategory?.slug || null,
            p.asset_type_id || null,
            p.asset_variant_id || null,
            p.asset_orientation_id || null,
            p.language || 'English',
            p.assetType?.name || p.asset_type?.name || p.asset_type_name || null,
            p.aspect_ratio || p.aspectRatio || null,
            (Array.isArray(p.video) ? p.video[0] : (p.video || p.video_url || null)) || null,
        ]);

        // Trim masterData to only required fields
        const trimmedMasterData = {
            parentCategories: (masterData.parentCategories || []).map(p => ({
                category_id: p.category_id, category_name: p.category_name, slug: p.slug,
                banner_image: p.banner_image || null, banner_title: p.banner_title || null, banner_subtitle: p.banner_subtitle || null,
            })),
            categories: (masterData.categories || []).map(c => ({
                asset_category_id: c.asset_category_id, name: c.name, slug: c.slug, parent_category_id: c.parent_category_id,
            })),
            subCategories: (masterData.subCategories || []).map(s => ({
                name: s.name, slug: s.slug, asset_category_id: s.asset_category_id,
            })),
            types: (masterData.types || []).map(t => ({ type_id: t.type_id, name: t.name, slug: t.slug || null })),
            variants: (masterData.variants || []).map(v => ({ variant_id: v.variant_id, name: v.name, slug: v.slug || null })),
            orientations: (masterData.orientations || []).map(o => ({ orientation_id: o.orientation_id, name: o.name, slug: o.slug || null, code: o.code || null })),
            languages: masterData.languages || [],
            shopSettings: masterData.shopSettings ? {
                shop_banner_image: masterData.shopSettings.shop_banner_image || null,
                shop_banner_title: masterData.shopSettings.shop_banner_title || null,
                shop_banner_subtitle: masterData.shopSettings.shop_banner_subtitle || null,
            } : null,
        };

        return {
            props: { initialProducts, masterData: trimmedMasterData, maxPrice: maxPriceData?.maxPrice || 10000, initialSlug: params?.slug || null },
            revalidate: 60,
        };
    } catch (err) {
        console.error('ShopPage getStaticProps error:', err);
        return { props: { initialProducts: [], masterData: {}, maxPrice: 10000 }, revalidate: 60 };
    }
}
