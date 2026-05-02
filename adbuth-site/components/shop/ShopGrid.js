import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ProductCard from './ProductCard';
import Loader from '../Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronLeft, faChevronRight, faSliders, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import FilterModal from './FilterModal';

export default function ShopGrid({
    filters, onFilterChange,
    products = [], allProducts = [], loading = false,
    masterData = { categories: [], parentCategories: [] }, maxPrice = 12000
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const scrollRef = useRef(null);

    // Sync search term with filters prop (e.g. when cleared)
    useEffect(() => {
        setSearchTerm(filters.search || '');
        setActiveIndex(-1);
    }, [filters.search]);

    // Reset active index when search term changes
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchTerm]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const [displayCount, setDisplayCount] = useState(20);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        setDisplayCount(20);
    }, [JSON.stringify(filters), searchTerm]);

    const visibleProducts = products.slice(0, displayCount);
    const hasMore = displayCount < products.length;

    const handleLoadMore = () => {
        setIsLoadingMore(true);
        setTimeout(() => {
            setDisplayCount(prev => prev + 20);
            setIsLoadingMore(false);
        }, 400);
    };

    // 3. Search Autocomplete Logic
    const searchLower = searchTerm.toLowerCase().trim();
    const suggestions = [];
    if (searchLower.length >= 2 && masterData) {
        masterData.parentCategories?.forEach(cat => {
            if (cat.category_name.toLowerCase().includes(searchLower)) {
                suggestions.push({ type: 'Category', text: cat.category_name, id: cat.category_id, parent: true });
            }
        });
        masterData.categories?.forEach(cat => {
            if (cat.name.toLowerCase().includes(searchLower)) {
                suggestions.push({ type: 'Event Type', text: cat.name, id: cat.asset_category_id, parent: false });
            }
        });
        masterData.subCategories?.forEach(sub => {
            if (sub.name.toLowerCase().includes(searchLower)) {
                suggestions.push({ type: 'Occasion', text: sub.name, id: sub.asset_sub_category_id, sub: true });
            }
        });
        if (products && products.length > 0) {
            products.slice(0, 4).forEach(prod => {
                suggestions.push({ type: 'Product', text: prod.title, slug: prod.slug, product: prod });
            });
        }
    }

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.type === 'Product') {
            const prod = suggestion.product;
            router.push(`/shop/${prod.parentCategory?.slug || 'all'}/${prod.assetCategory?.slug || 'templates'}/${prod.assetSubCategory?.slug || 'general'}/${prod.slug}`);
        } else if (suggestion.parent) {
            handleToggleFilter('parentCategory', suggestion.id);
        } else if (suggestion.sub) {
            handleToggleFilter('assetSubCategory', suggestion.id);
        } else {
            handleToggleFilter('assetCategory', suggestion.id);
        }
        setSearchTerm('');
        setIsSearchFocused(false);
        setActiveIndex(-1);
    };

    // 4. Keyboard Navigation Logic
    const handleKeyDown = (e) => {
        if (!isSearchFocused || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0) {
                e.preventDefault();
                handleSuggestionClick(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
            setActiveIndex(-1);
        }
    };

    // 4. Toggle Filter Logic
    const handleToggleFilter = (key, id) => {
        const current = filters[key] || [];
        let next;

        // Multi-select for everything as per user request
        if (current.includes(id)) {
            next = current.filter(item => item !== id);
        } else {
            next = [...current, id];
        }
        onFilterChange(key, next);
    };

    return (
        <div className="flex-1 py-8">
            <div className="max-w-6xl mx-auto mb-10 space-y-6">
                {/* Search Bar */}
                <div className="relative group z-1">
                    <div className="absolute inset-0 bg-white/40 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 rounded-2xl md:rounded-[1.5rem] h-14 md:h-16 group-hover:border-purple-200 transition-all duration-300">
                        <div className="pl-6 text-gray-400">
                            <FontAwesomeIcon icon={faSearch} className="text-lg" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for templates, styles, occasions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-4 pr-10 h-full text-gray-800 focus:outline-none placeholder-gray-400 text-base bg-transparent"
                        />
                    </div>

                    <AnimatePresence>
                        {isSearchFocused && searchTerm.length >= 2 && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[60]"
                            >
                                <div className="max-h-80 overflow-y-auto custom-scroll py-2">
                                    {suggestions.map((sug, idx) => (
                                        <div
                                            key={idx}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSuggestionClick(sug)}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`px-6 py-3 cursor-pointer flex items-center justify-between group/item transition-colors ${idx === activeIndex ? 'bg-purple-50' : 'hover:bg-purple-50'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`text-gray-900 font-medium transition-colors ${idx === activeIndex ? 'text-purple-700' : 'group-hover/item:text-purple-700'}`}>{sug.text}</span>
                                                <span className="text-xs text-gray-400">{sug.type}</span>
                                            </div>
                                            <FontAwesomeIcon icon={faChevronRight} className={`text-xs transition-colors ${idx === activeIndex ? 'text-purple-500' : 'text-gray-300 group-hover/item:text-purple-500'}`} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Categories Row (Event Type Chips - Multi-Select) */}
                <div className="flex items-center gap-4 px-2">
                    <div className="relative flex-1 group/scroll overflow-hidden">
                        {/* Left Scroll Button - Only show if group hovered */}
                        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center w-12 bg-gradient-to-r from-white via-white/70 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300">
                            <button
                                onClick={() => scroll('left')}
                                className="w-8 h-8 flex items-center justify-center bg-transparent  text-gray-500 hover:text-black hover:border-black transition-all pointer-events-auto ml-1"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                            </button>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-x-scroll no-scrollbar py-2"
                        >
                            <div className="flex items-center gap-2 md:gap-3 px-1">
                                <button
                                    onClick={() => onFilterChange('bulk', {
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
                                    })}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border ${!filters.parentCategory?.length && !filters.assetCategory?.length && !filters.assetSubCategory?.length && !filters.search
                                        ? 'bg-black text-white border-black shadow-lg'
                                        : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    All
                                </button>

                                {/* Active Parent Category Chips */}
                                {masterData?.parentCategories?.filter(pc => filters.parentCategory?.includes(pc.category_id)).map((cat) => (
                                    <button
                                        key={cat.category_id}
                                        onClick={() => handleToggleFilter('parentCategory', cat.category_id)}
                                        className="px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border bg-black text-white border-black shadow-lg flex items-center gap-2 group"
                                    >
                                        {cat.category_name}
                                        <FontAwesomeIcon
                                            icon={faXmark}
                                            className="text-[10px] opacity-60 hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleFilter('parentCategory', cat.category_id);
                                            }}
                                        />
                                    </button>
                                ))}

                                {/* Event Type Chips (AssetCategory) - Sorted by selection then name */}
                                {[...(masterData?.categories || [])].sort((a, b) => {
                                    const aSelected = filters.assetCategory?.includes(a.asset_category_id);
                                    const bSelected = filters.assetCategory?.includes(b.asset_category_id);
                                    if (aSelected === bSelected) return 0;
                                    return aSelected ? -1 : 1;
                                }).map((cat) => {
                                    const isSelected = filters.assetCategory?.includes(cat.asset_category_id);
                                    return (
                                        <button
                                            key={cat.asset_category_id}
                                            onClick={() => handleToggleFilter('assetCategory', cat.asset_category_id)}
                                            className={`px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap border flex items-center gap-2 group ${isSelected
                                                ? 'bg-black text-white border-black shadow-lg'
                                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            {cat.name}
                                            {isSelected && (
                                                <FontAwesomeIcon
                                                    icon={faXmark}
                                                    className="text-[10px] opacity-60 hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleFilter('assetCategory', cat.asset_category_id);
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Scroll Button */}
                        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center w-12 justify-end bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300">
                            <button
                                onClick={() => scroll('right')}
                                className="w-8 h-8 flex items-center justify-center bg-transparent  text-gray-500 hover:text-black hover:border-black transition-all pointer-events-auto ml-1"

                            >
                                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all group shrink-0"
                    >
                        <span className="text-sm font-bold text-gray-700">Filters</span>
                        <FontAwesomeIcon icon={faSliders} className="text-xs text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </button>
                </div>
            </div>

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onFilterChange={onFilterChange}
                preloadedMasterData={masterData}
                maxPrice={maxPrice}
                allProducts={allProducts}
            />

            <div className="min-h-[400px]">
                {loading ? (
                    <Loader />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8">
                        {visibleProducts.length > 0 ? (
                            visibleProducts.map((product, index) => (
                                <div
                                    key={product.products_id}
                                >
                                    <ProductCard product={product} index={index} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-gray-500">
                                No products found matching your search.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!loading && hasMore && (
                <div className="flex justify-center mt-12 mb-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="bg-white border-2 border-gray-100 text-gray-800 px-8 py-3 rounded-full font-bold hover:border-gray-300 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoadingMore ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                            </>
                        ) : (
                            <>
                                View More Products
                                <FontAwesomeIcon icon={faChevronDown} />
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
