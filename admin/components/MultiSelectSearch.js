"use client";
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const MultiSelectSearch = ({ options, selectedValues, onSelect, placeholder, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (id) => {
        const newSelection = selectedValues.includes(id)
            ? selectedValues.filter(v => v !== id)
            : [...selectedValues, id];
        onSelect(newSelection);
    };

    return (
        <div className="relative mb-4" ref={dropdownRef}>
            <label className="block text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1.5 ml-1">{label}</label>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white flex justify-between items-center cursor-pointer transition-all ${isOpen ? 'border-[#7D287E] ring-1 ring-[#7D287E]/20' : 'hover:border-[#3b2a5f]'}`}
            >
                <div className="flex flex-wrap gap-1.5 max-w-[90%] overflow-hidden">
                    {selectedValues.length === 0 ? (
                        <span className="text-gray-500 text-sm">{placeholder}</span>
                    ) : (
                        selectedValues.map(id => {
                            const option = options.find(o => o.value === id);
                            return (
                                <span key={id} className="bg-[#7D287E] text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                                    {option?.label}
                                    <FontAwesomeIcon 
                                        icon={faTimes} 
                                        className="hover:text-red-400 cursor-pointer" 
                                        onClick={(e) => { e.stopPropagation(); toggleOption(id); }}
                                    />
                                </span>
                            );
                        })
                    )}
                </div>
                <FontAwesomeIcon icon={faChevronDown} className={`text-gray-600 text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-[#1E1628] border border-[#2d1b4e] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-[#2d1b4e] flex items-center gap-3 bg-[#130C1C]">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-sm" />
                        <input 
                            type="text"
                            placeholder="Search items..."
                            className="bg-transparent border-none outline-none text-white text-sm w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm italic">No items found</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt.value}
                                    onClick={(e) => { e.stopPropagation(); toggleOption(opt.value); }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between group ${selectedValues.includes(opt.value) ? 'bg-[#7D287E]/10 text-[#a78bfa]' : 'text-gray-400 hover:bg-[#2d1b4e] hover:text-white'}`}
                                >
                                    <span>{opt.label}</span>
                                    {selectedValues.includes(opt.value) && (
                                        <div className="w-2 h-2 rounded-full bg-[#7D287E] shadow-[0_0_8px_#7D287E]" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    {selectedValues.length > 0 && (
                        <div className="p-2 border-t border-[#2d1b4e] bg-[#130C1C] flex justify-center">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSelect([]); }}
                                className="text-[10px] font-bold text-gray-500 hover:text-red-400 uppercase tracking-widest p-1"
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelectSearch;
