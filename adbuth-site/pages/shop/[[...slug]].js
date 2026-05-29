/**
 * pages/shop/[[...slug]].js
 *
 * The shop page. Handles:
 * - Server-side data fetch (masterData + all products)
 * - Client-side URL-based filtering with shallow routing (NO full reload)
 * - Banner display for parent categories via ?parentCategory=slug query param
 * - Smooth scroll to top of product grid when filters change
 * - Professional query-param-based URL structure:
 *     /shop?parentCategory=digital-invitations&assetCategory=business-invites
 *     /shop/category/digital-invitations (legacy, for direct URL access)
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const PAGE_SIZE = 24;

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="animate-pulse">
            <div className="bg-gray-200" style={{ aspectRatio: '3/4' }} />
            <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 w-3/4" />
                <div className="h-3 bg-gray-200 w-1/2" />
                <div className="h-4 bg-gray-200 w-1/3" />
            </div>
        </div>
    );
}

// ─── Shop Banner ───────────────────────────────────────────────────────────────
// Two states:
//   1. No filter → global shop banner from shopSettings
//   2. parentCategory selected → that category's specific banner
function ShopBanner({ masterData, activeParentSlug, onBrowseClick, isShopBase }) {
    if (!masterData) return null;

    let bannerData = null;

    if (activeParentSlug) {
        const parent = masterData.parentCategories?.find(p => p.slug === activeParentSlug);
        if (parent && (parent.banner_image || parent.banner_title || parent.banner_subtitle)) {
            bannerData = {
                image: parent.banner_image || null,
                title: parent.banner_title || parent.category_name,
                subtitle: parent.banner_subtitle || null,
            };
        }
    } else if (isShopBase) {
        const s = masterData.shopSettings;
        if (s && (s.shop_banner_image || s.shop_banner_title || s.shop_banner_subtitle)) {
            bannerData = {
                image: s.shop_banner_image || null,
                title: s.shop_banner_title || null,
                subtitle: s.shop_banner_subtitle || null,
            };
        }
    }

    if (!bannerData) return null;

    const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
    const fallbackImage = "https://assets.adbuthverse.com/banners/1776536159973-481757187.webp";

    return (
        // aspect-video on mobile/tablet, h-screen on desktop (lg+).
        <div className="relative w-full min-h-[400px] aspect-video lg:h-screen overflow-hidden" id="shop-banner">
            {/* Background image or video fills entire banner */}
            {bannerData.image ? (
                isVideoUrl(bannerData.image) ? (
                    <video
                        src={bannerData.image}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <Image
                        src={bannerData.image}
                        alt={bannerData.title || 'Shop Banner'}
                        fill
                        priority
                        className="object-cover"
                    />
                )
            ) : (
                // Custom Fallback image provided by user
                <Image
                    src={fallbackImage}
                    alt="Adbuth Shop Banner"
                    fill
                    priority
                    className="object-cover"
                />
            )}



            {/* Banner Content — Centered in the section */}
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24">
                <div className="max-w-xl">
                    {bannerData.title && (
                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-3 lg:mb-4">
                            {bannerData.title}
                        </h1>
                    )}
                    {bannerData.subtitle && (
                        <p className="text-gray-600 text-[13px] sm:text-base md:text-lg leading-relaxed mb-6 lg:mb-8 max-w-md line-clamp-2 lg:line-clamp-none">
                            {bannerData.subtitle}
                        </p>
                    )}
                    {/* Browse Templates button — white pill matching reference image */}
                    <button
                        onClick={onBrowseClick}
                        className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-8 py-3.5 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 active:scale-95"
                    >
                        Browse Templates
                    </button>
                </div>
            </div>
        </div>
    );
}


// ─── Main product grid ─────────────────────────────────────────────────────────
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
        <div className={`relative transition-opacity duration-200 scroll-m-[160px] ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {loading && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-20">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
                </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                {products.map((p, index) => (
                    <div key={p.products_id} className="h-full">
                        <ProductCard product={p} index={index} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onClear, allProducts }) {
    return (
        <div>
            <div className="py-14 text-center bg-gray-50 border border-gray-100">
                <p className="text-lg font-bold text-gray-900 mb-1">No products found</p>
                <p className="text-sm text-gray-500 mb-5">Try adjusting or clearing your filters.</p>
                <button
                    onClick={onClear}
                    className="px-6 py-2 bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition-colors"
                >
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

// ─── Mobile filter button ──────────────────────────────────────────────────────
function MobileFilterButton({ count, onClick }) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-purple-700 text-white text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-purple-800 transition-all active:scale-95"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
            {count > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-white text-purple-700 rounded-full text-[10px] px-1">
                    {count}
                </span>
            )}
        </button>
    );
}

// ─── Mobile Filter Drawer ───────────────────────────────────────────────────
function MobileFilterDrawer({ isOpen, onClose, filters, onFilterChange, masterData, maxPrice }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute top-0 left-0 w-[300px] max-w-[85%] h-full bg-white shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <span className="text-sm font-black uppercase tracking-widest text-gray-900">Filters</span>
                            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <ShopSidebar
                                filters={filters}
                                onFilterChange={onFilterChange}
                                masterData={masterData}
                                maxPrice={maxPrice}
                                isMobile={true}
                            />
                        </div>

                        <div className="p-5 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-purple-700 text-white font-bold text-[10px] uppercase tracking-[0.25em] shadow-lg active:scale-95 transition-all"
                            >
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
        maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
        search: query.search || '',
    };
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default function ShopPage({ initialProducts, masterData, maxPrice }) {
    const router = useRouter();
    const { slug, ...queryParams } = router.query;

    // Detect if user is on /shop/category/[parentSlug] style URL
    // In that case, seed parentCategory filter from the slug
    const slugArr = Array.isArray(slug) ? slug : (slug ? [slug] : []);
    const slugParentCategory = slugArr[0] === 'category' && slugArr[1] ? slugArr[1] : null;

    // The product being viewed (slug[2] or slug[3] could be the product slug)
    const productSlug = slugArr.length >= 3 ? slugArr[slugArr.length - 1] : null;

    // Check if this is a product detail URL: /shop/category/parent/event/product-slug
    const isProductDetail = slugArr[0] === 'category' && slugArr.length === 4;

    const [allProducts] = useState(initialProducts || []);
    const [filters, setFilters] = useState(() => {
        const f = readFiltersFromQuery(queryParams);
        // If user visits /shop/category/digital-invitations, seed the parentCategory filter
        if (slugParentCategory && !f.parentCategory.length) {
            f.parentCategory = [slugParentCategory];
        }
        return f;
    });
    const [sortBy, setSortBy] = useState('Recommended');
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
    const [filterLoading, setFilterLoading] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    // Stable memoized query string — only changes when the actual query params change
    const queryStr = useMemo(() => JSON.stringify(queryParams), [queryParams]);

    // Disable hover effects during scrolling to optimize performance
    useEffect(() => {
        let scrollTimeout;
        const handleScroll = () => {
            if (!document.body.classList.contains('is-scrolling')) {
                document.body.classList.add('is-scrolling');
            }
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
            document.body.classList.remove('is-scrolling');
        };
    }, []);

    // Sync filters from URL when router query changes
    useEffect(() => {
        if (!router.isReady) return;

        const f = readFiltersFromQuery(queryParams);
        // If on a category slug URL and no parentCategory in query, derive from slug
        if (slugParentCategory && !f.parentCategory.length) {
            f.parentCategory = [slugParentCategory];
        }
        setFilters(f);
        setDisplayCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.isReady, queryStr]);

    // Scroll to products top when filters are applied
    useEffect(() => {
        if (filterLoading) {
            document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [filterLoading]);

    // ─── Apply filters: update URL only (shallow) ────────────────────────────
    const handleFilterChange = useCallback((key, value) => {
        setFilterLoading(true);

        setFilters(prev => {
            const newFilters = key === 'bulk' ? { ...prev, ...value } : { ...prev, [key]: value };

            // Build query object — only include non-empty values
            const q = {};
            if (newFilters.parentCategory?.length) q.parentCategory = newFilters.parentCategory.join(',');
            if (newFilters.assetCategory?.length) q.assetCategory = newFilters.assetCategory.join(',');
            if (newFilters.assetSubCategory?.length) q.assetSubCategory = newFilters.assetSubCategory.join(',');
            if (newFilters.assetType?.length) q.assetType = newFilters.assetType.join(',');
            if (newFilters.assetVariant?.length) q.assetVariant = newFilters.assetVariant.join(',');
            if (newFilters.orientation?.length) q.orientation = newFilters.orientation.join(',');
            if (newFilters.maxPrice) q.maxPrice = newFilters.maxPrice;
            if (newFilters.search) q.search = newFilters.search;

            // If on a category slug URL, preserve the slug and add query params
            const pathname = slugParentCategory ? `/shop/category/${slugParentCategory}` : '/shop';

            router.push({ pathname, query: q }, undefined, { shallow: true, scroll: false })
                .then(() => setTimeout(() => setFilterLoading(false), 100));

            return newFilters;
        });

        setDisplayCount(PAGE_SIZE);
    // router.push is stable; only slugParentCategory can change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slugParentCategory]);

    // ─── Client-side filter + sort ────────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        let list = allProducts;

        // Search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            list = list.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }

        // Parent Category (by slug)
        if (filters.parentCategory?.length) {
            list = list.filter(p => filters.parentCategory.includes(p.parentCategory?.slug));
        }
        // Asset Category (event type)
        if (filters.assetCategory?.length) {
            list = list.filter(p => filters.assetCategory.includes(p.assetCategory?.slug));
        }
        // Sub Category (occasion)
        if (filters.assetSubCategory?.length) {
            list = list.filter(p => filters.assetSubCategory.includes(p.assetSubCategory?.slug));
        }
        // Asset Type (format)
        if (filters.assetType?.length) {
            const ids = filters.assetType.map(slug => {
                const t = masterData?.types?.find(t => t.slug === slug || t.type_id === slug);
                return t?.type_id;
            }).filter(Boolean);
            if (ids.length) list = list.filter(p => ids.includes(p.asset_type_id));
        }
        // Asset Variant (style)
        if (filters.assetVariant?.length) {
            const ids = filters.assetVariant.map(slug => {
                const v = masterData?.variants?.find(v => v.slug === slug || v.variant_id === slug);
                return v?.variant_id;
            }).filter(Boolean);
            if (ids.length) list = list.filter(p => ids.includes(p.asset_variant_id));
        }
        // Orientation
        if (filters.orientation?.length) {
            const ids = filters.orientation.map(slug => {
                const o = masterData?.orientations?.find(o => o.slug === slug || o.orientation_id === slug);
                return o?.orientation_id;
            }).filter(Boolean);
            if (ids.length) list = list.filter(p => ids.includes(p.asset_orientation_id));
        }
        // Price
        if (filters.maxPrice) {
            list = list.filter(p => (p.price || 0) <= filters.maxPrice);
        }

        // Sort
        if (SORT_FNS[sortBy]) list = [...list].sort(SORT_FNS[sortBy]);

        return list;
    }, [allProducts, filters, sortBy, masterData]);

    const visibleProducts = filteredProducts.slice(0, displayCount);
    const hasMore = displayCount < filteredProducts.length;

    // ─── Infinite Scroll Observer ───────────────────────────────────────────
    useEffect(() => {
        if (!hasMore || filterLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    // Small delay to make the transition feel smoother
                    setTimeout(() => {
                        setDisplayCount(prev => prev + PAGE_SIZE);
                    }, 100);
                }
            },
            { rootMargin: '200px' } // Start loading when within 200px of bottom
        );

        const target = document.getElementById('load-more-trigger');
        if (target) observer.observe(target);

        return () => observer.disconnect();
    }, [hasMore, filterLoading, displayCount]);

    // Count active filters (for mobile badge)
    const activeFilterCount = [
        ...(filters.parentCategory ?? []),
        ...(filters.assetCategory ?? []),
        ...(filters.assetSubCategory ?? []),
        ...(filters.assetType ?? []),
        ...(filters.assetVariant ?? []),
        ...(filters.orientation ?? []),
    ].length;

    // Banner logic: Show global banner only if no filters are active at all
    const isShopBase = activeFilterCount === 0 && !filters.search && !filters.maxPrice;

    // Banner logic: Show parent category banner ONLY if parentCategory is the ONLY filter active
    const bannerParentSlug = (activeFilterCount === 1 && filters.parentCategory?.length === 1 && !filters.search && !filters.maxPrice)
        ? filters.parentCategory[0]
        : null;

    // ─── Product detail mode ─────────────────────────────────────────────────
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
                {/* Standard Navbar (absolute by default) */}
                <Navbar isdark={false} highlight='shop' />

                {/* Main content pushed down to account for absolute navbar */}
                <main className="pt-24">
                    {/* Shop Banner */}
                    {/* <ShopBanner
                        masterData={masterData}
                        activeParentSlug={bannerParentSlug}
                        isShopBase={isShopBase}
                        onBrowseClick={() => {
                            document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    /> */}

                    {/* Main Shop Grid */}
                    <div id="shop-products" className="flex items-start max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 scroll-m-[100px]">
                        {/* ── Left Sidebar (desktop) ── */}
                        <div className="hidden lg:block sticky top-5 self-start">
                            <ShopSidebar
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                masterData={masterData}
                                maxPrice={maxPrice}
                            />
                        </div>

                        {/* ── Main content ── */}
                        <div className="flex-1 min-w-0 px-4 lg:px-8 pt-6 pb-20">
                            {/* Search Bar */}
                            <div className="mb-6">
                                <ShopSearchBar
                                    masterData={masterData}
                                    allProducts={allProducts}
                                    onSearch={(term) => handleFilterChange('search', term)}
                                    currentSearch={filters.search}
                                />
                            </div>

                            {/* Top Bar: Quick Filters + Chips + Count */}
                            <div className="mb-5">
                                <ShopTopBar
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    masterData={masterData}
                                    resultCount={filteredProducts.length}
                                    loading={filterLoading}
                                    sortBy={sortBy}
                                    onSortChange={setSortBy}
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100 mb-6" />

                            {/* Product Grid */}
                            {filteredProducts.length > 0 ? (
                                <>
                                    <ProductGrid products={visibleProducts} loading={filterLoading} />

                                    {/* Load More Trigger */}
                                    {hasMore && (
                                        <div id="load-more-trigger" className="w-full flex justify-center py-8">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-700 rounded-full animate-spin" />
                                                <span className="text-sm font-semibold text-gray-500">Loading templates...</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                !filterLoading && (
                                    <EmptyState
                                        allProducts={allProducts}
                                        onClear={() => handleFilterChange('bulk', {
                                            parentCategory: [], assetCategory: [], assetSubCategory: [],
                                            assetType: [], assetVariant: [], orientation: [],
                                            maxPrice: null, search: ''
                                        })}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <Footer />

            {/* Mobile filter system */}
            <MobileFilterButton
                count={activeFilterCount}
                onClick={() => setMobileFiltersOpen(true)}
            />
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

// ─── Server-side data fetch ────────────────────────────────────────────────────
export async function getStaticPaths() {
    return {
        paths: [],
        fallback: 'blocking',
    };
}

export async function getStaticProps(context) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    try {
        const [productsRes, masterRes, maxPriceRes] = await Promise.all([
            fetch(`${API_URL}/api/products`),
            fetch(`${API_URL}/api/products/master-data`),
            fetch(`${API_URL}/api/products/max-price`),
        ]);

        if (!productsRes.ok || !masterRes.ok) throw new Error('API fetch failed');

        const [initialProducts, masterData, maxPriceData] = await Promise.all([
            productsRes.json(),
            masterRes.json(),
            maxPriceRes.ok ? maxPriceRes.json() : { maxPrice: 10000 },
        ]);

        const trimmedProducts = (initialProducts || []).map(p => ({
            products_id: p.products_id || null,
            title: p.title || null,
            description: p.description ? p.description.replace(/<[^>]*>?/gm, '').substring(0, 80) : null,
            price: p.price || null,
            compared_price: p.compared_price || null,
            slug: p.slug || null,
            thumbnail: p.thumbnail || null,
            video: p.video || null,
            video_url: p.video_url || null,
            updatedAt: p.updatedAt || p.updated_at || null,
            averageRating: p.averageRating || null,
            reviewCount: p.reviewCount || null,
            parentCategory: p.parentCategory ? { slug: p.parentCategory.slug } : null,
            assetCategory: p.assetCategory ? { slug: p.assetCategory.slug } : null,
            assetSubCategory: p.assetSubCategory ? { slug: p.assetSubCategory.slug } : null,
            asset_type_id: p.asset_type_id || null,
            asset_variant_id: p.asset_variant_id || null,
            asset_orientation_id: p.asset_orientation_id || null,
        }));

        return {
            props: {
                initialProducts: trimmedProducts,
                masterData: masterData || {},
                maxPrice: maxPriceData?.maxPrice || 10000,
            },
            revalidate: 60, // Refresh every 60 seconds
        };
    } catch (err) {
        console.error('ShopPage getStaticProps error:', err);
        return {
            props: { initialProducts: [], masterData: {}, maxPrice: 10000 },
            revalidate: 60,
        };
    }
}
