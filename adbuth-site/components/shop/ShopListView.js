import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ShopGrid from './ShopGrid';
import SeoHead from '../SeoHead';

export default function ShopListView({
    filters, onFilterChange, showBanner, masterData, slug,
    products, allProducts, loading, maxPrice
}) {
    const getBannerData = () => {
        if (!masterData) return null;

        // 1. Main Shop Banner (from Master Data)
        if (!slug || slug.length === 0) {
            const settings = masterData.shopSettings;
            if (!settings || (!settings.shop_banner_image && !settings.shop_banner_title && !settings.shop_banner_subtitle)) {
                return null;
            }
            return {
                title: settings.shop_banner_title || "",
                subtitle: settings.shop_banner_subtitle || "",
                image: settings.shop_banner_image || "https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/shared/placeholder.jpg",
                type: settings.shop_banner_type || 'image'
            };
        }

        // 2. Category Banner
        const parent = masterData.parentCategories?.find(c => c.slug === slug[0]);
        if (!parent || (!parent.banner_image && !parent.banner_title && !parent.banner_subtitle)) {
            return null;
        }

        return {
            title: parent.banner_title || "",
            subtitle: parent.banner_subtitle || "",
            image: parent.banner_image || null,
            type: parent.banner_type || 'image',
            bg: parent.slug === 'greetings' ? "bg-[#0EA5E9]" : "bg-[#7E22CE]"
        };
    };

    const banner = getBannerData();

    return (
        <div className="">
            <SeoHead page="shop" title="Shop | Adbuth Edits" />

            <main>
                <AnimatePresence>
                    {(showBanner && banner) && (
                        <motion.div
                            key="shop-hero-banner"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                        >
                            <div className={` relative w-full h-[85vh] min-h-[500px] flex flex-col items-start justify-center text-left px-4`}>
                                {banner.image && (
                                    <div className="absolute inset-0 z-0">
                                        {banner.type === 'video' ? (
                                            <video
                                                src={banner.image}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                className="w-full h-full object-cover opacity-90"
                                            />
                                        ) : (
                                            <Image
                                                src={banner.image}
                                                alt="Banner"
                                                fill
                                                priority
                                                sizes="100vw"
                                                className="object-cover opacity-90"
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="relative z-10 max-w-4xl mx-8 md:mx-24 text-white">
                                    <h1
                                        className="text-4xl md:text-6xl font-bold mb-8 mt-12 leading-tight whitespace-pre-line drop-shadow-lg shadow-black"
                                    >
                                        {banner.title}
                                    </h1>

                                    <p
                                        className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl leading-relaxed drop-shadow-lg shadow-black"
                                    >
                                        {banner.subtitle}
                                    </p>

                                    {banner.title !== "" || banner.subtitle !== "" ? (
                                        <div
                                            className="flex flex-col sm:flex-row items-start justify-start gap-4"
                                        >
                                            <Link href="#browse" className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all shadow-lg hover:scale-105 active:scale-95">
                                                Browse Templates
                                            </Link>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className={`w-full px-4 md:px-12 `}
                >
                    <ShopGrid
                        filters={filters}
                        onFilterChange={onFilterChange}
                        products={products}
                        allProducts={allProducts}
                        loading={loading}
                        maxPrice={maxPrice}
                        masterData={masterData}
                    />
                </div>
            </main>
        </div>
    );
}
