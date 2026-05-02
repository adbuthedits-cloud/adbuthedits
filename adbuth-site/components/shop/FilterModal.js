import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

export default function FilterModal({ isOpen, onClose, filters, onFilterChange, preloadedMasterData, allProducts = [] }) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [count, setCount] = useState(allProducts.length);
    
    const masterData = preloadedMasterData || { types: [], variants: [], orientations: [], categories: [], subCategories: [], parentCategories: [] };

    useEffect(() => {
        setLocalFilters(filters);
    }, [isOpen, JSON.stringify(filters)]);

    useEffect(() => {
        if (!allProducts || !allProducts.length) return;
        const c = allProducts.filter(p => {
            if (localFilters.parentCategory?.length && !localFilters.parentCategory.includes(p.parent_category_id)) return false;
            if (localFilters.assetCategory?.length && !localFilters.assetCategory.includes(p.asset_category_id)) return false;
            if (localFilters.assetSubCategory?.length && !localFilters.assetSubCategory.includes(p.asset_sub_category_id)) return false;
            if (localFilters.assetType?.length && !localFilters.assetType.includes(p.asset_type_id)) return false;
            if (localFilters.assetVariant?.length && !localFilters.assetVariant.includes(p.asset_variant_id)) return false;
            if (localFilters.orientation?.length && !localFilters.orientation.includes(p.asset_orientation_id)) return false;
            if (localFilters.maxPrice && p.price > localFilters.maxPrice) return false;
            return true;
        }).length;
        setCount(c);
    }, [localFilters, allProducts]);

    const toggleFilter = (key, id) => {
        setLocalFilters(prev => {
            const current = prev[key] || [];
            let next;

            next = current.includes(id) 
                ? current.filter(item => item !== id)
                : [...current, id];
            
            return { ...prev, [key]: next };
        });
    };

    const handleApply = () => {
        onFilterChange('bulk', localFilters);
        onClose();
    };

    const handleClearAll = () => {
        setLocalFilters({
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
    };

    const maxAvailablePrice = allProducts.length ? Math.max(...allProducts.map(p => p.price || 0)) : 10000;

    if (!isOpen) return null;

    const Chips = ({ items, selected = [], onClick, nameKey = 'category_name', idKey }) => (
        <div className="flex flex-wrap gap-2">
            {items.map(item => {
                const id = item[idKey];
                const isSelected = selected.includes(id);
                return (
                    <button
                        key={id}
                        onClick={() => onClick(id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isSelected
                            ? 'bg-purple-700 border-purple-700 text-white shadow-lg scale-105'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'}`}
                    >
                        {item[nameKey] || item.name || item.category_name}
                    </button>
                );
            })}
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#1A1A1A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-2xl font-semibold text-white">Filter Templates</h2>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2">
                            <FontAwesomeIcon icon={faXmark} className="text-xl" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8 overflow-y-auto custom-scroll flex-1">
                        <div>
                            <h3 className="text-white/40 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">Category</h3>
                            <Chips
                                items={masterData.parentCategories}
                                selected={localFilters.parentCategory}
                                onClick={(id) => toggleFilter('parentCategory', id)}
                                nameKey="category_name"
                                idKey="category_id"
                            />
                        </div>

                        <div>
                            <h3 className="text-white/40 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">Event Type</h3>
                            <Chips
                                items={masterData.categories}
                                selected={localFilters.assetCategory}
                                onClick={(id) => toggleFilter('assetCategory', id)}
                                nameKey="name"
                                idKey="asset_category_id"
                            />
                        </div>

                        <div>
                            <h3 className="text-white/40 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">Occasion</h3>
                            <Chips
                                items={masterData.subCategories}
                                selected={localFilters.assetSubCategory}
                                onClick={(id) => toggleFilter('assetSubCategory', id)}
                                nameKey="name"
                                idKey="asset_sub_category_id"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-white/40 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">Format</h3>
                                <Chips
                                    items={masterData.types}
                                    selected={localFilters.assetType}
                                    onClick={(id) => toggleFilter('assetType', id)}
                                    nameKey="name"
                                    idKey="type_id"
                                />
                            </div>
                            <div>
                                <h3 className="text-white/40 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">Style</h3>
                                <Chips
                                    items={masterData.variants}
                                    selected={localFilters.assetVariant}
                                    onClick={(id) => toggleFilter('assetVariant', id)}
                                    nameKey="name"
                                    idKey="variant_id"
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white/40 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">Orientation</h3>
                            <Chips
                                items={masterData.orientations}
                                selected={localFilters.orientation}
                                onClick={(id) => toggleFilter('orientation', id)}
                                nameKey="name"
                                idKey="orientation_id"
                            />
                        </div>

                        <div>
                            <h3 className="text-white/40 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">Max Price</h3>
                            <div className="px-2">
                                <div className="flex justify-between text-white/70 mb-4 text-xs font-mono">
                                    <span>₹0</span>
                                    <span className="text-purple-400 font-bold text-sm">₹{localFilters.maxPrice || maxAvailablePrice}</span>
                                    <span>₹{maxAvailablePrice}+</span>
                                </div>
                                <input type="range" min="0" max={maxAvailablePrice} value={localFilters.maxPrice || maxAvailablePrice} onChange={e => setLocalFilters(p => ({ ...p, maxPrice: parseInt(e.target.value) }))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 flex gap-4 bg-[#1A1A1A]">
                        <button onClick={handleClearAll} className="px-6 py-3 text-white/40 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">
                            Reset
                        </button>
                        <button onClick={handleApply} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-[0_10px_30px_rgba(126,34,206,0.3)] active:scale-95 flex items-center justify-center gap-3">
                            Show Results
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{count}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

