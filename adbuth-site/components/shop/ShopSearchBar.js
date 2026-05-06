/**
 * ShopSearchBar.js
 *
 * Advanced search bar with:
 * - Live typeahead suggestions (categories, event types, occasions, products)
 * - Recent searches from localStorage (up to 5)
 * - "No results" state with recommended products grid
 * - Executes search on Enter or click of search icon
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faXmark, faClockRotateLeft, faArrowUpLeft } from '@fortawesome/free-solid-svg-icons';
import ProductCard from './ProductCard';

const RECENT_KEY = 'adbuth_recent_searches';
const MAX_RECENT = 5;

function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(term) {
    if (!term.trim()) return;
    const prev = getRecent().filter(t => t !== term.trim());
    localStorage.setItem(RECENT_KEY, JSON.stringify([term.trim(), ...prev].slice(0, MAX_RECENT)));
}

export default function ShopSearchBar({ masterData, allProducts, onSearch, currentSearch }) {
    const [term, setTerm] = useState(currentSearch || '');
    const [focused, setFocused] = useState(false);
    const [recent, setRecent] = useState([]);
    const [noResultProducts, setNoResultProducts] = useState(null); // null = not searched, [] = empty, [...] = recommendations
    const inputRef = useRef(null);
    const wrapRef = useRef(null);
    const router = useRouter();

    useEffect(() => { setTerm(currentSearch || ''); }, [currentSearch]);
    useEffect(() => { setRecent(getRecent()); }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Build typeahead suggestions
    const suggestions = useCallback(() => {
        const q = term.toLowerCase().trim();
        if (!q || q.length < 2 || !masterData) return [];
        const results = [];

        masterData.parentCategories?.forEach(c => {
            if (c.category_name.toLowerCase().includes(q))
                results.push({ type: 'Service', label: c.category_name, slug: c.slug, key: 'parentCategory' });
        });
        masterData.categories?.forEach(c => {
            if (c.name.toLowerCase().includes(q))
                results.push({ type: 'Event', label: c.name, slug: c.slug, key: 'assetCategory' });
        });
        masterData.subCategories?.forEach(c => {
            if (c.slug && c.name.toLowerCase().includes(q))
                results.push({ type: 'Occasion', label: c.name, slug: c.slug, key: 'assetSubCategory' });
        });
        allProducts?.forEach(p => {
            if (p.title.toLowerCase().includes(q))
                results.push({ type: 'Product', label: p.title, productSlug: p.slug, product: p });
        });

        return results.slice(0, 8);
    }, [term, masterData, allProducts]);

    const sugg = suggestions();
    const showDropdown = focused && (term.length < 2 ? recent.length > 0 : true);

    const executeSearch = (searchTerm) => {
        const t = searchTerm.trim();
        if (t) {
            saveRecent(t);
            setRecent(getRecent());
        }
        setFocused(false);

        // Check if there are matching products
        if (t && allProducts) {
            const matches = allProducts.filter(p =>
                p.title.toLowerCase().includes(t.toLowerCase()) ||
                p.description?.toLowerCase().includes(t.toLowerCase())
            );
            if (matches.length === 0) {
                setNoResultProducts(allProducts.slice(0, 12));
            } else {
                setNoResultProducts(null);
            }
        } else {
            setNoResultProducts(null);
        }

        onSearch(t);
    };

    const handleSuggestionClick = (s) => {
        if (s.type === 'Product') {
            const p = s.product;
            const url = `/shop/category/${p.parentCategory?.slug || 'all'}/${p.assetCategory?.slug || 'general'}/${p.slug}`;
            router.push(url);
        } else {
            setTerm(s.label);
            setNoResultProducts(null);
            onSearch('');
            // Apply as a filter instead of a text search
        }
        setFocused(false);
    };

    const clearSearch = () => {
        setTerm('');
        setNoResultProducts(null);
        onSearch('');
        inputRef.current?.focus();
    };

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Search Input */}
            <div ref={wrapRef} className="relative">
                <div className={`relative flex items-center border transition-colors ${focused ? 'border-purple-700 shadow-[0_0_0_3px_rgba(109,40,217,0.08)]' : 'border-gray-200 hover:border-gray-300'} bg-white`}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={term}
                        placeholder="Search for templates, styles, occasions..."
                        onChange={e => setTerm(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onKeyDown={e => { if (e.key === 'Enter') executeSearch(term); if (e.key === 'Escape') setFocused(false); }}
                        className="flex-1 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                    {term && (
                        <button onClick={clearSearch} className="p-2 text-gray-400 hover:text-gray-600">
                            <FontAwesomeIcon icon={faXmark} className="text-sm" />
                        </button>
                    )}
                    <button
                        onClick={() => executeSearch(term)}
                        className="h-full px-5 py-2.5 bg-purple-700 text-white hover:bg-purple-800 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faSearch} />
                        <span className="hidden sm:inline">Search</span>
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-xl z-50 mt-0.5">
                        {term.length < 2 && recent.length > 0 && (
                            <>
                                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    Recent Searches
                                </div>
                                {recent.map((r, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setTerm(r); executeSearch(r); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 text-left"
                                    >
                                        <FontAwesomeIcon icon={faClockRotateLeft} className="text-gray-300 text-xs" />
                                        {r}
                                    </button>
                                ))}
                            </>
                        )}
                        {term.length >= 2 && sugg.length > 0 && sugg.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(s)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 text-left group"
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 ${s.type === 'Product' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                    {s.type}
                                </span>
                                <span className="text-sm text-gray-800 group-hover:text-purple-700">{s.label}</span>
                                <FontAwesomeIcon icon={faArrowUpLeft} className="ml-auto text-gray-300 text-xs group-hover:text-purple-400" />
                            </button>
                        ))}
                        {term.length >= 2 && sugg.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400">No suggestions for "{term}"</div>
                        )}
                    </div>
                )}
            </div>

            {/* No Results State */}
            {noResultProducts !== null && (
                <div className="w-full">
                    <div className="py-10 text-center bg-gray-50 border border-gray-100">
                        <p className="text-lg font-bold text-gray-900 mb-1">No results for "{currentSearch}"</p>
                        <p className="text-sm text-gray-500 mb-4">We couldn't find an exact match. Try different keywords or clear the search.</p>
                        <button
                            onClick={clearSearch}
                            className="px-6 py-2 bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition-colors"
                        >
                            Clear Search
                        </button>
                    </div>

                    {noResultProducts.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Recommended For You</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {noResultProducts.map(p => <ProductCard key={p.products_id} product={p} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
