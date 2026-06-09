'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';
import withPermission from '../../../components/withPermission';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faEdit, faPlus, faSave, faTimes, faTrash, faImage, faCloudUploadAlt, faTag, faLayerGroup, faList, faEye, faFolderOpen } from '@fortawesome/free-solid-svg-icons';

// --- Media Library Modal ---
function BannerLibraryModal({ isOpen, onClose, onSelect, banners = [] }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[80vh] bg-[#1a1025] border border-[#2d1b4e] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d1b4e]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <FontAwesomeIcon icon={faFolderOpen} />
                        </div>
                        <h3 className="text-white font-bold uppercase tracking-wider">Banner Media Library</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scroll">
                    {banners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 italic">
                            <FontAwesomeIcon icon={faImage} className="text-4xl mb-4 opacity-20" />
                            <p>No previously uploaded banners found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {banners.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="group relative aspect-video rounded-xl overflow-hidden border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all bg-black/40"
                                    onClick={() => {
                                        onSelect(item.url, item.type);
                                        onClose();
                                    }}
                                >
                                    {item.type === 'video' ? (
                                        <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                                    ) : (
                                        <Image src={item.url} alt="Library Item" fill sizes="200px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">Select</span>
                                    </div>
                                    {item.type === 'video' && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded bg-black/60 flex items-center justify-center">
                                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#2d1b4e] bg-black/20 flex justify-end">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mr-auto mt-2">Showing {banners.length} assets</p>
                    <button onClick={onClose} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-lg transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function headers() {
    return { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' };
}

// --- Banner Upload Utility ---
async function handleBannerUpload(file) {
    const formData = new FormData();
    formData.append('banner', file);
    const res = await fetch(`${API_URL}/api/admin/master-data/upload-banner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
}

// --- Generic Editable Table Row ---
function EditableRow({ item, fields, onSave, onDelete, idField, variant }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(item);
    const [errors, setErrors] = useState({});
    const [uploading, setUploading] = useState(false);

    const onFileChange = async (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        try {
            setUploading(true);
            const { url } = await handleBannerUpload(file);
            setForm(p => {
                const updated = { ...p, [key]: url };
                // If it's a banner field, set the corresponding type field
                if (key === 'banner_image') updated.banner_type = isVideo ? 'video' : 'image';
                return updated;
            });
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        setErrors({});
        try {
            const res = await onSave(form[idField], form);
            if (res?.field) {
                setErrors({ [res.field]: res.error });
            } else {
                setEditing(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getViewDetails = () => {
        alert(JSON.stringify(item, null, 2)); // Simple alert for "View", but you can use a Modal later
    };

    if (variant === 'detailed') {
        return (
            <div className={`group relative bg-white/5 border ${editing ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-white/5'} rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.07] overflow-hidden flex flex-col md:flex-row gap-6`}>
                {/* Media Preview Section */}
                <div className="md:w-72 flex-shrink-0">
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black/40 border border-white/10 group-hover:border-white/20 transition-colors">
                        {form.banner_image ? (
                            (form.banner_type === 'video') ? (
                                <video src={form.banner_image} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                            ) : (
                                <Image src={form.banner_image} alt="Banner" fill priority sizes="300px" className="object-cover" />
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs italic">No Banner</div>
                        )}

                        {editing && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-3">
                                <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform">
                                    {uploading ? 'Uploading...' : 'Upload New'}
                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={e => onFileChange(e, 'banner_image')} />
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => fields.find(f => f.key === 'banner_image')?.onLibraryClick((url, type) => {
                                        setForm(p => ({ ...p, banner_image: url, banner_type: type }));
                                    })}
                                    className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 transition-colors shadow-lg"
                                    title="Choose from Library"
                                >
                                    <FontAwesomeIcon icon={faFolderOpen} className="text-xs" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-grow flex flex-col justify-center">
                    {editing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Category Name</label>
                                <input
                                    className={`bg-[#2d1b4e] border ${errors.category_name ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-400`}
                                    value={form.category_name || ''}
                                    onChange={e => { setForm(p => ({ ...p, category_name: e.target.value })); setErrors(p => ({ ...p, category_name: null })); }}
                                />
                                {errors.category_name && <p className="text-red-400 text-[10px] mt-0.5">{errors.category_name}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold whitespace-nowrap">Banner Title (Optional)</label>
                                <input
                                    className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-400"
                                    value={form.banner_title || ''}
                                    onChange={e => setForm(p => ({ ...p, banner_title: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Banner Subtitle (Optional)</label>
                                <input
                                    className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-400"
                                    value={form.banner_subtitle || ''}
                                    onChange={e => setForm(p => ({ ...p, banner_subtitle: e.target.value }))}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col group-hover:translate-x-1 transition-transform">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {item.category_name}
                                <span className="font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] tracking-widest">{item.slug}</span>
                            </h3>
                            {item.banner_title && <p className="text-sm text-purple-300/80 font-medium mt-1">{item.banner_title}</p>}
                            {item.banner_subtitle && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.banner_subtitle}</p>}
                            {!item.banner_title && !item.banner_subtitle && <p className="text-xs text-gray-500 italic mt-1">No banner details set</p>}
                        </div>
                    )}
                </div>

                {/* Actions Section */}
                <div className="flex-shrink-0 flex md:flex-col gap-2 justify-end items-center self-center md:self-stretch md:justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                    {editing ? (
                        <>
                            <button onClick={save} className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/20 active:scale-95 transition-all">
                                <FontAwesomeIcon icon={faSave} />
                            </button>
                            <button onClick={() => { setEditing(false); setErrors({}); setForm(item); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-gray-400 hover:bg-white/20 active:scale-95 transition-all">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </>
                    ) : (
                        <>
                           {!window.location.pathname.includes('/view') && (
                            <button onClick={getViewDetails} className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white active:scale-95 transition-all group-hover:shadow-lg group-hover:shadow-green-600/10">
                                <FontAwesomeIcon icon={faEye} />
                            </button>
                           )}
                           {onSave && (
                            <button onClick={() => setEditing(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white active:scale-95 transition-all group-hover:shadow-lg group-hover:shadow-purple-600/10">
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                           )}
                           {onDelete && (
                            <button onClick={() => onDelete(item[idField])} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white active:scale-95 transition-all">
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                           )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
            {fields.map(f => (
                <td key={f.key} className="py-3 px-4 text-sm align-top">
                    {editing
                        ? (
                            <div className="flex flex-col gap-1">
                                {f.type === 'select' ? (
                                    <select
                                        className={`bg-[#2d1b4e] border ${errors[f.key] ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-3 py-1.5 text-white text-sm w-full outline-none focus:border-purple-400`}
                                        value={form[f.key] || ''}
                                        onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: null })); }}
                                    >
                                        <option value="">Select {f.label}</option>
                                        {f.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                ) : f.type === 'file' ? (
                                    <div className="flex flex-col gap-2">
                                        {form[f.key] && (
                                            <div className="relative w-16 h-10 rounded overflow-hidden border border-white/10">
                                                {(f.key === 'banner_image' && form.banner_type === 'video') ? (
                                                    <video src={form[f.key]} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                                ) : (
                                                    <Image
                                                        src={form[f.key]}
                                                        alt={f.label}
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            id={`file-${item[idField]}-${f.key}`}
                                            onChange={e => onFileChange(e, f.key)}
                                            accept={f.key === 'banner_image' ? "image/*,video/*" : "image/*"}
                                        />
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <label
                                                htmlFor={`file-${item[idField]}-${f.key}`}
                                                className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-center cursor-pointer hover:bg-white/10"
                                            >
                                                {uploading ? 'Uploading...' : 'Upload New'}
                                            </label>
                                            {f.hasLibrary && (
                                                <button
                                                    onClick={() => f.onLibraryClick((url, type) => {
                                                        setForm(p => ({ ...p, [f.key]: url, banner_type: type }));
                                                    })}
                                                    className="px-2 py-1 bg-purple-600/10 border border-purple-500/20 rounded text-[10px] text-purple-400 text-center hover:bg-purple-600/20"
                                                >
                                                    Library
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        className={`bg-[#2d1b4e] border ${errors[f.key] ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-3 py-1.5 text-white text-sm w-full outline-none focus:border-purple-400`}
                                        required={!f.optional}
                                        value={form[f.key] || ''}
                                        onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: null })); }}
                                    />
                                )}
                                {errors[f.key] && <p className="text-red-400 text-[10px] sm:text-xs mt-0.5 leading-tight">{errors[f.key]}</p>}
                            </div>
                        )
                        : (
                            (f.key === 'asset_category_id' || f.key === 'parent_category_id') ? (
                                <span className="text-purple-300 font-medium text-xs">
                                </span>
                            ) : f.type === 'file' ? (
                                item[f.key] ? (
                                    <div className="w-16 h-10 rounded overflow-hidden border border-white/10 group relative">
                                        {(f.key === 'banner_image' && item.banner_type === 'video') ? (
                                            <video src={item[f.key]} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                        ) : (
                                            <Image
                                                src={item[f.key]}
                                                alt={f.label}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                ) : <span className="text-gray-500 italic text-[11px]">No Image</span>
                            ) : (
                                <span className={f.key === 'code' || f.key === 'slug' ? 'font-mono bg-[#2d1b4e] px-2 py-0.5 rounded text-purple-300 text-xs' : 'text-gray-200'}>
                                    {item[f.key]}
                                </span>
                            )
                        )
                    }
                </td>
            ))}
            <td className="py-3 px-4 text-right align-top">
                {editing ? (
                    <div className="flex gap-2 justify-end">
                        <button onClick={save} className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/40"><FontAwesomeIcon icon={faSave} /></button>
                        <button onClick={() => { setEditing(false); setErrors({}); }} className="p-1.5 rounded bg-white/5 text-gray-400 hover:bg-white/10"><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                ) : (
                    <div className="flex gap-2 justify-end">
                        <button onClick={getViewDetails} className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/40"><FontAwesomeIcon icon={faEye} /></button>
                        {onSave && <button onClick={() => setEditing(true)} className="p-1.5 rounded bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"><FontAwesomeIcon icon={faEdit} /></button>}
                        {onDelete && <button onClick={() => onDelete(item[idField])} className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/40"><FontAwesomeIcon icon={faTrash} /></button>}
                    </div>
                )}
            </td>
        </tr>
    );
}

// --- Add Row Form ---
function AddRowForm({ fields, onAdd, extraDefaults = {}, title = "Add New", variant }) {
    const [form, setForm] = useState(Object.fromEntries(fields.map(f => [f.key, ''])));
    const [errors, setErrors] = useState({});
    const [uploading, setUploading] = useState(false);

    const onFileChange = async (e, key) => {
        const file = e.target.files[0];
        if (!file) return;
        const isVideo = file.type.startsWith('video/');
        try {
            setUploading(true);
            const { url } = await handleBannerUpload(file);
            setForm(p => {
                const updated = { ...p, [key]: url };
                if (key === 'banner_image') updated.banner_type = isVideo ? 'video' : 'image';
                return updated;
            });
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            const res = await onAdd({ ...form, ...extraDefaults });
            if (res?.field) {
                setErrors({ [res.field]: res.error });
            } else {
                setForm(Object.fromEntries(fields.map(f => [f.key, ''])));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (variant === 'detailed') {
        return (
            <div className="mt-8 p-8 bg-purple-600/5 rounded-2xl border-2 border-dashed border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <FontAwesomeIcon icon={faPlus} />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{title}</h3>
                </div>

                <form onSubmit={submit} className="flex flex-col lg:flex-row gap-8">
                    {/* Media Upload Side */}
                    <div className="lg:w-80 flex-shrink-0">
                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center group">
                            {form.banner_image ? (
                                form.banner_type === 'video' ? (
                                    <video src={form.banner_image} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                ) : (
                                    <Image src={form.banner_image} alt="Preview" fill sizes="320px" className="object-cover" />
                                )
                            ) : (
                                <div className="text-center p-4">
                                    <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl text-gray-600 mb-2" />
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Upload Banner</p>
                                </div>
                            )}
                             {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs z-20">Uploading...</div>}
                            
                            {/* Library Toggle Overlay */}
                            <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
                                <button 
                                    type="button"
                                    onClick={() => fields.find(f => f.key === 'banner_image')?.onLibraryClick((url, type) => {
                                        setForm(p => ({ ...p, banner_image: url, banner_type: type }));
                                    })}
                                    className="w-8 h-8 rounded bg-purple-600 text-white flex items-center justify-center shadow-lg hover:bg-purple-500 transition-colors"
                                    title="Choose from Library"
                                >
                                    <FontAwesomeIcon icon={faFolderOpen} className="text-xs" />
                                </button>
                            </div>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={e => onFileChange(e, 'banner_image')}
                            />
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Category Name</label>
                            <input
                                required
                                className={`bg-[#2d1b4e] border ${errors.category_name ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-purple-400 shadow-inner`}
                                placeholder="e.g. Traditional Invitations"
                                value={form.category_name || ''}
                                onChange={e => { setForm(p => ({ ...p, category_name: e.target.value })); setErrors(p => ({ ...p, category_name: null })); }}
                            />
                            {errors.category_name && <p className="text-red-400 text-[10px] mt-0.5">{errors.category_name}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Banner Title (Optional)</label>
                            <input
                                className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-purple-400 shadow-inner"
                                placeholder="Header Text"
                                value={form.banner_title || ''}
                                onChange={e => setForm(p => ({ ...p, banner_title: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Banner Subtitle (Optional)</label>
                            <input
                                className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-purple-400 shadow-inner"
                                placeholder="Description text visible on banners"
                                value={form.banner_subtitle || ''}
                                onChange={e => setForm(p => ({ ...p, banner_subtitle: e.target.value }))}
                            />
                        </div>
                        <div className="sm:col-span-2 flex justify-end mt-2">
                            <button type="submit" className="flex items-center gap-3 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                                <FontAwesomeIcon icon={faPlus} />
                                Create New Category
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{title}</p>
            <form onSubmit={submit} className="flex gap-3 items-start flex-wrap">
                {fields.map(f => (
                    <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">{f.label}</label>
                        {f.type === 'select' ? (
                            <select
                                required
                                className={`bg-[#2d1b4e] border ${errors[f.key] ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-purple-400 w-48`}
                                value={form[f.key]}
                                onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: null })); }}
                            >
                                <option value="">Select {f.label}</option>
                                {f.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : f.type === 'file' ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="relative w-40 h-10 bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg overflow-hidden flex items-center justify-center group">
                                        {form[f.key] ? (
                                            (f.key === 'banner_image' && form.banner_type === 'video') ? (
                                                <video src={form[f.key]} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                            ) : (
                                                <Image
                                                    src={form[f.key]}
                                                    alt="Preview"
                                                    fill
                                                    sizes="160px"
                                                    className="object-cover"
                                                />
                                            )
                                        ) : (
                                            <span className="text-[10px] text-gray-500 italic">No {f.key.includes('video') ? 'video' : 'media'} selected</span>
                                        )}
                                        <input
                                            type="file"
                                            accept={f.key === 'banner_image' ? "image/*,video/*" : "image/*"}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={e => onFileChange(e, f.key)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {uploading && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>}
                                        {f.hasLibrary && (
                                            <button 
                                                type="button"
                                                onClick={() => f.onLibraryClick((url, type) => {
                                                    setForm(p => ({ ...p, [f.key]: url, banner_type: type }));
                                                })}
                                                className="w-7 h-7 rounded bg-purple-600/20 text-purple-400 flex items-center justify-center hover:bg-purple-600/40 transition-colors"
                                                title="Media Library"
                                            >
                                                <FontAwesomeIcon icon={faFolderOpen} className="text-xs" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <input
                                required={!f.optional}
                                className={`bg-[#2d1b4e] border ${errors[f.key] ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-purple-400 w-40`}
                                placeholder={f.placeholder || f.label}
                                value={form[f.key]}
                                onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: null })); }}
                            />
                        )}
                        {errors[f.key] && <p className="text-red-400 text-[10px] sm:text-xs mt-0.5 max-w-[160px] leading-tight">{errors[f.key]}</p>}
                    </div>
                ))}
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors mt-5">
                    <FontAwesomeIcon icon={faPlus} /> Add
                </button>
            </form>
        </div>
    );
}

const formatValue = (key, value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (key === 'code') return trimmed.toUpperCase();
    if (key.includes('name')) {
        return trimmed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return trimmed;
};

// --- Custom Add Sub-Category Form (with chained dropdowns) ---
function AddSubCategoryForm({ categories, assetCategories, onAdd }) {
    const [selectedParentId, setSelectedParentId] = useState('');
    const [selectedAssetCatId, setSelectedAssetCatId] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [errors, setErrors] = useState({});

    // Filter asset categories based on selected parent
    const filteredAssetCats = assetCategories.filter(ac => ac.parent_category_id === selectedParentId);

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            const res = await onAdd({
                asset_category_id: selectedAssetCatId,
                name: formatValue('name', name),
                code: formatValue('code', code)
            });
            if (res?.field) {
                setErrors({ [res.field]: res.error });
            } else {
                setName('');
                setCode('');
                // Keep the dropdowns selected for convenience, or clear level 2 if preferred
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Add New Sub-Category</p>
            <form onSubmit={submit} className="flex gap-3 items-start flex-wrap">
                {/* Step 1: Store Category */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">1. Store Category</label>
                    <select
                        required
                        className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-purple-400 w-48"
                        value={selectedParentId}
                        onChange={e => { setSelectedParentId(e.target.value); setSelectedAssetCatId(''); }}
                    >
                        <option value="">Select Store Category</option>
                        {categories.map(c => (
                            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                        ))}
                    </select>
                </div>

                {/* Step 2: Asset Category */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">2. Asset Category</label>
                    <select
                        required
                        disabled={!selectedParentId}
                        className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-purple-400 w-48 disabled:opacity-50"
                        value={selectedAssetCatId}
                        onChange={e => setSelectedAssetCatId(e.target.value)}
                    >
                        <option value="">Select Asset Category</option>
                        {filteredAssetCats.map(ac => (
                            <option key={ac.asset_category_id} value={ac.asset_category_id}>{ac.code} - {ac.name}</option>
                        ))}
                    </select>
                </div>

                {/* Step 3: Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">3. Sub-Category Name</label>
                    <input
                        required
                        className={`bg-[#2d1b4e] border ${errors.name ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-purple-400 w-40`}
                        placeholder="Anniversaries"
                        value={name}
                        onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: null })); }}
                    />
                    {errors.name && <p className="text-red-400 text-[10px] sm:text-xs mt-0.5 max-w-[160px] leading-tight">{errors.name}</p>}
                </div>

                {/* Step 4: Code */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">4. Code</label>
                    <input
                        required
                        className={`bg-[#2d1b4e] border ${errors.code ? 'border-red-500' : 'border-[#4a2d7a]'} rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-purple-400 w-24`}
                        placeholder="AN"
                        value={code}
                        onChange={e => { setCode(e.target.value); setErrors(p => ({ ...p, code: null })); }}
                    />
                    {errors.code && <p className="text-red-400 text-[10px] sm:text-xs mt-0.5 max-w-[100px] leading-tight">{errors.code}</p>}
                </div>

                <button type="submit" disabled={!selectedAssetCatId} className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors mt-5 disabled:opacity-50">
                    <FontAwesomeIcon icon={faPlus} /> Add
                </button>
            </form>
        </div>
    );
}

// --- Shop Settings Section ---
function ShopSettingsSection({ settings, onUpdate, onLibraryClick }) {
    const [form, setForm] = useState(settings || {});
    const [uploading, setUploading] = useState(false);

    useEffect(() => { if (settings) setForm(settings); }, [settings]);

    const onFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation: Only images and videos
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            alert('Please upload an image or video file.');
            return;
        }

        try {
            setUploading(true);
            const { url } = await handleBannerUpload(file);
            setForm(p => ({
                ...p,
                shop_banner_image: url,
                shop_banner_type: isVideo ? 'video' : 'image'
            }));
        } catch (err) { alert('Upload failed'); }
        finally { setUploading(false); }
    };

    const save = async () => {
        try {
            await onUpdate(form);
            alert('Settings updated!');
        } catch (err) { alert('Save failed'); }
    };

    return (
        <SectionCard title="Main Shop Page Banner" icon={faImage}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Banner Title (Optional)</label>
                        <input
                            className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-400"
                            placeholder="e.g. Celebrate Every Moment"
                            value={form.shop_banner_title || ''}
                            onChange={e => setForm(p => ({ ...p, shop_banner_title: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Banner Subtitle (Optional)</label>
                        <textarea
                            className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-400 h-24 resize-none"
                            placeholder="e.g. Discover premium templates..."
                            value={form.shop_banner_subtitle || ''}
                            onChange={e => setForm(p => ({ ...p, shop_banner_subtitle: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <label className="text-xs text-gray-400">Banner Background Media (Image or Video)</label>
                    <div className="relative group aspect-video rounded-xl overflow-hidden border-2 border-dashed border-[#2d1b4e] bg-white/5 flex items-center justify-center">
                        {form.shop_banner_image ? (
                            form.shop_banner_type === 'video' ? (
                                <video
                                    src={form.shop_banner_image}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <Image
                                    src={form.shop_banner_image}
                                    alt="Shop Banner Preview"
                                    fill
                                    priority
                                    sizes="100vw"
                                    className="object-cover"
                                />
                            )
                        ) : (
                            <div className="text-center p-4">
                                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-gray-500 text-3xl mb-2" />
                                <p className="text-xs text-gray-500">Click to upload banner image or video</p>
                            </div>
                        )}
                        <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onFileChange} />
                        {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">Uploading...</div>}
                        
                        {/* Library Button Overlay */}
                        <div className="absolute bottom-4 right-4 z-10">
                            <button 
                                type="button"
                                onClick={() => onLibraryClick((url, type) => {
                                    setForm(p => ({ ...p, shop_banner_image: url, shop_banner_type: type }));
                                })}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl hover:bg-purple-500 transition-all"
                            >
                                <FontAwesomeIcon icon={faFolderOpen} />
                                Library
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button
                    onClick={save}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-all shadow-lg active:scale-95"
                >
                    <FontAwesomeIcon icon={faSave} /> Save Shop Banner Settings
                </button>
            </div>
        </SectionCard>
    );
}

// --- Section Card ---
function SectionCard({ title, icon, children }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl overflow-hidden mb-6">
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={icon} className="text-purple-400" />
                    <h2 className="text-white font-semibold text-base">{title}</h2>
                </div>
                <FontAwesomeIcon icon={open ? faChevronDown : faChevronRight} className="text-gray-500 text-sm" />
            </button>
            {open && <div className="px-6 pb-6">{children}</div>}
        </div>
    );
}

// --- Main Page ---
function MasterDataPage() {
    const user = getAuthUser() || {};
    const canEdit = user.is_super_admin || (user.permissions?.master_data && user.permissions.master_data.includes('edit'));
    const canDelete = user.is_super_admin || (user.permissions?.master_data && user.permissions.master_data.includes('delete'));
    
    const [data, setData] = useState({ types: [], variants: [], orientations: [], categories: [], subCategories: [], parentCategories: [], shopSettings: null, customizationTemplates: [] });
    const [loading, setLoading] = useState(true);
    const [activeSubCatFilter, setActiveSubCatFilter] = useState(null);
    const [subCatSearch, setSubCatSearch] = useState('');

    // Media Library State
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [libraryCallback, setLibraryCallback] = useState(null);

    const existingBanners = useMemo(() => {
        const map = new Map(); // URL -> type
        // From parentCategories
        data.parentCategories?.forEach(pc => {
            if (pc.banner_image) map.set(pc.banner_image, pc.banner_type || 'image');
        });
        // From shopSettings
        if (data.shopSettings?.shop_banner_image) {
            map.set(data.shopSettings.shop_banner_image, data.shopSettings.shop_banner_type || 'image');
        }
        return Array.from(map.entries()).map(([url, type]) => ({ url, type }));
    }, [data.parentCategories, data.shopSettings]);

    const openLibrary = (callback) => {
        setLibraryCallback(() => callback);
        setLibraryOpen(true);
    };

    const fetchAll = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/master-data`, { headers: headers() });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const json = await res.json();

            // Ensure all expected keys are valid arrays or null
            const safeData = {
                types: Array.isArray(json.types) ? json.types : [],
                variants: Array.isArray(json.variants) ? json.variants : [],
                orientations: Array.isArray(json.orientations) ? json.orientations : [],
                categories: Array.isArray(json.categories) ? json.categories : [],
                subCategories: Array.isArray(json.subCategories) ? json.subCategories : [],
                parentCategories: Array.isArray(json.parentCategories) ? json.parentCategories : [],
                shopSettings: json.shopSettings || null,
                customizationTemplates: Array.isArray(json.customizationTemplates) ? json.customizationTemplates : []
            };
            setData(safeData);
        } catch (err) {
            console.error('Fetch error:', err);
            // Don't clear existing data on non-fatal errors
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const CRUD = (endpoint, idField) => ({
        add: async (body) => {
            const formattedBody = Object.fromEntries(
                Object.entries(body).map(([k, v]) => [k, formatValue(k, v)])
            );
            const res = await fetch(`${API_URL}/api/admin/${endpoint}`, { method: 'POST', headers: headers(), body: JSON.stringify(formattedBody) });
            const result = await res.json();
            if (!res.ok) {
                if (result.field) return result;
                throw new Error(result.error || 'Failed to add item');
            }
            fetchAll();
            return null;
        },
        save: async (id, body) => {
            const formattedBody = Object.fromEntries(
                Object.entries(body).map(([k, v]) => [k, formatValue(k, v)])
            );
            const res = await fetch(`${API_URL}/api/admin/${endpoint}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(formattedBody) });
            const result = await res.json();
            if (!res.ok) {
                if (result.field) return result;
                throw new Error(result.error || 'Failed to save item');
            }
            fetchAll();
            return null;
        },
        delete: async (id) => {
            if (!confirm('Delete this item? This may affect linked products.')) return;
            const res = await fetch(`${API_URL}/api/admin/${endpoint}/${id}`, { method: 'DELETE', headers: headers() });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to delete item');
            }
            fetchAll();
        },
    });

    const handleUpdateShopSettings = async (body) => {
        const res = await fetch(`${API_URL}/api/admin/master-data/shop-settings`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Update failed');
        fetchAll();
    };

    const handleUpdateTemplate = async (id, body) => {
        const res = await fetch(`${API_URL}/api/admin/master-data/customization-templates/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Update failed');
        fetchAll();
    };

    const handleDeleteTemplate = async (id) => {
        if (!confirm('Delete this template? Products using it will not be affected, but you cannot load this preset anymore.')) return;
        const res = await fetch(`${API_URL}/api/admin/master-data/customization-templates/${id}`, { method: 'DELETE', headers: headers() });
        if (!res.ok) throw new Error('Delete failed');
        fetchAll();
    };

    const Table = ({ items, fields, idField, crud, variant }) => {
        if (variant === 'detailed') {
            return (
                <div className="flex flex-col gap-4 mt-6">
                    {items.length === 0 && <div className="py-20 text-center text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">No categories added yet.</div>}
                    {items.map(item => (
                        <EditableRow
                            key={item[idField]}
                            item={item}
                            fields={fields}
                            onSave={crud.save}
                            onDelete={crud.delete}
                            idField={idField}
                            variant={variant}
                        />
                    ))}
                </div>
            );
        }

        return (
            <div className="overflow-x-auto rounded-xl border border-white/5 mt-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            {fields.map(f => <th key={f.key} className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{f.label}</th>)}
                            <th className="py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && <tr><td colSpan={fields.length + 1} className="py-6 text-center text-gray-500 text-sm">No items yet.</td></tr>}
                        {items.map(item => <EditableRow key={item[idField]} item={item} fields={fields} onSave={canEdit ? crud.save : null} onDelete={canDelete ? crud.delete : null} idField={idField} />)}
                    </tbody>
                </table>
            </div>
        );
    };

    const typeCRUD = CRUD('master-data/types', 'type_id');
    const variantCRUD = CRUD('master-data/variants', 'variant_id');
    const orientationCRUD = CRUD('master-data/orientations', 'orientation_id');
    const catCRUD = CRUD('master-data/asset-categories', 'asset_category_id');
    const subCatCRUD = CRUD('master-data/sub-categories', 'asset_sub_category_id');
    const primaryCatCRUD = CRUD('master-data/primary-categories', 'category_id');

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>;

    // Category options for dropdowns
    const assetCategoryOptions = (data?.categories || []).map(c => ({ value: c.asset_category_id, label: `${c.code} - ${c.name}` }));

    const filteredSubCats = (data?.subCategories || []).filter(s => {
        const matchesFilter = !activeSubCatFilter || s.asset_category_id === activeSubCatFilter;
        const matchesSearch = !subCatSearch ||
            s.name.toLowerCase().includes(subCatSearch.toLowerCase()) ||
            s.code.toLowerCase().includes(subCatSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="pb-20">
            <div className="w-full px-4 sm:px-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Master Data Management</h1>
                    <p className="text-gray-400 mt-1">Manage naming convention codes for templates. Structure: <span className="font-mono text-purple-300 text-xs">JAP-[Type]-[Variant]-[Cat]-[SubCat]-[Ori]-[Serial]</span></p>
                </div>

                <ShopSettingsSection
                    settings={data.shopSettings}
                    onLibraryClick={openLibrary}
                    onUpdate={handleUpdateShopSettings}
                />

                {/* Primary Store Categories */}
                <SectionCard title="Root Store Categories" icon={faLayerGroup}>
                    <Table
                        items={data.parentCategories}
                        fields={[
                            { key: 'category_name', label: 'Category Name' },
                            { key: 'slug', label: 'Slug (Auto-generated)' },
                            { key: 'banner_title', label: 'Banner Title', optional: true },
                            { key: 'banner_subtitle', label: 'Banner Subtitle', optional: true },
                            { key: 'banner_image', label: 'Banner', type: 'file', optional: true, hasLibrary: true, onLibraryClick: openLibrary },
                        ]}
                        idField="category_id"
                        crud={primaryCatCRUD}
                        variant="detailed"
                    />
                    {canEdit && (
                        <AddRowForm
                            fields={[
                                { key: 'category_name', label: 'Category Name', placeholder: 'Digital Invitations' },
                                { key: 'banner_title', label: 'Banner Title', placeholder: 'Optional', optional: true },
                                { key: 'banner_subtitle', label: 'Banner Subtitle', placeholder: 'Optional', optional: true },
                                { key: 'banner_image', label: 'Banner', type: 'file', optional: true, hasLibrary: true, onLibraryClick: openLibrary },
                            ]}
                            onAdd={primaryCatCRUD.add}
                            title="Add New Root Category"
                            variant="detailed"
                        />
                    )}
                </SectionCard>

                <BannerLibraryModal 
                    isOpen={libraryOpen} 
                    onClose={() => setLibraryOpen(false)} 
                    onSelect={libraryCallback}
                    banners={existingBanners}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Asset Types" icon={faTag}>
                        <Table items={data.types} fields={[{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }]} idField="type_id" crud={typeCRUD} />
                        {canEdit && <AddRowForm fields={[{ key: 'name', label: 'Name', placeholder: 'Poster' }, { key: 'code', label: 'Code', placeholder: 'PO' }]} onAdd={typeCRUD.add} title="Add New Asset Type" />}
                    </SectionCard>

                    <SectionCard title="Asset Variants" icon={faLayerGroup}>
                        <Table items={data.variants} fields={[{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }]} idField="variant_id" crud={variantCRUD} />
                        {canEdit && <AddRowForm fields={[{ key: 'name', label: 'Name', placeholder: 'With Image' }, { key: 'code', label: 'Code', placeholder: 'WI' }]} onAdd={variantCRUD.add} title="Add New Asset Variant" />}
                    </SectionCard>
                </div>

                <SectionCard title="Orientations" icon={faTag}>
                    <Table items={data.orientations} fields={[{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }]} idField="orientation_id" crud={orientationCRUD} />
                    {canEdit && <AddRowForm fields={[{ key: 'name', label: 'Name', placeholder: 'Horizontal' }, { key: 'code', label: 'Code', placeholder: 'HOR' }]} onAdd={orientationCRUD.add} title="Add New Orientation" />}
                </SectionCard>

                <SectionCard title="Asset Categories" icon={faList}>
                    <Table
                        items={data.categories}
                        fields={[
                            { key: 'parent_category_id', label: 'Parent Category', type: 'select', options: data.parentCategories.map(pc => ({ value: pc.category_id, label: pc.category_name })) },
                            { key: 'name', label: 'Name' },
                            { key: 'code', label: 'Code' },
                            { key: 'slug', label: 'Slug' },
                        ]}
                        idField="asset_category_id"
                        crud={catCRUD}
                    />
                    {canEdit && (
                        <AddRowForm
                            fields={[
                                { key: 'parent_category_id', label: 'Parent Category', type: 'select', options: data.parentCategories.map(pc => ({ value: pc.category_id, label: pc.category_name })) },
                                { key: 'name', label: 'Name', placeholder: 'Personal Events' },
                                { key: 'code', label: 'Code', placeholder: 'PE' },
                            ]}
                            onAdd={catCRUD.add}
                            title="Add New Asset Category"
                        />
                    )}
                </SectionCard>

                {/* Sub-Categories */}
                <SectionCard title="Asset Sub-Categories" icon={faList}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setActiveSubCatFilter(null)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!activeSubCatFilter ? 'bg-purple-700 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>All Categories</button>
                            {data.categories.map(cat => (
                                <button key={cat.asset_category_id} onClick={() => setActiveSubCatFilter(cat.asset_category_id)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeSubCatFilter === cat.asset_category_id ? 'bg-purple-700 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                                    {cat.code}
                                </button>
                            ))}
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search sub-categories..."
                                className="bg-[#2d1b4e] border border-[#4a2d7a] rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-purple-400 w-full md:w-64"
                                value={subCatSearch}
                                onChange={e => setSubCatSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <Table
                        items={filteredSubCats}
                        fields={[
                            { key: 'asset_category_id', label: 'Parent Category', type: 'select', options: assetCategoryOptions },
                            { key: 'name', label: 'Name' },
                            { key: 'code', label: 'Code' },
                            { key: 'slug', label: 'Slug' },
                        ]}
                        idField="asset_sub_category_id"
                        crud={subCatCRUD}
                    />

                    {canEdit && (
                        <AddSubCategoryForm
                            categories={data.parentCategories}
                            assetCategories={data.categories}
                            onAdd={subCatCRUD.add}
                        />
                    )}
                </SectionCard>

                {/* Customization Templates */}
                <SectionCard title="Customization Templates" icon={faTag}>
                    <p className="text-xs text-gray-500 mb-4 px-2 italic">Management of customization form presets. You can save new templates directly from the Product Creation/Edit forms.</p>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                <th className="py-3 px-4">Template Name</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4">Fields Count</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.customizationTemplates.map(t => (
                                <tr key={t.template_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 text-sm font-bold text-white">{t.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-400">{t.description || 'No description'}</td>
                                    <td className="py-3 px-4 text-sm text-purple-400 font-mono">{t.fields?.length || 0} groups</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            {canDelete && (
                                                <button onClick={() => handleDeleteTemplate(t.template_id)} className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/40">
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {data.customizationTemplates.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-10 text-center text-gray-500 italic text-sm">No templates saved yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </SectionCard>
            </div>
        </div>
    );
}

export default withPermission(MasterDataPage, "master_data");
