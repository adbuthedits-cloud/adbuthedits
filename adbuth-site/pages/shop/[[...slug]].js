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
import ProductCard from '../../components/shop/ProductCard';
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
    }));
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="animate-pulse">
            <div className="bg-gray-200" style={{ aspectRatio: '3/4' }} />
            <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
        </div>
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

// ─── Product Grid ──────────────────────────────────────────────────────────────
function ProductGrid({ products, loading }) {
    if (loading && !products.length) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }
    if (!products.length) return null;
    return (
        <div className={`relative transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {loading && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-20">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
                </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                {products.map((p, index) => (
                    <div key={p.products_id || p.slug || index} className="h-full">
                        <ProductCard product={p} index={index} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onClear, allProducts }) {
    return (
        <div>
            <div className="py-14 text-center bg-gray-50 border border-gray-100">
                <p className="text-lg font-bold text-gray-900 mb-1">No products found</p>
                <p className="text-sm text-gray-500 mb-5">Try adjusting or clearing your filters.</p>
                <button onClick={onClear} className="px-6 py-2 bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition-colors">
                    Clear All Filters
                </button>
            </div>
            {allProducts?.length > 0 && (
                <div className="mt-10">
                    <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Recommended For You</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {allProducts.slice(0, 12).map(p => <ProductCard key={p.products_id} product={p} />)}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Mobile Filter Button ──────────────────────────────────────────────────────
function MobileFilterButton({ count, onClick }) {
    return (
        <button onClick={onClick} className="lg:hidden fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-purple-700 text-white text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-purple-800 transition-all active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
            {count > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-white text-purple-700 rounded-full text-[10px] px-1">{count}</span>
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
export default function ShopPage({ initialProducts, masterData, maxPrice }) {
    const router = useRouter();
    const { slug, ...queryParams } = router.query;

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
            } catch {}
        }
    }, []);
    const [filterLoading, setFilterLoading] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const queryStr = useMemo(() => JSON.stringify(queryParams), [queryParams]);

    // Save displayCount & scroll position
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try { sessionStorage.setItem('adbuth_shop_display_count', String(displayCount)); } catch {}
    }, [displayCount]);

    useEffect(() => {
        let scrollTimeout;
        const handleScroll = () => {
            if (!document.body.classList.contains('is-scrolling')) document.body.classList.add('is-scrolling');
            // Only update saved position when on shop grid AND scroll is non-zero
            if (!isProductDetail && window.scrollY > 0) {
                try {
                    sessionStorage.setItem('adbuth_shop_scroll_pos', String(window.scrollY));
                    sessionStorage.setItem('adbuth_shop_saved_scroll', String(window.scrollY));
                } catch {}
            }
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => document.body.classList.remove('is-scrolling'), 150);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(scrollTimeout); document.body.classList.remove('is-scrolling'); };
    }, [isProductDetail]);

    // Sync filters when URL changes
    const prevQueryStr = useRef(queryStr);
    useEffect(() => {
        if (!router.isReady) return;
        const f = readFiltersFromQuery(queryParams);
        if (slugParentCategory && !f.parentCategory.length) f.parentCategory = [slugParentCategory];
        setFilters(f);
        // Only reset display count if filter query string actually changed (not on back navigation)
        if (prevQueryStr.current !== queryStr) {
            prevQueryStr.current = queryStr;
            setDisplayCount(PAGE_SIZE);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.isReady, queryStr]);

    // Scroll to top of products grid on filter change
    useEffect(() => {
        if (filterLoading) document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [filterLoading]);

    const handleFilterChange = useCallback((key, value) => {
        setFilterLoading(true);
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
                .then(() => setTimeout(() => setFilterLoading(false), 100));
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
        if (SORT_FNS[sortBy]) list = [...list].sort(SORT_FNS[sortBy]);
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
            } catch {}
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
                    {/* Main Shop Grid */}
                    <div id="shop-products" className="flex items-start max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 scroll-m-[100px]">
                        {/* Left Sidebar */}
                        <div className="hidden lg:block sticky top-5 self-start">
                            <ShopSidebar filters={filters} onFilterChange={handleFilterChange} masterData={masterData} maxPrice={maxPrice} />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0 px-4 lg:px-8 pt-6 pb-20">
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
                                    <ProductGrid products={visibleProducts} loading={filterLoading} />

                                    {/* Infinite scroll sentinel */}
                                    <div ref={setSentinelNode} className="w-full flex justify-center py-8">
                                        {hasMore && (
                                            <button
                                                type="button"
                                                onClick={() => setDisplayCount(prev => Math.min(prev + PAGE_SIZE, filteredProducts.length))}
                                                className="flex items-center gap-2 px-6 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full transition-colors cursor-pointer"
                                            >
                                                <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
                                                <span className="text-sm font-semibold text-purple-900">Loading more templates...</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                !filterLoading && (
                                    <EmptyState
                                        allProducts={allProducts}
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

export async function getStaticProps() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
            props: { initialProducts, masterData: trimmedMasterData, maxPrice: maxPriceData?.maxPrice || 10000 },
            revalidate: 60,
        };
    } catch (err) {
        console.error('ShopPage getStaticProps error:', err);
        return { props: { initialProducts: [], masterData: {}, maxPrice: 10000 }, revalidate: 60 };
    }
}
