/**
 * ShopSidebar.js
 * 
 * Left filter panel:
 * - Service Types: single-select (radio)
 * - Event Types: multi-select checkbox (updates dynamically when service type changes)
 * - Occasions: multi-select, filtered by selected event types
 * - Formats, Styles, Orientations: multi-select
 * - Price: range slider
 * - View More / View Less on sections with >5 options
 * - Count badge per section when filters active
 * - No page reload — all state pushed via router.push({ shallow, scroll: false })
 */
import { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faCheck } from '@fortawesome/free-solid-svg-icons';

const PREVIEW_LIMIT = 5;

// ─── Single reusable filter section ───────────────────────────────────────────
function FilterSection({ title, options = [], selection = [], onSelect, singleSelect = false, defaultOpen = true }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [showAll, setShowAll] = useState(false);

    if (!options.length) return null;

    const hasMore = options.length > PREVIEW_LIMIT;
    const visible = showAll ? options : options.slice(0, PREVIEW_LIMIT);

    const selectedCount = options.filter(o => {
        const v = typeof o === 'string' ? o : o.value;
        return singleSelect ? selection[0] === v : selection.includes(v);
    }).length;

    return (
        <div className="border-b border-gray-100">
            {/* Section header */}
            <button
                onClick={() => setIsOpen(p => !p)}
                className="flex items-center justify-between w-full py-3 text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">{title}</span>
                    {selectedCount > 0 && (
                        <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-purple-700 text-white text-[9px] font-bold">
                            {selectedCount}
                        </span>
                    )}
                </div>
                <FontAwesomeIcon
                    icon={isOpen ? faChevronUp : faChevronDown}
                    className="text-[9px] text-gray-400 flex-shrink-0"
                />
            </button>

            {/* Options list */}
            {isOpen && (
                <div className="pb-3 flex flex-col gap-0.5">
                    {visible.map((option, idx) => {
                        const val = typeof option === 'string' ? option : option.value;
                        const label = typeof option === 'string' ? option : option.label;
                        const isSelected = singleSelect ? selection[0] === val : selection.includes(val);

                        return (
                            <label
                                key={idx}
                                className={`flex items-center gap-3 px-1 py-1.5 cursor-pointer group transition-colors ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                            >
                                {/* Custom checkbox/radio */}
                                <div
                                    className={`flex-shrink-0 flex items-center justify-center transition-all ${singleSelect
                                        ? `w-4 h-4 rounded-full border-2 ${isSelected ? 'border-purple-700' : 'border-gray-300 group-hover:border-purple-400'}`
                                        : `w-4 h-4 border-2 ${isSelected ? 'bg-purple-700 border-purple-700' : 'border-gray-300 group-hover:border-purple-400'}`
                                        }`}
                                    onClick={() => onSelect(val)}
                                >
                                    {singleSelect && isSelected && (
                                        <div className="w-2 h-2 rounded-full bg-purple-700" />
                                    )}
                                    {!singleSelect && isSelected && (
                                        <FontAwesomeIcon icon={faCheck} className="text-white text-[8px]" />
                                    )}
                                </div>
                                <span
                                    className={`text-[13px] leading-tight transition-colors select-none ${isSelected ? 'text-purple-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}
                                    onClick={() => onSelect(val)}
                                >
                                    {label}
                                </span>
                            </label>
                        );
                    })}

                    {/* View more / less */}
                    {hasMore && (
                        <button
                            onClick={() => setShowAll(p => !p)}
                            className="mt-1 px-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 uppercase tracking-wide flex items-center gap-1"
                        >
                            <FontAwesomeIcon icon={showAll ? faChevronUp : faChevronDown} className="text-[9px]" />
                            {showAll ? 'View Less' : `View ${options.length - PREVIEW_LIMIT} More`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function ShopSidebar({ filters, onFilterChange, masterData, maxPrice, isMobile = false }) {
    // Local state for price to avoid triggering search on every drag step
    const [localPrice, setLocalPrice] = useState(filters.maxPrice ?? maxPrice);

    // Sync local price if filters are cleared or changed externally
    useEffect(() => {
        setLocalPrice(filters.maxPrice ?? maxPrice);
    }, [filters.maxPrice, maxPrice]);

    // Which parentCategory is selected (single value or null)
    const selectedParent = filters.parentCategory?.[0] ?? null;
    const selectedCategories = filters.assetCategory ?? [];

    // Dynamically filter event types by selected parent
    const availableEventTypes = useMemo(() => {
        if (!masterData?.categories) return [];
        if (!selectedParent) return masterData.categories;
        const parent = masterData.parentCategories?.find(p => p.slug === selectedParent);
        if (!parent) return masterData.categories;
        return masterData.categories.filter(c => c.parent_category_id === parent.category_id);
    }, [masterData, selectedParent]);

    // Dynamically filter occasions by selected event types
    const availableOccasions = useMemo(() => {
        if (!masterData?.subCategories) return [];
        if (!selectedCategories.length) return masterData.subCategories;
        const catIds = selectedCategories.map(slug => {
            const cat = masterData.categories?.find(c => c.slug === slug);
            return cat?.asset_category_id;
        }).filter(Boolean);
        return masterData.subCategories.filter(sc => catIds.includes(sc.asset_category_id) && sc.slug);
    }, [masterData, selectedCategories]);

    // Handlers
    const handleSingleSelect = (key, slug) => {
        const current = filters[key]?.[0];
        // Toggle off if already selected; also clear dependent filters
        if (current === slug) {
            onFilterChange('bulk', { ...filters, [key]: [], assetCategory: [], assetSubCategory: [] });
        } else {
            onFilterChange('bulk', { ...filters, [key]: [slug], assetCategory: [], assetSubCategory: [] });
        }
    };

    const handleMultiSelect = (key, slug) => {
        const current = filters[key] ?? [];
        const next = current.includes(slug)
            ? current.filter(v => v !== slug)
            : [...current, slug];
        onFilterChange(key, next);
    };

    const handleClearAll = () => {
        onFilterChange('bulk', {
            parentCategory: [], assetCategory: [], assetSubCategory: [],
            assetType: [], assetVariant: [], orientation: [],
            maxPrice: null, search: ''
        });
    };

    const hasActiveFilters = [
        ...(filters.parentCategory ?? []),
        ...(filters.assetCategory ?? []),
        ...(filters.assetSubCategory ?? []),
        ...(filters.assetType ?? []),
        ...(filters.assetVariant ?? []),
        ...(filters.orientation ?? []),
    ].length > 0;

    return (
        <aside className={`${isMobile ? 'w-full h-full' : 'w-64 h-[calc(100vh-100px)] border-r'} flex-shrink-0 overflow-y-auto custom-scroll bg-white border-gray-100 flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <span className="text-[12px] font-black text-gray-900 uppercase tracking-[0.15em]">Filters</span>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearAll}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 uppercase tracking-wider"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Filter sections */}
            <div className="flex-1 px-4 py-2 overflow-y-auto custom-scroll">
                {/* SERVICE TYPES — single select */}
                <FilterSection
                    title="Service Types"
                    options={(masterData?.parentCategories ?? []).map(c => ({ label: c.category_name, value: c.slug }))}
                    selection={filters.parentCategory ?? []}
                    onSelect={(slug) => handleSingleSelect('parentCategory', slug)}
                    singleSelect={true}
                    defaultOpen={true}
                />

                {/* EVENT TYPES — multi select, filtered by service type */}
                <FilterSection
                    title="Event Types"
                    options={availableEventTypes.map(c => ({ label: c.name, value: c.slug }))}
                    selection={filters.assetCategory ?? []}
                    onSelect={(slug) => handleMultiSelect('assetCategory', slug)}
                    defaultOpen={true}
                />

                {/* OCCASIONS — multi select, filtered by event type */}
                <FilterSection
                    title="Occasions"
                    options={availableOccasions.map(c => ({ label: c.name, value: c.slug }))}
                    selection={filters.assetSubCategory ?? []}
                    onSelect={(slug) => handleMultiSelect('assetSubCategory', slug)}
                    defaultOpen={true}
                />

                {/* FORMATS */}
                <FilterSection
                    title="Formats"
                    options={(masterData?.types ?? []).map(t => ({ label: t.name, value: t.slug || t.type_id }))}
                    selection={filters.assetType ?? []}
                    onSelect={(slug) => handleMultiSelect('assetType', slug)}
                />

                {/* STYLES */}
                <FilterSection
                    title="Styles"
                    options={(masterData?.variants ?? []).map(v => ({ label: v.name, value: v.slug || v.variant_id }))}
                    selection={filters.assetVariant ?? []}
                    onSelect={(slug) => handleMultiSelect('assetVariant', slug)}
                />

                {/* ORIENTATIONS */}
                <FilterSection
                    title="Orientations"
                    options={(masterData?.orientations ?? []).map(o => ({ label: o.name, value: o.slug || o.orientation_id }))}
                    selection={filters.orientation ?? []}
                    onSelect={(slug) => handleMultiSelect('orientation', slug)}
                />

                {/* PRICE */}
                {maxPrice > 0 && (
                    <div className="border-b border-gray-100 pb-4">
                        <button
                            className="flex items-center justify-between w-full py-3 text-left"
                        >
                            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Price</span>
                        </button>
                        <div className="px-1">
                            <input
                                type="range"
                                min={0}
                                max={maxPrice}
                                value={localPrice ?? maxPrice}
                                onChange={e => setLocalPrice(Number(e.target.value))}
                                onMouseUp={() => onFilterChange('maxPrice', localPrice)}
                                onTouchEnd={() => onFilterChange('maxPrice', localPrice)}
                                className="w-full h-1 accent-purple-700 cursor-pointer"
                            />
                            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                                <span>₹0</span>
                                <span className="font-bold text-purple-700">₹{localPrice ?? maxPrice}</span>
                                <span>₹{maxPrice}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
