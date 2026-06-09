"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faArrowLeft, faPlay, faSpinner, faTimes,
    faTags, faTag, faVideo, faImage, faDownload, faFileArchive,
    faEye, faInfoCircle, faCoins, faCompass, faRulerCombined, faUserCheck, faListAlt
} from '@fortawesome/free-solid-svg-icons';
import { getAuthToken, getAuthUser, hasPermission } from '../../../../../utils/auth';
import Image from 'next/image';
import Link from 'next/link';
import withPermission from '../../../../../components/withPermission';

function ViewProduct() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const authUser = getAuthUser();
    const canEdit = authUser?.is_super_admin || hasPermission(authUser, 'products', 'edit');

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [masterData, setMasterData] = useState({ types: [], variants: [], orientations: [], categories: [], subCategories: [], parentCategories: [] });
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [activeTab, setActiveTab] = useState('details'); // details | specifications | customization

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

                // Fetch master data
                const mdRes = await fetch(`${apiUrl}/api/products/master-data`);
                if (mdRes.ok) {
                    const md = await mdRes.json();
                    if (md && !md.error) setMasterData(md);
                }

                // Fetch Product Data
                if (id) {
                    const token = getAuthToken();
                    if (!token) {
                        router.push('/login');
                        return;
                    }
                    const prodRes = await axios.get(`${apiUrl}/api/admin/products/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProduct(prodRes.data);
                }
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch data', err);
                alert('Error loading product data');
                router.push('/products');
            }
        };

        fetchData();
    }, [id, router]);

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="text-center">
                <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-4xl mb-4" />
                <p className="text-gray-500 text-sm font-semibold tracking-wide">LOADING TEMPLATE DETAILS...</p>
            </div>
        </div>
    );

    if (!product) return (
        <div className="text-center py-20 text-red-400">Product not found.</div>
    );

    // Helpers to find labels from master data
    const findLabel = (arr, id, idKey, labelKey) => arr.find(x => x[idKey] === id)?.[labelKey] || '—';

    const parentCat = findLabel(masterData.parentCategories, product.parent_category_id, 'category_id', 'category_name');
    const assetType = findLabel(masterData.types, product.asset_type_id, 'type_id', 'name');
    const assetVariant = findLabel(masterData.variants, product.asset_variant_id, 'variant_id', 'name');
    const assetCat = findLabel(masterData.categories, product.asset_category_id, 'asset_category_id', 'name');
    const assetSubCat = findLabel(masterData.subCategories, product.asset_sub_category_id, 'asset_sub_category_id', 'name');
    const assetOrientation = findLabel(masterData.orientations, product.asset_orientation_id, 'orientation_id', 'name');

    // Parse dynamic items
    const safeParse = (data) => {
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return []; }
        }
        return [];
    };

    const images = safeParse(product.images);
    const videos = safeParse(product.video);
    const customizations = safeParse(product.customization);
    const colors = safeParse(product.colors);
    const toPerson = safeParse(product.to_person);
    const subCategories = safeParse(product.sub_category_json || product.sub_category);

    // Parse specifications/summary
    let summaryObj = {};
    if (typeof product.summary === 'string' && product.summary.trim()) {
        try { summaryObj = JSON.parse(product.summary); } catch (e) { summaryObj = { "General": [product.summary] }; }
    } else if (product.summary && typeof product.summary === 'object') {
        summaryObj = product.summary;
    }
    const specs = Object.entries(summaryObj);

    // Parse metadata tags
    let tagsList = [];
    if (product.tags) {
        if (Array.isArray(product.tags)) {
            tagsList = product.tags.map(t => typeof t === 'object' ? t : { key: 'Tag', value: String(t) });
        } else if (typeof product.tags === 'object') {
            tagsList = Object.entries(product.tags).map(([key, value]) => ({ key, value }));
        } else if (typeof product.tags === 'string') {
            try {
                const parsed = JSON.parse(product.tags);
                tagsList = typeof parsed === 'object' ? Object.entries(parsed).map(([key, value]) => ({ key, value })) : [{ key: 'Tag', value: String(product.tags) }];
            } catch {
                tagsList = [{ key: 'Tag', value: String(product.tags) }];
            }
        }
    }

    const discountPercentage = product.compared_price && product.compared_price > product.price
        ? Math.round(((product.compared_price - product.price) / product.compared_price) * 100)
        : 0;

    return (
        <div className="w-full space-y-8 pb-20">
            {/* Header / Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/products" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1a1025] border border-[#2d1b4e] text-gray-400 hover:bg-[#2d1b4e] hover:text-[#a78bfa] transition-all shadow-lg">
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{product.title}</h1>
                            {product.internal_sku && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 shadow-sm">
                                    {product.internal_sku}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Viewing template showcase dashboard</p>
                    </div>
                </div>
                {canEdit && (
                    <Link
                        href={`/products/edit/${product.products_id}`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-900/20"
                    >
                        <FontAwesomeIcon icon={faEdit} /> Edit Template
                    </Link>
                )}
            </div>

            {/* Timestamps & Info Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1a1025] p-5 rounded-2xl border border-[#2d1b4e] shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Created Date</p>
                        <p className="text-sm font-mono text-gray-300 mt-0.5">{product.createdAt ? new Date(product.createdAt).toLocaleString('en-IN') : '—'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 sm:border-l sm:border-[#2d1b4e] sm:pl-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Last Updated</p>
                        <p className="text-sm font-mono text-gray-300 mt-0.5">{product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-IN') : '—'}</p>
                    </div>
                </div>
            </div>

            {/* Split Showcase Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT COLUMN: Media Viewer */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Primary Showcase (Video or Thumbnail) */}
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-3xl overflow-hidden shadow-xl">
                        <div className="relative w-full aspect-[4/5] bg-black flex items-center justify-center">
                            {videos.length > 0 ? (
                                <div className="absolute inset-0 w-full h-full">
                                    <video
                                        src={videos[0]}
                                        controls
                                        poster={product.thumbnail}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : product.thumbnail ? (
                                <Image
                                    src={product.thumbnail}
                                    alt={product.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 450px"
                                    priority
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <FontAwesomeIcon icon={faImage} className="text-gray-700 text-5xl mb-3" />
                                    <p className="text-gray-500 text-sm">No Preview Media Uploaded</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-[#1a1025] border-t border-[#2d1b4e] flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Main Visual Preview</span>
                            {videos.length > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-[#a78bfa] font-bold uppercase tracking-wide border border-purple-500/20">
                                    <FontAwesomeIcon icon={faVideo} /> Video Invite
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Image Gallery Grid */}
                    {images.length > 0 && (
                        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-5 space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gallery Slideshow / Images</h3>
                            <div className="grid grid-cols-4 gap-2.5">
                                {images.map((img, idx) => (
                                    <a
                                        href={img}
                                        target="_blank"
                                        rel="noreferrer"
                                        key={idx}
                                        className="relative aspect-square bg-black rounded-xl border border-[#2d1b4e] overflow-hidden hover:opacity-85 transition-all shadow-sm block group"
                                    >
                                        <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" sizes="100px" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <FontAwesomeIcon icon={faEye} className="text-white text-xs" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resource Package Card */}
                    {product.resource_file && (
                        <div className="bg-gradient-to-br from-[#1a1025] to-[#251733] border border-green-500/20 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-lg">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                    <FontAwesomeIcon icon={faFileArchive} className="text-lg" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white">Source Files Package</h4>
                                    <p className="text-[10px] text-gray-400 truncate mt-0.5 max-w-[200px]" title={product.resource_file.split('/').pop()}>
                                        {product.resource_file.split('/').pop()}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={product.resource_file}
                                download
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shrink-0"
                            >
                                <FontAwesomeIcon icon={faDownload} /> Download ZIP
                            </a>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Showcase Details */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Pricing Display */}
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                        <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Base Template Price</span>
                            <div className="flex items-baseline gap-3 mt-1.5">
                                <span className="text-3xl font-black text-white">₹{product.price?.toLocaleString()}</span>
                                {product.compared_price && product.compared_price > product.price && (
                                    <>
                                        <span className="text-base text-gray-500 line-through">₹{product.compared_price?.toLocaleString()}</span>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm animate-pulse">
                                            {discountPercentage}% OFF
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Metadata Badges & Properties Grid */}
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-3xl p-6 shadow-xl space-y-5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-[#2d1b4e]/50 flex items-center gap-2">
                            Product Classification
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Parent Department', val: parentCat },
                                { label: 'Asset Type', val: assetType },
                                { label: 'Asset Variant', val: assetVariant },
                                { label: 'Asset Category', val: assetCat },
                                { label: 'Sub-Category', val: assetSubCat },
                                { label: 'Orientation', val: assetOrientation },
                                { label: 'Serial Number', val: product.serial_number ? String(product.serial_number).padStart(4, '0') : '—' }
                            ].map((prop, i) => (
                                <div key={i} className="bg-[#130C1C]/50 rounded-xl p-3.5 border border-[#2d1b4e]">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{prop.label}</p>
                                    <p className="text-sm font-semibold text-gray-200 mt-1">{prop.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabs switcher for Description, Specs, Customization */}
                    <div className="border-b border-[#2d1b4e] flex gap-6">
                        {[
                            { id: 'details', label: 'Details & Description' },
                            { id: 'specifications', label: `Specifications (${specs.length})` },
                            { id: 'customization', label: `Customization Fields (${customizations.length})` }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all outline-none border-b-2 ${activeTab === tab.id
                                    ? 'border-[#a78bfa] text-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-300'
                                    }`}
                            >

                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Panel content */}
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-fadeIn">

                            {/* Product Description */}
                            <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-3xl p-6 shadow-xl space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-[#2d1b4e]/50">Description</h3>
                                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {product.description || <p className="italic text-gray-500">No template description provided.</p>}
                                </div>
                            </div>

                            {/* Tags & Audience details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Tags */}
                                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-5 space-y-3 shadow-md">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faTags} className="text-[#a78bfa] text-xs" /> Filter Tags
                                    </h4>
                                    {tagsList.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">No tags associated.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {tagsList.map((tag, idx) => (
                                                <span key={idx} className="bg-[#130C1C] border border-[#2d1b4e] text-gray-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                                                    <span className="text-[#a78bfa] font-bold">{tag.key}:</span> {tag.value}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Target Audience (To Person) & Colors */}
                                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-5 space-y-4 shadow-md">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faUserCheck} className="text-emerald-400 text-xs" /> Target Audience
                                        </h4>
                                        {toPerson.length === 0 ? (
                                            <p className="text-xs text-gray-500 italic">No audience set.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {toPerson.map((person, idx) => (
                                                    <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                        {person}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {colors.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-[#2d1b4e]/50">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Colors</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {colors.map((c, idx) => (
                                                    <span key={idx} className="bg-[#130C1C] border border-[#2d1b4e] text-gray-400 px-2 py-0.5 rounded text-xs font-mono">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'specifications' && (
                        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-3xl p-6 shadow-xl space-y-4 animate-fadeIn">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-3 border-b border-[#2d1b4e]/50">Product Specifications</h3>
                            {specs.length === 0 ? (
                                <p className="text-sm text-gray-500 italic py-4">No specifications/summary details defined for this template.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {specs.map(([groupKey, groupVals]) => (
                                        <div key={groupKey} className="bg-[#130C1C]/50 border border-[#2d1b4e] rounded-2xl p-4 border-l-4 border-l-purple-500">
                                            <h4 className="text-sm font-bold text-white">{groupKey}</h4>
                                            <ul className="list-disc list-inside text-xs text-gray-400 mt-2 space-y-1">
                                                {Array.isArray(groupVals) ? groupVals.map((v, i) => (
                                                    <li key={i} className="leading-relaxed">{v}</li>
                                                )) : <li className="leading-relaxed">{String(groupVals)}</li>}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'customization' && (
                        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-1">Customization Forms Model</h3>
                                <p className="text-xs text-gray-500">Form categories and inputs the user fills out when ordering this template</p>
                            </div>
                            {customizations.length === 0 ? (
                                <p className="text-sm text-gray-500 italic py-4 border-t border-[#2d1b4e]/50">No customization form template built for this product.</p>
                            ) : (
                                <div className="space-y-4 border-t border-[#2d1b4e]/50 pt-4">
                                    {customizations.map((cust, idx) => {
                                        const groupName = Object.keys(cust)[0];
                                        const fields = cust[groupName];
                                        return (
                                            <div key={idx} className="bg-[#130C1C]/50 border border-[#2d1b4e] rounded-2xl p-5 border-l-4 border-l-pink-500">
                                                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">{groupName}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {Array.isArray(fields) && fields.map((field, i) => {
                                                        const [name, type] = Array.isArray(field) ? field : [field, 'text'];
                                                        return (
                                                            <div key={i} className="bg-[#1a1025] border border-[#2d1b4e]/60 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                                                                <span className="text-xs font-semibold text-gray-300">{name}</span>
                                                                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#a78bfa]/10 text-[#a78bfa]">
                                                                    {type}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

export default withPermission(ViewProduct, 'products');
