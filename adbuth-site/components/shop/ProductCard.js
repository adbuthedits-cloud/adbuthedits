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
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid, faStar } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';

const NEW_BADGE_DAYS = 15;

function isNewProduct(updatedAt) {
    if (!updatedAt) return false;
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
    return diffDays <= NEW_BADGE_DAYS;
}

export default function ProductCard({ product }) {
    const [wishlisted, setWishlisted] = useState(false);

    if (!product) return null;

    const isNew = isNewProduct(product.updatedAt || product.updated_at);
    const rating = product.averageRating ? parseFloat(product.averageRating).toFixed(1) : null;
    const reviewCount = product.reviewCount ? parseInt(product.reviewCount) : 0;

    // Build the product detail URL
    const parentSlug = product.parentCategory?.slug || 'all';
    const eventSlug = product.assetCategory?.slug || 'general';
    const productSlug = product.slug;
    const productUrl = `/shop/category/${parentSlug}/${eventSlug}/${productSlug}`;

    const thumbnail = product.thumbnail || (product.images && product.images[0]) || null;
    const videoUrl = (product.video && product.video.length > 0) ? product.video[0] : (product.video_url || null);

    const hasDiscount = product.compared_price && product.compared_price > product.price;
    const discountPct = hasDiscount
        ? Math.round(((product.compared_price - product.price) / product.compared_price) * 100)
        : 0;

    return (
        <div className="group relative flex flex-col bg-white   hover:shadow-md transition-all duration-200">
            {/* Image Container */}
            <Link href={productUrl} className="block relative overflow-hidden bg-gray-50" style={{ aspectRatio: '3/4' }}>
                {thumbnail ? (
                    <Image
                        src={thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    />
                ) : videoUrl ? (
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        autoPlay
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-xs">No Preview</span>
                    </div>
                )}

                {/* NEW Badge */}
                {isNew && (
                    <span className="absolute top-2 left-0 bg-black text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest z-10">
                        New
                    </span>
                )}

                {/* Discount Badge - Moved to bottom-left to avoid overlap */}
                {hasDiscount && (
                    <div className="absolute bottom-0 left-0 bg-gray-200/50 backdrop-blur-xl  text-white px-2.5 py-0.5 z-10 rounded-full ml-2 my-2">
                        <span className="text-[10px] font-bold  tracking-tight">{discountPct}% OFF</span>
                    </div>
                )}
            </Link>

            {/* Wishlist Button - Redesigned with glassmorphism */}
            <button
                onClick={(e) => { e.preventDefault(); setWishlisted(v => !v); }}
                className="absolute top-2 right-2 z-20 w-8 h-8 bg-gray-200/50 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-sm group/wishlist"
                aria-label="Add to wishlist"
            >
                <FontAwesomeIcon
                    icon={wishlisted ? faHeartSolid : faHeartOutline}
                    className={`text-sm transition-transform duration-200 group-active/wishlist:scale-125 ${wishlisted ? 'text-red-500' : 'text-gray-900'}`}
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
                        <span className="text-[11px] text-gray-400 line-through">₹{product.compared_price}</span>
                    )}
                </div>
            </Link>
        </div>
    );
}
