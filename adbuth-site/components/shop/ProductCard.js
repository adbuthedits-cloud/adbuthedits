import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { faStar, faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useWishlist } from '../../context/WishlistContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

export default function ProductCard({ product, index }) {
    // 1. Idle Image (Prioritize Thumbnail field)
    const idleImage = product.thumbnail || (Array.isArray(product.images) ? product.images[0] : product.images);

    // 2. Hover Image (Prioritize First Gallery Image if different from idle)
    const galleryImages = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);
    const hoverImage = galleryImages.find(img => img !== idleImage) || idleImage;

    const { toggleWishlist, isInWishlist } = useWishlist();
    const isWishlisted = isInWishlist(product.products_id);

    // Status Badge Logic
    const isPremium = product.style?.includes('Premium') || product.is_premium;

    // Check if updated in the last 1 month (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const productDate = new Date(product.updatedAt || product.createdAt || 0);
    const isNew = productDate > thirtyDaysAgo;

    // Real Review Data
    const rating = product.averageRating ? Number(product.averageRating).toFixed(1) : '0.0';
    const reviews = product.reviewCount || '0';

    // Build Hierarchical URL: /shop/parent/category/subcategory/slug
    const buildUrl = () => {
        const pSlug = product.parentCategory?.slug || 'all';
        const cSlug = product.assetCategory?.slug || 'templates';
        const sSlug = product.assetSubCategory?.slug || 'general';
        return `/shop/${pSlug}/${cSlug}/${sSlug}/${product.slug}`;
    };

    return (
        <Link href={buildUrl()} className="group block">
            <motion.div
                whileHover={{
                    y: -8,
                    transition: { duration: 0.3, ease: 'easeOut' }
                }}
                className="bg-white rounded-[1rem] p-3 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 h-full flex flex-col"
            >
                {/* Image Container */}
                <div className="relative aspect-[2/3]  bg-[#F8F9FA] overflow-hidden rounded-[.5rem] mb-4">
                    {/* Badge */}
                    {isPremium && (
                        <div className="absolute top-3 left-3 z-10 bg-[#D4AF37]/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Premium</span>
                        </div>
                    )}
                    {!isPremium && isNew && (
                        <div className="absolute top-3 left-3 z-10 bg-[#4ADE80]/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">New</span>
                        </div>
                    )}

                    {/* Wishlist Icon */}
                    <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product.products_id);
                        }}
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-800 transition-colors shadow-sm"
                    >
                        <FontAwesomeIcon icon={isWishlisted ? faHeart : faHeartRegular} className={`text-sm transition-colors duration-300 ${isWishlisted ? 'text-red-500' : 'text-gray-600'}`} />
                    </motion.button>

                    {/* Idle Image */}
                    {idleImage && (
                        <Image
                            src={idleImage}
                            alt={product.title}
                            fill
                            priority={index < 4}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    )}

                    {/* Quick View Overlay (Matches ref image button style) */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            Quick View
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 px-1 mt-2">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{product.title || "Fun Birthday Bash"}</h3>

                    {/* Description */}
                    <div className="mb-3">
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">
                            {product.description || "No description available"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[10px]" />
                            <span className="text-[11px] font-semibold text-gray-700">{rating}</span>
                            <span className="text-[10px] text-gray-400">({reviews} reviews)</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">₹{product.price || 499}</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
