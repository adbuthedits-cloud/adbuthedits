import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlus, faTimes, faSearch, faChevronDown, faGlobe } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

const LANGUAGES = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada',
    'Malayalam', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati'
];

export default function CustomizationForm({ schema, data, onChange, index = 0, isEditMode = false, selectedLanguage = 'English', onLanguageChange }) {
    const [uploadingState, setUploadingState] = useState({});
    // Schema is expected to be an array of group objects: [{ "Group Name": [["Label", "Type"], ...] }]

    if (!Array.isArray(schema)) return null;

    return (
        <div className="space-y-6">
            {!isEditMode && (
                <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-200">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Details for Item #{index + 1}</h3>
                        <p className="text-xs text-gray-500 font-medium tracking-tight">Customise this unit specifically</p>
                    </div>
                </div>
            )}


            {schema.map((groupObj, groupIdx) => {
                const groupName = Object.keys(groupObj)[0];
                const fields = groupObj[groupName];
                const isLastGroup = groupIdx === schema.length - 1;

                return (
                    <React.Fragment key={groupIdx}>
                        {/* Inject Language Selector before the last group */}
                        {isLastGroup && onLanguageChange && (
                            <div className="p-4 bg-white border border-purple-100 rounded-xl shadow-sm">
                                <label className="block text-[13px] font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                        <FontAwesomeIcon icon={faGlobe} className="text-[10px]" />
                                    </span>
                                    <span className="text-red-500 mr-0.5">*</span>
                                    Language
                                </label>
                                <p className="text-[11px] text-gray-400 mb-3 font-medium">Select the language for your invitation content</p>
                                <div className="relative">
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => onLanguageChange(e.target.value)}
                                        className="w-full appearance-none border border-gray-200 px-4 py-2.5 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm text-gray-900 bg-white cursor-pointer font-medium"
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang} value={lang}>{lang}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <FontAwesomeIcon icon={faChevronDown} className="text-[11px]" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-purple-400 rounded-full" />
                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{groupName}</h4>
                        </div>

                        <div className="grid gap-4">
                            {fields.map((field, fieldIdx) => {
                                const [label, type] = field;
                                const isRequired = label.toLowerCase().includes('optional') ? false : true;
                                // If editing, data structure is nested { Group: { Label: Value } }
                                // If adding new (from slug), expected structure might differ, 
                                // BUT the parent manages state. 
                                // Let's standardized props: "data" is the flat or nested object?
                                // To make it reusable, let's assume the PARENT handles the "key" generation or efficient mapping.
                                // Actually, for simplicity in reusing existing logic from [slug], let's assume parent passes `prefix` or we handle simple kv pairs.

                                // WAIT: [slug].js uses flat keys `item_i_Group_Label`.
                                // Cart edit will use nested keys or flat?
                                // The backend expects nested.
                                // Let's make this component DUMB. It takes a `value` and `onFieldChange`.

                                // Better approach: Pass `values` object which corresponds to THIS specific item's data (flat or nested object for just this group?).
                                // Let's go with: The component renders ONE item's form.
                                // Props:
                                // values = { "Group Name": { "Label": "Value" } } (Nested, matches backend/cart)
                                // OR
                                // values = { "Group_Label": "Value" } ? 

                                // Optimization: Let's unify to the NESTED structure for both if possible, or adapt.
                                // Current [slug] uses flat `item_0_Group_Label`. Refactoring [slug] to use nested state might be too big of a change right now.
                                // Let's support an `onChange(group, label, value)` prop.

                                const val = data?.[groupName]?.[label] || '';

                                return (
                                    <div key={fieldIdx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <label className="block text-[13px] font-bold text-gray-800 mb-2">
                                            {isRequired && <span className="text-red-500 mr-1">*</span>}
                                            {label}
                                        </label>

                                        {type === 'text' && (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder={label}
                                                    value={val}
                                                    onChange={(e) => onChange(groupName, label, e.target.value)}
                                                    className="w-full border border-gray-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                        )}

                                        {type === 'date' && (
                                            <input
                                                type="date"
                                                value={val}
                                                onChange={(e) => onChange(groupName, label, e.target.value)}
                                                className="w-full border border-gray-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-sans text-sm text-gray-900"
                                            />
                                        )}

                                        {type === 'time' && (
                                            <input
                                                type="time"
                                                value={val}
                                                onChange={(e) => onChange(groupName, label, e.target.value)}
                                                className="w-full border border-gray-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-sans text-sm text-gray-900"
                                            />
                                        )}

                                        {(type === 'image' || type === 'media') && (
                                            <div className="flex flex-col gap-3">
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    accept="image/*,video/*"
                                                    id={`file-${groupIdx}-${fieldIdx}-${index}`}
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files);
                                                        if (files.length === 0) return;
                                                        
                                                        const currentData = Array.isArray(val) ? val : (val ? [val] : []);
                                                        // Pass the raw File objects to the parent. Parent will handle upload on confirm.
                                                        onChange(groupName, label, [...currentData, ...files]);
                                                        
                                                        // Reset the input so the same file can be selected again if removed
                                                        e.target.value = '';
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`file-${groupIdx}-${fieldIdx}-${index}`}
                                                    className="justify-center flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl text-[13px] font-bold text-gray-700 transition-all group"
                                                >
                                                    <span className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    </span>
                                                    Add {type === 'media' ? 'Photos / Videos' : 'Images'}
                                                </label>
                                                
                                                {/* Multi-Media Grid Preview */}
                                                {Array.isArray(val) && val.length > 0 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                                        {val.map((file, i) => {
                                                            const isFile = file instanceof File;
                                                            const url = isFile ? URL.createObjectURL(file) : (file.url || file);
                                                            const name = isFile ? file.name : (file.name || 'File');
                                                            const isVideo = (isFile ? file.type.startsWith('video/') : (url.match(/\.(mp4|webm|ogg|mov)$|^data:video/) || name.match(/\.(mp4|webm|ogg|mov)$/i)));

                                                            return (
                                                                <div key={i} className="relative group aspect-square rounded-xl border border-gray-100 overflow-hidden bg-gray-50 shadow-sm">
                                                                    {isVideo ? (
                                                                        <video src={url} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <img src={url} className="w-full h-full object-cover" alt="preview" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updated = val.filter((_, idx) => idx !== i);
                                                                                onChange(groupName, label, updated);
                                                                            }}
                                                                            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                                                            title="Remove"
                                                                        >
                                                                            <FontAwesomeIcon icon={faTimes} />
                                                                        </button>
                                                                        <a 
                                                                            href={url} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer" 
                                                                            className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                                                                            title="Preview"
                                                                        >
                                                                            <FontAwesomeIcon icon={faSearch} />
                                                                        </a>
                                                                    </div>
                                                                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 backdrop-blur-sm">
                                                                        <p className="text-[9px] text-white font-medium truncate">{name}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                                </div>
                            </React.Fragment>
                );
            })}
        </div>
    );
}
