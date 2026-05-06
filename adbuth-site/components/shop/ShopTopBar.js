/**
 * ShopTopBar.js
 *
 * The horizontal bar above the product grid containing:
 * - Quick filter dropdowns: Format, Style, Orientation
 * - Active filter chips with × remove
 * - Sort By dropdown (right-aligned)
 * - Result count display
 */
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ label, options = [], selection = [], onSelect, badge }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const isActive = selection.length > 0;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(p => !p)}
                className={`flex items-center gap-2 px-4 py-1.5 border text-sm font-medium transition-colors ${isActive || open
                    ? 'border-purple-700 text-purple-700 bg-purple-50'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                    }`}
            >
                {label}
                {isActive && (
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-[10px] flex items-center justify-center font-bold">
                        {selection.length}
                    </span>
                )}
                <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-100 shadow-lg z-50 py-1">
                    {options.map((option, idx) => {
                        const val = typeof option === 'string' ? option : option.value;
                        const lbl = typeof option === 'string' ? option : option.label;
                        const isSelected = selection.includes(val);
                        return (
                            <label
                                key={idx}
                                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-purple-50' : ''}`}
                            >
                                <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-purple-700 border-purple-700' : 'border-gray-300'}`}>
                                    {isSelected && <FontAwesomeIcon icon={faCheck} className="text-white text-[7px]" />}
                                </div>
                                <span className={`text-sm ${isSelected ? 'text-purple-700 font-semibold' : 'text-gray-700'}`}>{lbl}</span>
                                <input type="checkbox" className="hidden" checked={isSelected} onChange={() => { onSelect(val); }} />
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = ['Recommended', 'Newest First', 'Price: Low to High', 'Price: High to Low'];

function SortDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(p => !p)}
                className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 bg-white text-sm hover:border-gray-300"
            >
                <span className="text-gray-500">Sort by:</span>
                <span className="font-semibold text-gray-900">{value}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-gray-100 shadow-lg z-50 py-1">
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 ${value === opt ? 'text-purple-700 font-semibold' : 'text-gray-700'}`}
                        >
                            {value === opt && <FontAwesomeIcon icon={faCheck} className="text-purple-700 text-[10px]" />}
                            {value !== opt && <span className="w-[10px]" />}
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main TopBar ───────────────────────────────────────────────────────────────
export default function ShopTopBar({ filters, onFilterChange, masterData, resultCount, loading, sortBy, onSortChange }) {

    const toggleMulti = (key, val) => {
        const current = filters[key] ?? [];
        const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
        onFilterChange(key, next);
    };

    // Build active chips from all current filters
    const activeChips = [];

    const pushChip = (key, dataArray, labelKey, valueKey) => {
        (filters[key] ?? []).forEach(val => {
            const item = dataArray?.find(d => (d[valueKey] === val || d.slug === val));
            if (item) activeChips.push({ key, val, label: item[labelKey] || val });
        });
    };

    if (masterData) {
        pushChip('parentCategory', masterData.parentCategories, 'category_name', 'slug');
        pushChip('assetCategory', masterData.categories, 'name', 'slug');
        pushChip('assetSubCategory', masterData.subCategories, 'name', 'slug');
        pushChip('assetType', masterData.types, 'name', 'slug');
        pushChip('assetVariant', masterData.variants, 'name', 'slug');
        pushChip('orientation', masterData.orientations, 'name', 'slug');
    }

    const removeChip = (key, val) => {
        const next = (filters[key] ?? []).filter(v => v !== val);
        // If removing a service type, also clear event types and occasions
        if (key === 'parentCategory') {
            onFilterChange('bulk', { ...filters, parentCategory: next, assetCategory: [], assetSubCategory: [] });
        } else {
            onFilterChange(key, next);
        }
    };

    const clearAll = () => {
        onFilterChange('bulk', {
            parentCategory: [], assetCategory: [], assetSubCategory: [],
            assetType: [], assetVariant: [], orientation: [],
            maxPrice: null, search: ''
        });
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Row 1: Quick Filters + Sort */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-1 hidden md:block">Quick Filters:</span>

                    <Dropdown
                        label="Format"
                        options={(masterData?.types ?? []).map(t => ({ label: t.name, value: t.slug || t.type_id }))}
                        selection={filters.assetType ?? []}
                        onSelect={(v) => toggleMulti('assetType', v)}
                    />
                    <Dropdown
                        label="Style"
                        options={(masterData?.variants ?? []).map(v => ({ label: v.name, value: v.slug || v.variant_id }))}
                        selection={filters.assetVariant ?? []}
                        onSelect={(v) => toggleMulti('assetVariant', v)}
                    />
                    <Dropdown
                        label="Orientation"
                        options={(masterData?.orientations ?? []).map(o => ({ label: o.name, value: o.slug || o.orientation_id }))}
                        selection={filters.orientation ?? []}
                        onSelect={(v) => toggleMulti('orientation', v)}
                    />
                </div>

                <SortDropdown value={sortBy} onChange={onSortChange} />
            </div>

            {/* Row 2: Applied Filter Chips */}
            {activeChips.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-500">Applied Filters:</span>
                    {activeChips.map((chip, i) => (
                        <button
                            key={i}
                            onClick={() => removeChip(chip.key, chip.val)}
                            className="flex items-center gap-1.5 px-3 py-1 border border-gray-200 bg-white text-[12px] text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors group"
                        >
                            {chip.label}
                            <FontAwesomeIcon icon={faXmark} className="text-gray-400 text-[10px] group-hover:text-red-500" />
                        </button>
                    ))}
                    <button onClick={clearAll} className="text-[11px] font-bold text-purple-700 hover:text-purple-900 ml-1">
                        Clear All
                    </button>
                </div>
            )}

            {/* Row 3: Result Count */}
            <div className="flex items-center gap-2">
                {loading ? (
                    <span className="flex items-center gap-2 text-[12px] text-gray-500">
                        <span className="w-3.5 h-3.5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                        Updating results...
                    </span>
                ) : (
                    <span className="text-[12px] text-gray-500">
                        <span className="font-bold text-gray-800">{resultCount}</span>
                        {' '}result{resultCount !== 1 ? 's' : ''} found
                    </span>
                )}
            </div>
        </div>
    );
}
