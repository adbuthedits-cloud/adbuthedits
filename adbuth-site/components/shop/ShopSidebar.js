import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const FilterSection = ({ title, options, isOpen, onToggle, selection, onSelect, type = 'checkbox' }) => {
    return (
        <div className="border-b border-gray-200 py-4">
            <button
                className="flex items-center justify-between w-full text-left mb-2"
                onClick={onToggle}
            >
                <span className="font-semibold text-gray-800">{title}</span>
                <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="text-xs text-gray-500" />
            </button>

            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden"
            >
                <div className="flex flex-col gap-2 pt-2">
                    {options.map((option, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                            {type === 'checkbox' && (
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    checked={selection.includes(typeof option === 'string' ? option : option.value)}
                                    onChange={() => onSelect(option)}
                                />
                            )}
                            {type === 'color' && (
                                <div className={`w-5 h-5 rounded-full border border-gray-200 flex-shrink-0 ${selection.includes(option.value) ? 'ring-2 ring-[#7D287E] ring-offset-2' : ''}`}
                                    style={{ backgroundColor: option.code }}
                                />
                            )}
                            <span className="text-sm text-gray-600 group-hover:text-[#7D287E] transition-colors">
                                {typeof option === 'string' ? option : (option.label || option.value)}
                            </span>
                            {/* Hidden checkbox for logic if needed, but the label click works */}
                            {type === 'color' && (
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selection.includes(option.value)}
                                    onChange={() => onSelect(option.value)}
                                />
                            )}
                        </label>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default function ShopSidebar({ filters, onFilterChange }) {
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]); // Dynamic colors state
    const [toPersons, setToPersons] = useState([]); // Dynamic "For" options
    const [maxPrice, setMaxPrice] = useState(10000); // Default fallback
    const [openSections, setOpenSections] = useState({
        For: true,
        Occasion: true,
        Style: true,
        AddMusic: false,
        ColorTheme: true,
        Pricing: false
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/categories`);
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        const fetchMaxPrice = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/products/max-price`);
                if (res.ok) {
                    const data = await res.json();
                    setMaxPrice(data.maxPrice);
                }
            } catch (error) {
                console.error("Failed to fetch max price", error);
            }
        };
        const fetchColors = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/products/colors`);
                if (res.ok) {
                    const data = await res.json();
                    setColors(data);
                }
            } catch (error) {
                console.error("Failed to fetch colors", error);
            }
        };

        const fetchToPersons = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                // Fetch all products to extract unique "to_person" values as requested
                const res = await fetch(`${apiUrl}/api/products`);
                if (res.ok) {
                    const products = await res.json();
                    const allToPersons = new Set();

                    products.forEach(p => {
                        let toPerson = p.to_person;
                        if (typeof toPerson === 'string') {
                            try { toPerson = JSON.parse(toPerson); } catch { toPerson = []; }
                        }
                        if (Array.isArray(toPerson)) {
                            toPerson.forEach(person => {
                                if (person && typeof person === 'string') {
                                    allToPersons.add(person);
                                }
                            });
                        }
                    });

                    setToPersons(Array.from(allToPersons).sort());
                }
            } catch (error) {
                console.error("Failed to fetch to-person options", error);
            }
        };

        fetchCategories();
        fetchMaxPrice();
        fetchColors();
        fetchToPersons();
    }, []);

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Helper to get selected state
    const getSelection = (key) => filters[key] || [];

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 pr-0 lg:pr-8 py-8 hidden lg:block">
            {toPersons.length > 0 && (
                <FilterSection
                    title="For"
                    options={toPersons}
                    isOpen={openSections.For}
                    onToggle={() => toggleSection('For')}
                    selection={getSelection('for')}
                    onSelect={(val) => onFilterChange('for', val)}
                />
            )}
            <FilterSection
                title="Occasion"
                options={categories.map(c => ({ label: c.category_name, value: c.slug }))}
                isOpen={openSections.Occasion}
                onToggle={() => toggleSection('Occasion')}
                selection={filters.category ? [filters.category] : []}
                onSelect={(val) => onFilterChange('category', val.value || val)} // Handle object or string
                type="checkbox"
            />
            <FilterSection
                title="Style"
                options={['Minimal', 'Funny', 'Elegant', 'Traditional', 'Animated']}
                isOpen={openSections.Style}
                onToggle={() => toggleSection('Style')}
                selection={getSelection('style')}
                onSelect={(val) => onFilterChange('style', val)}
            />
            <FilterSection
                title="Add Music"
                options={['Yes', 'No']}
                isOpen={openSections.AddMusic}
                onToggle={() => toggleSection('AddMusic')}
                selection={getSelection('music')}
                onSelect={(val) => onFilterChange('music', val)}
            />
            <FilterSection
                title="Color Theme"
                options={colors}
                isOpen={openSections.ColorTheme}
                onToggle={() => toggleSection('ColorTheme')}
                selection={getSelection('color')}
                onSelect={(val) => onFilterChange('color', val)}
                type="color"
            />
            <div className="border-b border-gray-200 py-4">
                <button
                    className="flex items-center justify-between w-full text-left mb-2"
                    onClick={() => toggleSection('Pricing')}
                >
                    <span className="font-semibold text-gray-800">Review Price</span>
                    <FontAwesomeIcon icon={openSections.Pricing ? faChevronUp : faChevronDown} className="text-xs text-gray-500" />
                </button>

                <motion.div
                    initial={false}
                    animate={{ height: openSections.Pricing ? 'auto' : 0, opacity: openSections.Pricing ? 1 : 0 }}
                    className="overflow-hidden"
                >
                    <div className="pt-2 px-1">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>₹0</span>
                            <span className="font-semibold text-purple-600">₹{filters.maxPrice || maxPrice}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={maxPrice}
                            value={filters.maxPrice || maxPrice}
                            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Min</span>
                            <span>Max: ₹{maxPrice}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </aside>
    );
}
