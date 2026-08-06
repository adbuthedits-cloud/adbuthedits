import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faPlus, faShareAlt, faCheck, faStar, faPlay, faEnvelope, faLink, faTimes, faSpinner, faSearch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { faWhatsapp, faXTwitter, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { Star, Heart } from 'lucide-react';
import dynamic from 'next/dynamic';

import ImageStack from './ImageStack';
import MediaLightbox from './MediaLightbox';
import CustomizationForm from '../CustomizationForm';
import AvailableOffers from './AvailableOffers';
import ProductCard from './ProductCard';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import toast from 'react-hot-toast';
import SeoHead from '../SeoHead';
import { cdnImage, cdnVideo } from '../../utils/cdn';

const ReviewSection = dynamic(() => import('../ReviewSection'), { loading: () => <p className="text-center py-10">Loading Reviews...</p> });

// ─── Product Slider with Arrow Controls ───────────────────────────────────────
function ProductSlider({ products, title }) {
    const sliderRef = useRef(null);
    const scroll = (dir) => {
        if (sliderRef.current) {
            const firstChild = sliderRef.current.firstChild;
            if (firstChild) {
                const cardWidth = firstChild.getBoundingClientRect().width;
                const gap = 16; // gap-4 is 1rem (16px)
                sliderRef.current.scrollBy({ left: dir * (cardWidth + gap), behavior: 'smooth' });
            } else {
                sliderRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
            }
        }
    };
    return (
        <div className="pt-10 mt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{title}</h3>
                <div className="flex gap-2">
                    <button onClick={() => scroll(-1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-600 hover:text-purple-600 transition-colors">
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                    </button>
                    <button onClick={() => scroll(1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-600 hover:text-purple-600 transition-colors">
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </button>
                </div>
            </div>
            <div ref={sliderRef} className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory scroll-smooth px-4 sm:mx-0 sm:px-0">
                {products.map(p => (
                    <div key={p.products_id} className="flex-none snap-start w-[160px] sm:w-[190px]">
                        <ProductCard product={p} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ProductDetailView({ slug, masterData }) {
    const router = useRouter();
    // State
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
    const [isCustomiseModalOpen, setIsCustomiseModalOpen] = useState(false);
    const [customisationData, setCustomisationData] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [occasionGroups, setOccasionGroups] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    const { user } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const isWishlisted = isInWishlist(product?.products_id);

    // Fetch Main Product Data
    useEffect(() => {
        if (!slug) return;

        const fetchData = async () => {
            setLoading(true);
            setProduct(null);
            window.scrollTo(0, 0);

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/products/${slug}`);
                if (!res.ok) throw new Error('Product not found');
                const data = await res.json();
                setProduct(data);

                // Fetch Related Products (Priority: assetCategory, Fallback: parentCategory)
                let related = [];

                // 1. Try Sub-Category (assetCategory)
                if (data.assetCategory?.asset_category_id) {
                    const relRes = await fetch(`${apiUrl}/api/products?assetCategory=${data.assetCategory.asset_category_id}`);
                    if (relRes.ok) related = await relRes.json();
                }

                // 2. Fallback to Parent Category if few results
                if (related.length < 5 && data.parentCategory?.category_id) {
                    const relRes = await fetch(`${apiUrl}/api/products?parentCategory=${data.parentCategory.category_id}`);
                    if (relRes.ok) {
                        const parentRelated = await relRes.json();
                        const seenIds = new Set(related.map(p => p.products_id));
                        parentRelated.forEach(p => {
                            if (!seenIds.has(p.products_id)) related.push(p);
                        });
                    }
                }

                setRelatedProducts(related.filter(p => p.slug !== slug).slice(0, 10));

                // ─── Fetch & Group by Occasion (for section below reviews) ───
                if (data.assetCategory?.asset_category_id) {
                    const occRes = await fetch(`${apiUrl}/api/products?assetCategory=${data.assetCategory.asset_category_id}&limit=200`);
                    if (occRes.ok) {
                        const allRelated = await occRes.json();

                        // Group by sub-category name
                        const groupsMap = {};
                        allRelated.forEach(p => {
                            if (p.slug === slug) return; // skip current
                            const subCat = p.assetSubCategory?.name || 'Other';
                            const subCatSlug = p.assetSubCategory?.slug || '';
                            if (!groupsMap[subCat]) {
                                groupsMap[subCat] = { name: subCat, slug: subCatSlug, products: [] };
                            }
                            if (groupsMap[subCat].products.length < 20) {
                                groupsMap[subCat].products.push(p);
                            }
                        });

                        // Sort: current product's occasion first, then others
                        const currentOccasionName = data.assetSubCategory?.name || 'Other';
                        const sortedGroups = Object.values(groupsMap).sort((a, b) => {
                            if (a.name === currentOccasionName) return -1;
                            if (b.name === currentOccasionName) return 1;
                            return 0;
                        });

                        setOccasionGroups(sortedGroups.slice(0, 5));
                    }
                }
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    const hasProcessedPendingCart = useRef(false);

    // Fetch Review Stats
    useEffect(() => {
        if (!product?.products_id) return;
        const fetchReviewStats = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/reviews/product/${product.products_id}`);
                const data = await res.json();
                if (data.success) {
                    setReviewStats({
                        averageRating: data.averageRating,
                        totalReviews: data.totalReviews
                    });
                }
            } catch (err) {
                console.error('Error fetching review stats:', err);
            }
        };
        fetchReviewStats();
    }, [product?.products_id]);

    // Restore pending customization & complete Add to Cart after login
    useEffect(() => {
        if (!user || !product || loading || hasProcessedPendingCart.current) return;

        const pendingRaw = localStorage.getItem('pendingAddToCart');
        if (!pendingRaw) return;

        try {
            const pending = JSON.parse(pendingRaw);
            if (pending && pending.productId === product.products_id) {
                hasProcessedPendingCart.current = true;
                localStorage.removeItem('pendingAddToCart');

                const restoredData = deserializeCustomisationData(pending.customisationData);
                setCustomisationData(restoredData);
                if (pending.quantity) setQuantity(pending.quantity);
                if (pending.selectedLanguage) setSelectedLanguage(pending.selectedLanguage);

                if (pending.autoSubmit) {
                    toast.loading('Logged in! Completing your Add to Cart request...', { id: 'pending-cart' });
                    setTimeout(() => {
                        toast.dismiss('pending-cart');
                        executeAddToCart(restoredData, pending.quantity || 1, pending.selectedLanguage || 'English');
                    }, 400);
                }
            }
        } catch (e) {
            console.error('Error restoring pending add to cart:', e);
            localStorage.removeItem('pendingAddToCart');
        }
    }, [user, product, loading]);

    // Helpers to serialize/deserialize customisationData (including File objects) for localStorage
    const serializeCustomisationData = async (data) => {
        if (!data) return {};
        const result = {};
        for (const [key, val] of Object.entries(data)) {
            if (val instanceof File) {
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(val);
                });
                result[key] = { __isFile: true, name: val.name, type: val.type, dataUrl };
            } else if (Array.isArray(val)) {
                result[key] = await Promise.all(val.map(async item => {
                    if (item instanceof File) {
                        const dataUrl = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.readAsDataURL(item);
                        });
                        return { __isFile: true, name: item.name, type: item.type, dataUrl };
                    }
                    return item;
                }));
            } else {
                result[key] = val;
            }
        }
        return result;
    };

    const deserializeCustomisationData = (data) => {
        if (!data) return {};
        const result = {};
        for (const [key, val] of Object.entries(data)) {
            if (val && typeof val === 'object' && val.__isFile) {
                const arr = val.dataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                result[key] = new File([u8arr], val.name, { type: mime });
            } else if (Array.isArray(val)) {
                result[key] = val.map(item => {
                    if (item && typeof item === 'object' && item.__isFile) {
                        const arr = item.dataUrl.split(',');
                        const mime = arr[0].match(/:(.*?);/)[1];
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                        return new File([u8arr], item.name, { type: mime });
                    }
                    return item;
                });
            } else {
                result[key] = val;
            }
        }
        return result;
    };

    const executeAddToCart = async (overrideData = null, overrideQty = null, overrideLang = null) => {
        const dataToUse = overrideData || customisationData;
        const qtyToUse = overrideQty || quantity;
        const langToUse = overrideLang || selectedLanguage;

        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            // 1. Collect all raw File objects from customization data
            const filesToUpload = [];
            Object.values(dataToUse).forEach(val => {
                if (Array.isArray(val)) {
                    val.forEach(item => { if (item instanceof File) filesToUpload.push(item); });
                } else if (val instanceof File) {
                    filesToUpload.push(val);
                }
            });

            // 2. Upload unique files if any
            const fileMap = new Map();
            const uniqueFiles = Array.from(new Set(filesToUpload));

            if (uniqueFiles.length > 0) {
                await Promise.all(uniqueFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch(`${apiUrl}/api/cart/upload-media`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || `Failed to upload ${file.name}`);
                    }
                    const data = await res.json();
                    fileMap.set(file, { url: data.url, name: file.name });
                }));
            }

            // 3. Prepare final customization payload with cloud URLs
            const customizationGroups = typeof product.customization === 'string'
                ? JSON.parse(product.customization)
                : product.customization;

            const finalCustomizations = [];
            for (let i = 0; i < qtyToUse; i++) {
                const itemData = {};
                if (Array.isArray(customizationGroups)) {
                    customizationGroups.forEach(groupObj => {
                        const groupName = Object.keys(groupObj)[0];
                        const fields = groupObj[groupName];
                        itemData[groupName] = {};
                        fields.forEach(([label]) => {
                            const fieldKey = `item_${i}_${groupName}_${label}`;
                            const rawValue = dataToUse[fieldKey];

                            // Map local File objects to cloud result objects
                            if (Array.isArray(rawValue)) {
                                itemData[groupName][label] = rawValue.map(v => v instanceof File ? fileMap.get(v) : v).filter(Boolean);
                            } else if (rawValue instanceof File) {
                                itemData[groupName][label] = fileMap.get(rawValue);
                            } else if (rawValue) {
                                itemData[groupName][label] = rawValue;
                            }
                        });
                    });
                }
                finalCustomizations.push(itemData);
            }

            // 4. Submit to Cart API
            const res = await fetch(`${apiUrl}/api/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ product_id: product.products_id, customization: finalCustomizations, quantity: qtyToUse, language: langToUse })
            });

            if (res.ok) {
                toast.success('Added to cart successfully!');
                setIsCustomiseModalOpen(false);
                setSelectedItemIndex(0);
                return true;
            } else {
                const err = await res.json();
                throw new Error(err.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Cart Error:', error);
            toast.error(error.message || 'Something went wrong');
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem('intendedDestination', currentPath);
            try {
                const serialized = await serializeCustomisationData(customisationData);
                const pendingObj = {
                    productId: product.products_id,
                    slug: slug,
                    customisationData: serialized,
                    quantity: quantity,
                    selectedLanguage: selectedLanguage,
                    autoSubmit: true
                };
                localStorage.setItem('pendingAddToCart', JSON.stringify(pendingObj));
            } catch (e) {
                console.error('Failed to save pending add to cart data', e);
            }
            router.push('/login');
            return;
        }
        return await executeAddToCart();
    };

    const handleFieldChange = (group, label, value) => {
        const fieldKey = `item_${selectedItemIndex}_${group}_${label}`;
        setCustomisationData(prev => ({
            ...prev,
            [fieldKey]: value
        }));
    };

    const parsedSchema = product?.customization
        ? (typeof product.customization === 'string' ? JSON.parse(product.customization) : product.customization)
        : [];

    // Helper to get actual data for the current item in the nested format CustomizationForm expects
    const getCurrentItemData = () => {
        const itemData = {};
        if (!Array.isArray(parsedSchema)) return {};

        parsedSchema.forEach(groupObj => {
            const groupName = Object.keys(groupObj)[0];
            const fields = groupObj[groupName];
            itemData[groupName] = {};
            fields.forEach(([label]) => {
                const fieldKey = `item_${selectedItemIndex}_${groupName}_${label}`;
                itemData[groupName][label] = customisationData[fieldKey] || '';
            });
        });
        return itemData;
    };
    if (loading) {
        return (
            <div className="min-h-[75vh] w-full flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center animate-pulse">
                    {/* Left: Media Stack Skeleton */}
                    <div className="w-full aspect-[4/5] max-h-[480px] bg-gradient-to-br from-purple-50/80 to-purple-100/50 rounded-2xl border border-purple-100/80 flex flex-col items-center justify-center p-8 shadow-sm">
                        <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center mb-4">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-purple-600 text-xl" />
                        </div>
                        <div className="h-3.5 w-36 bg-purple-200/60 rounded-full mb-2" />
                        <div className="h-3 w-24 bg-purple-200/40 rounded-full" />
                    </div>

                    {/* Right: Product Info Skeleton */}
                    <div className="space-y-6 flex flex-col justify-center">
                        <div className="space-y-3">
                            <div className="h-4 w-1/3 bg-gray-200/70 rounded-full" />
                            <div className="h-9 w-4/5 bg-gray-200/90 rounded-xl" />
                            <div className="h-7 w-1/4 bg-purple-200/80 rounded-lg mt-2" />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="h-4 w-full bg-gray-200/60 rounded-full" />
                            <div className="h-4 w-5/6 bg-gray-200/60 rounded-full" />
                            <div className="h-4 w-3/4 bg-gray-200/60 rounded-full" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                            <div className="h-12 flex-1 bg-purple-600/10 rounded-full border border-purple-200/50" />
                            <div className="h-12 flex-1 bg-purple-600/20 rounded-full border border-purple-300/50" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (!product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
                <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
                <Link href="/shop" className="px-6 py-3 bg-purple-700 text-white rounded-full font-medium hover:bg-purple-800 transition">
                    Back to Shop
                </Link>
            </div>
        );
    }

    const prodMedia = [
        ...(Array.isArray(product.images) ? product.images.map(src => ({ src: cdnImage(src), type: 'image' })) : (product.images ? [{ src: cdnImage(product.images), type: 'image' }] : [])),
        ...(Array.isArray(product.video) ? product.video.map(src => ({ src: cdnVideo(src), type: 'video' })) : (product.video ? [{ src: cdnVideo(product.video), type: 'video' }] : [])),
    ];
    if (prodMedia.length === 0 && product.thumbnail) {
        prodMedia.push({ src: cdnImage(product.thumbnail), type: 'image' });
    }

    const handleCustomiseClick = () => {
        if (!user) {
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem('intendedDestination', currentPath);
            toast.error('Please log in to customise your order.');
            router.push('/login');
            return;
        }
        setIsCustomiseModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <SeoHead
                data={{
                    meta_title: product?.meta_title,
                    meta_description: product?.meta_description,
                    meta_keywords: product?.meta_keywords || (product?.tags ? Object.values(product.tags).join(', ') : ''),
                    og_image: prodMedia[0]?.src,
                    canonical_url: product?.canonical_url
                }}
                title={`${product?.title || 'Product'} | Adbuth Edits`}
                description={product?.description && product.description.substring(0, 160)}
                image={prodMedia[0]?.src}
            />

            {/* Copy Success Notification */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: copySuccess ? 1 : 0, y: copySuccess ? 20 : -20 }}
                className="fixed top-20 right-8 z-[1000] bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 pointer-events-none"
            >
                <FontAwesomeIcon icon={faCheck} className="text-green-400" />
                <span className="font-medium">Link copied to clipboard!</span>
            </motion.div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-10 md:pt-0 md:mt-0 relative bg-[#fff]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 lg:mt-8 lg:mb-12">
                    <div>
                        {(() => {
                            // Find orientation in masterData using the product's asset_orientation_id
                            const orientation = masterData?.orientations?.find(o => o.orientation_id === product.asset_orientation_id)
                                || product.assetOrientation || {};

                            const orientCode = (orientation.code || '').toLowerCase();
                            const orientName = (orientation.name || '').toLowerCase();

                            const isHorizontal = orientCode.includes('hor') || orientCode.includes('land') ||
                                orientCode === 'h' || orientCode === 'l' ||
                                orientName.includes('hor') || orientName.includes('land');

                            return <ImageStack media={prodMedia} layout={isHorizontal ? 'horizontal' : 'vertical'} productTitle={product.title} onCardClick={(i) => { setLightboxIndex(i); setLightboxOpen(true); }} />;
                        })()}
                    </div>

                    <div className="space-y-3 sm:space-y-4 mb-4">
                        <div>
                            <div className="hidden lg:flex items-center flex-nowrap text-sm text-gray-500 font-medium whitespace-nowrap overflow-x-auto no-scrollbar">
                                {product.parentCategory && (
                                    <Link href={`/shop?parentCategory=${product.parentCategory?.slug || 'all'}`} className="hover:text-purple-700">{product.parentCategory?.category_name}</Link>
                                )}
                                {product.assetCategory && (
                                    <>
                                        <span className="mx-2 text-gray-400">&gt;</span>
                                        <Link href={`/shop?parentCategory=${product.parentCategory?.slug || 'all'}&assetCategory=${product.assetCategory?.slug || 'templates'}`} className="hover:text-purple-700">{product.assetCategory?.name}</Link>
                                    </>
                                )}
                                {product.assetSubCategory && (
                                    <>
                                        <span className="mx-2 text-gray-400">&gt;</span>
                                        <Link href={`/shop?parentCategory=${product.parentCategory?.slug || 'all'}&assetCategory=${product.assetCategory?.slug || 'templates'}&assetSubCategory=${product.assetSubCategory?.slug || 'general'}`} className="hover:text-purple-700">{product.assetSubCategory?.name}</Link>
                                    </>
                                )}
                                <span className="mx-2 text-gray-400">&gt;</span>
                                <span className="text-gray-900 truncate max-w-[300px]"> {product.title}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 sm:mt-4 text-gray-900 leading-tight">{product.title}</h1>

                        </div>

                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-3xl font-black text-gray-900 tracking-tight">₹{product.price}</span>
                            {product.compared_price > product.price && (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg text-gray-500 font-medium ml-1">
                                        MRP <span className="line-through decoration-gray-400">₹{product.compared_price}</span>
                                    </span>
                                    <span className="text-lg text-orange-500 font-bold">
                                        ({Math.round(((product.compared_price - product.price) / product.compared_price) * 100)}% OFF)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Ratings */}
                        <div className="flex items-center gap-3 mt-4">
                            <span className="font-semibold text-gray-800">{Number(reviewStats.averageRating || 0).toFixed(1)}</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={16} className={i <= Math.round(reviewStats.averageRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                                ))}
                            </div>
                            <a href="#reviews" className="text-sm text-purple-600 font-medium hover:underline">({reviewStats.totalReviews} reviews)</a>
                        </div>

                        {/* Available Offers Section (Minimal Myntra Style) */}
                        <AvailableOffers productId={product.products_id} />

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleWishlist(product.products_id)}
                                    className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border transition ${isWishlisted ? 'bg-purple-700 border-purple-700' : 'bg-white border-gray-300 hover:border-purple-700'}`}
                                >
                                    <Heart size={18} className={`transition ${isWishlisted ? 'text-white fill-white' : 'text-gray-600'}`} />
                                </motion.button>
                                <button onClick={handleAddToCart} className="flex-1 bg-purple-700 hover:bg-purple-800 text-white px-5 sm:px-8 py-3.5 sm:py-3 rounded-full text-base font-medium shadow-lg transition active:scale-[0.98]">Add to Cart</button>
                            </div>
                            <button onClick={handleCustomiseClick} className="w-full sm:flex-1 border border-purple-700 text-purple-700 px-5 sm:px-8 py-3.5 sm:py-3 rounded-full text-base font-medium hover:bg-purple-50 transition active:scale-[0.98]">Customise Now</button>
                        </div>

                        {/* Description Section */}
                        {product.description && (
                            <div className="pt-6 sm:pt-8 border-t border-gray-100 mt-6">
                                <h2 className="text-lg font-bold text-purple-700 mb-3 uppercase tracking-tight">Product Description</h2>
                                <div className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                                    {product.description}
                                </div>
                            </div>
                        )}

                        {/* About Section - Only show if summary exists */}
                        {product.summary && Object.keys(product.summary).length > 0 && (
                            <div className="pt-3 sm:pt-6">
                                <h2 className="text-xl sm:text-xl font-semibold mb-4 sm:mb-6 text-purple-700">About The Templates</h2>
                                <div className="space-y-6">
                                    {Object.entries(product.summary).map(([key, value]) => (
                                        <div key={key}>
                                            <h3 className="font-bold text-gray-900 text-sm sm:text-base capitalize mb-2">{key.replace(/_/g, ' ')}</h3>
                                            <ul className="space-y-2 text-sm sm:text-base text-gray-600 list-disc pl-5">
                                                {Array.isArray(value) ? value.map((item, idx) => (
                                                    <li key={idx} className="marker:text-gray-400 pl-1 leading-relaxed">{item}</li>
                                                )) : <li className="marker:text-gray-400 pl-1 leading-relaxed">{value}</li>}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sharing */}
                        <div className="pt-4 pb-8">
                            <button onClick={() => setShowShareMenu(!showShareMenu)} className="text-gray-500 hover:text-purple-700 flex items-center gap-2 text-sm font-medium transition-colors">
                                <FontAwesomeIcon icon={faShareAlt} /> Share this template
                            </button>
                            {showShareMenu && (
                                <div className="absolute bg-white shadow-2xl rounded-2xl border border-gray-100 p-3 z-50 flex gap-4 mt-4">
                                    {[{ id: 'whatsapp', icon: faWhatsapp, color: 'text-green-500' }, { id: 'facebook', icon: faFacebook, color: 'text-blue-600' }, { id: 'twitter', icon: faXTwitter, color: 'text-black' }, { id: 'email', icon: faEnvelope, color: 'text-gray-600' }].map((item) => (
                                        <button key={item.id} onClick={() => handleShare(item.id)} className={`${item.color} hover:scale-110 transition-transform p-1`}><FontAwesomeIcon icon={item.icon} size="lg" /></button>
                                    ))}
                                    <button onClick={copyToClipboard} className="text-purple-600 hover:scale-110 transition-transform p-1"><FontAwesomeIcon icon={faLink} size="lg" /></button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* ── Recommended For You — full width below the product section ── */}
                {relatedProducts.length > 0 && (
                    <ProductSlider products={relatedProducts} title="Recommended For You" />
                )}



                <div className="max-w-7xl mx-auto px-0 bg-white pb-16">
                    <div className="border-t border-gray-100 pt-10">
                        <ReviewSection products_id={product.products_id} />
                    </div>

                    {/* Occasion-based Recommendations */}
                    {occasionGroups.length > 0 && (
                        <div className="mt-10 md:mt-20 space-y-10 md:space-y-16 px-4 sm:px-6 lg:px-8">
                            {occasionGroups.map((group, idx) => (
                                <div key={group.name} className="animate-in mt-10 md:mt-20 fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="flex items-end justify-between mb-6 sm:mb-8">
                                        <div>
                                            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tighter uppercase">
                                                {group.name}
                                            </h2>
                                            <div className="h-1 w-10 sm:w-12 bg-purple-600 mt-2" />
                                        </div>
                                        <Link
                                            href={`/shop?parentCategory=${product.parentCategory?.slug || 'all'}&assetCategory=${product.assetCategory?.slug || ''}&assetSubCategory=${group.slug}`}
                                            className="text-xs sm:text-sm font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 sm:gap-2 group transition-all"
                                        >
                                            VIEW ALL
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </Link>
                                    </div>

                                    <div className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
                                        {group.products.map(p => (
                                            <div key={p.products_id} className="w-[200px] sm:w-[240px] flex-none snap-start">
                                                <ProductCard product={p} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <AnimatePresence>
                {lightboxOpen && <MediaLightbox media={prodMedia} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />}
            </AnimatePresence>

            {/* Customisation Modal */}
            <AnimatePresence>
                {isCustomiseModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustomiseModalOpen(false)} />
                        <motion.div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="font-bold">Customise Your Order</h2>
                                <button onClick={() => setIsCustomiseModalOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {quantity > 1 && (
                                    <div className="mb-6 flex gap-2">
                                        {Array.from({ length: quantity }).map((_, i) => (
                                            <button key={i} onClick={() => setSelectedItemIndex(i)} className={`flex-1 h-2 rounded-full ${i === selectedItemIndex ? 'bg-purple-600' : 'bg-gray-200'}`} />
                                        ))}
                                    </div>
                                )}

                                <CustomizationForm
                                    schema={parsedSchema}
                                    data={getCurrentItemData()}
                                    onChange={handleFieldChange}
                                    index={selectedItemIndex}
                                    selectedLanguage={selectedLanguage}
                                    onLanguageChange={setSelectedLanguage}
                                />

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isUploading}
                                        className="w-full bg-purple-600 text-white py-4 px-8 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                                    >
                                        {isUploading ? (
                                            <><FontAwesomeIcon icon={faSpinner} spin className="text-lg" /> Confirming & Uploading...</>
                                        ) : (
                                            <>
                                                <span className="whitespace-nowrap">Confirm & Add to Cart</span>
                                                <FontAwesomeIcon icon={faCheck} className="group-hover:translate-x-1 transition-transform text-lg" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
