import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import ShopListView from '../../components/shop/ShopListView';
import ProductDetailView from '../../components/shop/ProductDetailView';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageLoader from '../../components/PageLoader';

export default function UnifiedShop() {
    const router = useRouter();
    const { slug } = router.query;

    const [masterData, setMasterData] = useState({ categories: [], parentCategories: [], types: [], variants: [], orientations: [], subCategories: [] });
    const [filters, setFilters] = useState({
        parentCategory: [],
        assetCategory: [],
        assetSubCategory: [],
        assetType: [],
        assetVariant: [],
        orientation: [],
        style: [],
        color: [],
        music: [],
        maxPrice: null,
        search: ''
    });
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // All products for counts in FilterModal
    const [loading, setLoading] = useState(true);
    const [maxPrice, setMaxPrice] = useState(12000);

    const isFirstRender = useRef(true);

    // 1. Fetch Master Data and All Products (for counts)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const [masterDataRes, allProdRes, priceRes] = await Promise.all([
                    fetch(`${apiUrl}/api/products/master-data`, { cache: 'no-store' }),
                    fetch(`${apiUrl}/api/products`),
                    fetch(`${apiUrl}/api/products/max-price`)
                ]);

                if (masterDataRes.ok) setMasterData(await masterDataRes.json());
                if (allProdRes.ok) setAllProducts(await allProdRes.json());
                if (priceRes.ok) {
                    const priceData = await priceRes.json();
                    setMaxPrice(priceData.maxPrice);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        };
        fetchInitialData();
    }, []);

    // 1b. Fetch Filtered Products (Centralized)
    useEffect(() => {
        if (!masterData || masterData.parentCategories?.length === 0) return;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.search) params.append('search', filters.search);

                // Hierarchy/Multi-select Slugs (URL-friendly)
                if (filters.parentCategory?.length) params.append('parentCategory', filters.parentCategory.map(id => getSlugFromId(id, 'parentCategory')).join(','));
                if (filters.assetCategory?.length) params.append('assetCategory', filters.assetCategory.map(id => getSlugFromId(id, 'assetCategory')).join(','));
                if (filters.assetSubCategory?.length) params.append('assetSubCategory', filters.assetSubCategory.map(id => getSlugFromId(id, 'assetSubCategory')).join(','));

                // Other Filters
                if (filters.assetType?.length) params.append('assetType', filters.assetType.join(','));
                if (filters.assetVariant?.length) params.append('assetVariant', filters.assetVariant.join(','));
                if (filters.orientation?.length) params.append('orientation', filters.orientation.join(','));
                if (filters.style?.length) params.append('style', filters.style.join(','));
                if (filters.color?.length) params.append('color', filters.color.join(','));
                if (filters.music?.length) params.append('music', filters.music.join(','));
                if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/products?${params.toString()}`);
                if (res.ok) setProducts(await res.json());
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchProducts();
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [JSON.stringify(filters), masterData]);

    // 1c. Scroll to top on filter change or slug change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [slug]);

    useEffect(() => {
        if (!isFirstRender.current) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [JSON.stringify(filters)]);

    // 2. Sync URL Slugs and Query Params to Filter State
    useEffect(() => {
        if (!masterData || masterData.parentCategories?.length === 0 || !router.isReady) return;

        const currentSlug = Array.isArray(slug) ? slug : (slug ? [slug] : []);

        const {
            parentCategory, assetCategory, assetSubCategory,
            assetType, assetVariant, orientation,
            style, color, music, maxPrice, search
        } = router.query;

        const newFilters = {
            parentCategory: [],
            assetCategory: [],
            assetSubCategory: [],
            assetType: [],
            assetVariant: [],
            orientation: [],
            style: [],
            color: [],
            music: [],
            maxPrice: maxPrice || null,
            search: search || ''
        };

        const parseQueryValue = (val, type) => {
            if (!val) return [];
            const values = Array.isArray(val) ? val : val.split(',');

            return values.map(v => {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
                if (isUuid) return v;

                let items = [];
                switch (type) {
                    case 'parentCategory': items = masterData.parentCategories; break;
                    case 'assetCategory': items = masterData.categories; break;
                    case 'assetSubCategory': items = masterData.subCategories; break;
                    case 'assetType': items = masterData.types; break;
                    case 'assetVariant': items = masterData.variants; break;
                    case 'orientation': items = masterData.orientations; break;
                    default: return v;
                }
                const item = items.find(i => i.slug === v);
                if (item) {
                    return item.category_id || item.asset_category_id || item.asset_sub_category_id || item.type_id || item.variant_id || item.orientation_id;
                }
                return v;
            }).filter(Boolean);
        };

        if (currentSlug.length > 0 && currentSlug[0] !== 'all') {
            const p = masterData.parentCategories?.find(c => c.slug === currentSlug[0]);
            if (p) newFilters.parentCategory.push(p.category_id);

            if (currentSlug[1]) {
                const c = masterData.categories?.find(cat => cat.slug === currentSlug[1]);
                if (c) newFilters.assetCategory.push(c.asset_category_id);
            }

            if (currentSlug[2]) {
                const s = masterData.subCategories?.find(sub => sub.slug === currentSlug[2]);
                if (s) newFilters.assetSubCategory.push(s.asset_sub_category_id);
            }
        }

        newFilters.parentCategory = [...new Set([...newFilters.parentCategory, ...parseQueryValue(parentCategory, 'parentCategory')])];
        newFilters.assetCategory = [...new Set([...newFilters.assetCategory, ...parseQueryValue(assetCategory, 'assetCategory')])];
        newFilters.assetSubCategory = [...new Set([...newFilters.assetSubCategory, ...parseQueryValue(assetSubCategory, 'assetSubCategory')])];
        newFilters.assetType = parseQueryValue(assetType, 'assetType');
        newFilters.assetVariant = parseQueryValue(assetVariant, 'assetVariant');
        newFilters.orientation = parseQueryValue(orientation, 'orientation');
        newFilters.style = Array.isArray(style) ? style : (style ? style.split(',') : []);
        newFilters.color = Array.isArray(color) ? color : (color ? color.split(',') : []);
        newFilters.music = Array.isArray(music) ? music : (music ? music.split(',') : []);

        setFilters(newFilters);
        isFirstRender.current = false;
    }, [slug, masterData, router.isReady, router.query]);

    const ALLOWED_QUERY_FIELDS = [
        'parentCategory', 'assetCategory', 'assetSubCategory',
        'assetType', 'assetVariant', 'orientation',
        'style', 'color', 'music', 'maxPrice', 'search'
    ];

    const getSlugFromId = (id, type) => {
        if (!masterData) return id;
        let items = [];
        switch (type) {
            case 'parentCategory': items = masterData.parentCategories; break;
            case 'assetCategory': items = masterData.categories; break;
            case 'assetSubCategory': items = masterData.subCategories; break;
            case 'assetType': items = masterData.types; break;
            case 'assetVariant': items = masterData.variants; break;
            case 'orientation': items = masterData.orientations; break;
            default: return id;
        }
        const item = items.find(i =>
            (i.category_id === id) ||
            (i.asset_category_id === id) ||
            (i.asset_sub_category_id === id) ||
            (i.type_id === id) ||
            (i.variant_id === id) ||
            (i.orientation_id === id)
        );
        return item ? item.slug : id;
    };

    const handleFilterChange = (section, value) => {
        const newQuery = { ...router.query };

        if (section === 'bulk') {
            ALLOWED_QUERY_FIELDS.forEach(key => {
                if (value[key] !== undefined) {
                    const val = value[key];
                    if (Array.isArray(val) && val.length > 0) {
                        newQuery[key] = val.map(id => getSlugFromId(id, key)).join(',');
                    } else if (val && !Array.isArray(val)) {
                        newQuery[key] = getSlugFromId(val, key);
                    } else {
                        delete newQuery[key];
                    }
                }
            });
        } else {
            if (ALLOWED_QUERY_FIELDS.includes(section)) {
                if (Array.isArray(value) && value.length > 0) {
                    newQuery[section] = value.map(id => getSlugFromId(id, section)).join(',');
                } else if (value && !Array.isArray(value)) {
                    newQuery[section] = getSlugFromId(value, section);
                } else {
                    delete newQuery[section];
                }
            }
        }

        const currentSlug = router.query.slug;
        const finalQuery = { ...newQuery };

        // If it's a bulk reset (All button), navigate to 'all' slug to hide banner
        if (section === 'bulk' && (!value.parentCategory?.length && !value.assetCategory?.length && !value.assetSubCategory?.length && !value.search)) {
            router.push({
                pathname: '/shop/[[...slug]]',
                query: { slug: ['all'] }
            }, undefined, { shallow: true });
            return;
        }

        if (currentSlug) finalQuery.slug = currentSlug;

        router.push({
            pathname: '/shop/[[...slug]]',
            query: finalQuery
        }, undefined, { shallow: true });
    };

    // 3. Render logic
    const currentSlug = Array.isArray(slug) ? slug : (slug ? [slug] : []);
    const isProductView = currentSlug.length >= 4;
    const productSlug = isProductView ? currentSlug[currentSlug.length - 1] : null;
    const depth = currentSlug.length;

    const hasSearch = !!router.query.search;
    const hasFilters = !!(
        router.query.assetCategory ||
        router.query.assetSubCategory ||
        router.query.assetType ||
        router.query.assetVariant ||
        router.query.orientation ||
        router.query.style ||
        router.query.color ||
        router.query.music ||
        (router.query.parentCategory && depth === 0)
    );

    const isRootShop = depth === 0;
    const isCategoryPage = depth === 1 && currentSlug[0] !== 'all';
    const showBanner = (isRootShop || isCategoryPage) && !hasSearch && !hasFilters;

    return (
        <div className="min-h-screen bg-white flex flex-col justify-between">
            <Navbar highlight="shop" isdark={false} />

            <main className="flex-grow pt-24">
                {isProductView ? (
                    <ProductDetailView key={`product-${productSlug}`} slug={productSlug} />
                ) : (
                    <ShopListView
                        key="shop-list-view"
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        showBanner={showBanner}
                        masterData={masterData}
                        slug={currentSlug}
                        products={products}
                        allProducts={allProducts}
                        loading={loading}
                        maxPrice={maxPrice}
                    />
                )}
            </main>

            <Footer />
        </div>
    );
}
