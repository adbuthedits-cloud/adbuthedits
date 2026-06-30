"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch, faStar, faCircleNotch, faFilter, faTimes, faChevronDown, faFileExport, faEye, faFileImport, faDownload, faUpload, faCheckCircle, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition, CardSkeleton, SlideIn } from '../../../components/Animations';
import { useSortableData } from '../../../hooks/useSortableData';
import Button from '../../../components/Button';
import withPermission from '../../../components/withPermission';

function Products() {
    const user = getAuthUser();
    const canView = hasPermission(user, 'products', 'view');
    const canEdit = hasPermission(user, 'products', 'edit');
    const canDelete = hasPermission(user, 'products', 'delete');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [parentCategories, setParentCategories] = useState([]);
    const [assetCategories, setAssetCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [variants, setVariants] = useState([]);
    const [orientations, setOrientations] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Filter States
    const [selectedParentCategory, setSelectedParentCategory] = useState('');
    const [selectedAssetCategory, setSelectedAssetCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedVariant, setSelectedVariant] = useState('');
    const [selectedOrientation, setSelectedOrientation] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minRating, setMinRating] = useState('');
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [showImportMenu, setShowImportMenu] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null); // null | { total, current, results[], isPreview: boolean }
    const [selectedFile, setSelectedFile] = useState(null);
    const importFileRef = useRef(null);

    // Multi-delete state


    useEffect(() => {
        fetchProducts();
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const res = await axios.get(`${apiUrl}/api/products/master-data`);
            setParentCategories(res.data.parentCategories || []);
            setAssetCategories(res.data.categories || []);
            setSubCategories(res.data.subCategories || []);
            setTypes(res.data.types || []);
            setVariants(res.data.variants || []);
            setOrientations(res.data.orientations || []);
        } catch (error) {
            console.error('Failed to fetch master data', error);
        }
    };

    const fetchProducts = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = getAuthToken();
        try {
            // Use admin route so drafts are included in the listing
            const res = await axios.get(`${apiUrl}/api/admin/products?limit=500`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Admin route returns { products: [...], total, page }
            setProducts(res.data.products || res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch products', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            await axios.delete(`${apiUrl}/api/admin/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchProducts(); // Refresh list
        } catch (error) {
            alert('Failed to delete product');
            console.error(error);
        } finally {
            setDeletingId(null);
        }
    };

    const activeFiltersCount = [
        selectedParentCategory,
        selectedAssetCategory,
        selectedSubCategory,
        selectedType,
        selectedVariant,
        selectedOrientation,
        minPrice,
        maxPrice,
        startDate,
        endDate,
        minRating
    ].filter(Boolean).length;

    const filteredProducts = products.filter(p => {
        const s = search.toLowerCase();
        const matchSearch =
            (p.title || '').toLowerCase().includes(s) ||
            (p.internal_sku || '').toLowerCase().includes(s) ||
            (p.slug || '').toLowerCase().includes(s) ||
            (p.description || '').toLowerCase().includes(s) ||
            (p.price || '').toString().includes(s) ||
            (p.parentCategory?.category_name || '').toLowerCase().includes(s) ||
            (p.assetType?.name || '').toLowerCase().includes(s) ||
            (p.assetType?.code || '').toLowerCase().includes(s) ||
            (p.assetVariant?.name || '').toLowerCase().includes(s) ||
            (p.assetVariant?.code || '').toLowerCase().includes(s) ||
            (p.assetCategory?.name || '').toLowerCase().includes(s) ||
            (p.assetCategory?.code || '').toLowerCase().includes(s) ||
            (p.assetSubCategory?.name || '').toLowerCase().includes(s) ||
            (p.assetSubCategory?.code || '').toLowerCase().includes(s) ||
            (p.assetOrientation?.name || '').toLowerCase().includes(s) ||
            (p.assetOrientation?.code || '').toLowerCase().includes(s) ||
            JSON.stringify(p.tags || {}).toLowerCase().includes(s);

        const matchParentCategory = selectedParentCategory ? String(p.parent_category_id) === String(selectedParentCategory) : true;
        const matchAssetCategory = selectedAssetCategory ? String(p.asset_category_id) === String(selectedAssetCategory) : true;
        const matchSubCategory = selectedSubCategory ? String(p.asset_sub_category_id) === String(selectedSubCategory) : true;
        const matchType = selectedType ? String(p.asset_type_id) === String(selectedType) : true;
        const matchVariant = selectedVariant ? String(p.asset_variant_id) === String(selectedVariant) : true;
        const matchOrientation = selectedOrientation ? String(p.asset_orientation_id) === String(selectedOrientation) : true;

        const price = parseFloat(p.price) || 0;
        const matchMinPrice = minPrice ? price >= parseFloat(minPrice) : true;
        const matchMaxPrice = maxPrice ? price <= parseFloat(maxPrice) : true;

        const pDate = p.createdAt ? new Date(p.createdAt) : new Date();
        const matchStartDate = startDate ? pDate >= new Date(startDate) : true;
        const endD = endDate ? new Date(endDate) : null;
        if (endD) endD.setHours(23, 59, 59, 999);
        const matchEndDate = endDate ? pDate <= endD : true;

        const rating = parseFloat(p.averageRating || p.rating || 0);
        const matchRating = minRating ? rating >= parseFloat(minRating) : true;

        return matchSearch &&
               matchParentCategory &&
               matchAssetCategory &&
               matchSubCategory &&
               matchType &&
               matchVariant &&
               matchOrientation &&
               matchMinPrice &&
               matchMaxPrice &&
               matchStartDate &&
               matchEndDate &&
               matchRating;
    });

    const { items: sortedProducts, requestSort, sortConfig, setSortConfig } = useSortableData(filteredProducts);

    // Pagination State
    const [visibleCount, setVisibleCount] = useState(20);
    const visibleProducts = sortedProducts.slice(0, visibleCount);

    const loadMore = async () => {
        setLoadingMore(true);
        // Simulate a small delay for better UX feel
        await new Promise(resolve => setTimeout(resolve, 600));
        setVisibleCount(prev => prev + 20);
        setLoadingMore(false);
    };

    const handleExport = async (format) => {
        setExporting(true);
        setShowExportMenu(false);
        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const response = await axios({
                url: `${apiUrl}/api/admin/products/export?format=${format}`,
                method: 'GET',
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : (format === 'csv' ? 'csv' : 'xlsx')}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed', error);
            alert('Failed to export list');
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadSample = async () => {
        setShowImportMenu(false);
        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const response = await axios({
                url: `${apiUrl}/api/admin/products/import-template`,
                method: 'GET',
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'adbuth-product-import-template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Sample download failed', error);
            alert('Failed to download sample format');
        }
    };

    const handleImportFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        e.target.value = '';
        setShowImportMenu(false);
        setImporting(true);
        setImportProgress({ total: 0, current: 0, results: [], processing: true, isPreview: true });

        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('previewOnly', 'true');
            const res = await axios.post(`${apiUrl}/api/admin/products/import`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setImportProgress({ ...res.data, processing: false, isPreview: true });
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setImportProgress({ total: 0, success: 0, failed: 1, results: [{ row: '-', title: file.name, status: 'error', reason: msg }], processing: false, isPreview: true });
        } finally {
            setImporting(false);
        }
    };

    const confirmImport = async () => {
        if (!selectedFile) return;
        setImportProgress({ ...importProgress, processing: true, isPreview: false });

        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('previewOnly', 'false');
            const res = await axios.post(`${apiUrl}/api/admin/products/import`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setImportProgress({ ...res.data, processing: false, isPreview: false });
            setSelectedFile(null);
            if (res.data.success > 0) fetchProducts();
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setImportProgress({ total: 0, success: 0, failed: 1, results: [{ row: '-', title: selectedFile.name, status: 'error', reason: msg }], processing: false, isPreview: false });
        }
    };

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">All Products</h1>
                    <p className="text-gray-400 text-sm mt-1">Here is the inventory you are selling. Manage them easily.</p>
                </div>
                <div className="flex items-center gap-3 relative">
                    {/* Hidden file input */}
                    <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />

                    {/* Import Button */}
                    {canEdit && (
                        <div className="relative">
                            <motion.button
                                onClick={() => { setShowImportMenu(!showImportMenu); setShowExportMenu(false); }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={importing}
                                className="px-5 py-2.5 rounded-lg border border-[#2d1b4e] text-gray-200 font-semibold hover:bg-[#2d1b4e] hover:text-white transition-colors flex items-center gap-2 bg-[#1E1628] text-sm shadow-[0_2px_10px_rgba(0,0,0,0.2)] disabled:opacity-50"
                            >
                                {importing ? (
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                                ) : (
                                    <FontAwesomeIcon icon={faFileImport} className="text-sm" />
                                )}
                                <span>Import</span>
                                <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] ml-1 transition-transform ${showImportMenu ? 'rotate-180' : ''}`} />
                            </motion.button>

                            <AnimatePresence>
                                {showImportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 mt-2 w-56 bg-[#1E1628] border border-[#2d1b4e] rounded-xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <button onClick={handleDownloadSample} className="w-full text-left px-4 py-3 hover:bg-[#2d1b4e] text-gray-300 hover:text-white text-sm flex items-center gap-3 transition-colors border-b border-[#2d1b4e]">
                                            <FontAwesomeIcon icon={faDownload} className="text-blue-400 w-4" />
                                            Download Sample Format
                                        </button>
                                        <button onClick={() => { setShowImportMenu(false); importFileRef.current?.click(); }} className="w-full text-left px-4 py-3 hover:bg-[#2d1b4e] text-gray-300 hover:text-white text-sm flex items-center gap-3 transition-colors">
                                            <FontAwesomeIcon icon={faUpload} className="text-emerald-400 w-4" />
                                            Import from Excel (.xlsx)
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Export Button */}
                    <div className="relative">
                        <motion.button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={exporting}
                            className="px-5 py-2.5 rounded-lg border border-[#2d1b4e] text-gray-200 font-semibold hover:bg-[#2d1b4e] hover:text-white transition-colors flex items-center gap-2 bg-[#1E1628] text-sm shadow-[0_2px_10px_rgba(0,0,0,0.2)] disabled:opacity-50"
                        >
                            {exporting ? (
                                <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-sm" />
                            ) : (
                                <FontAwesomeIcon icon={faFileExport} className="text-sm" />
                            )}
                            <span>Export List</span>
                            <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] ml-1 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </motion.button>

                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-[#1E1628] border border-[#2d1b4e] rounded-xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-3 hover:bg-[#2d1b4e] text-gray-300 hover:text-white text-sm flex items-center gap-3 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        Export as JSON
                                    </button>
                                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 hover:bg-[#2d1b4e] text-gray-300 hover:text-white text-sm flex items-center gap-3 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        Export as CSV
                                    </button>
                                    <button onClick={() => handleExport('xlsx')} className="w-full text-left px-4 py-3 hover:bg-[#2d1b4e] text-gray-300 hover:text-white text-sm flex items-center gap-3 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        Export as Excel (.xlsx)
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>


                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {canEdit ? (
                            <Link href="/products/create" className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#6D28D9] transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2 text-sm">
                                <FontAwesomeIcon icon={faPlus} />
                                Add New Product
                            </Link>
                        ) : (
                            <span className="px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 text-sm bg-gray-800/50 text-gray-600 cursor-not-allowed" title="You don't have permission to create products">
                                <FontAwesomeIcon icon={faPlus} />
                                Add New Product
                            </span>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <SlideIn direction="up" delay={0.1}>
                <div className={`bg-[#1E1628] p-2.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-[#2d1b4e] ${showFilters ? 'mb-4' : 'mb-8'} flex flex-col md:flex-row items-center justify-between gap-4 transition-all`}>
                    <div className="relative w-full md:w-[400px]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-11 pr-4 py-2.5 bg-[#2d1b4e] text-sm text-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#a78bfa]/50 transition-all placeholder-gray-500 border border-transparent focus:border-[#a78bfa]/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto pr-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <motion.button onClick={() => setShowFilters(!showFilters)} whileHover={{ scale: 1.02 }} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors shadow-sm whitespace-nowrap ${showFilters ? 'bg-[#7C3AED] text-white border-transparent' : 'bg-[#2d1b4e] text-gray-400 border-[#3b2a5f] hover:bg-[#3b2a5f] hover:text-[#a78bfa]'}`}>
                            <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
                            <span>Filters</span>
                            {activeFiltersCount > 0 && (
                                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${showFilters ? 'bg-white text-[#7C3AED]' : 'bg-[#7C3AED] text-white'}`}>
                                    {activeFiltersCount}
                                </span>
                            )}
                        </motion.button>
                        <div className="w-px h-6 bg-[#2d1b4e] hidden md:block"></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider hidden md:block">Sort:</span>


                        {/* Custom Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : ""}
                                onChange={(e) => {
                                    if (!e.target.value) {
                                        setSortConfig(null);
                                        return;
                                    }
                                    const [key, direction] = e.target.value.split('-');
                                    setSortConfig({ key, direction });
                                }}
                                className="w-[150px] p-2 bg-[#2d1b4e] border border-[#3b2a5f] rounded-lg text-xs font-semibold text-gray-300 focus:ring-2 focus:ring-[#a78bfa]/50 hover:bg-[#3b2a5f] hover:text-[#a78bfa] outline-none transition-all cursor-pointer appearance-none shadow-sm"
                            >
                                <option value="">Default Sort</option>
                                <option value="price-ascending">Price: Low to High</option>
                                <option value="price-descending">Price: High to Low</option>
                                <option value="title-ascending">Name: A to Z</option>
                                <option value="title-descending">Name: Z to A</option>
                                <option value="createdAt-descending">Date: Newest</option>
                                <option value="createdAt-ascending">Date: Oldest</option>
                                <option value="averageRating-descending">Rating: Highest</option>
                                <option value="averageRating-ascending">Rating: Lowest</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Expandable Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-[#1a1224] border border-[#2d1b4e] rounded-xl p-6 mb-8 overflow-hidden shadow-xl shadow-black/30"
                        >
                            <div className="space-y-6">
                                {/* Section 1: Category Taxonomy */}
                                <div className="border-b border-[#2d1b4e]/60 pb-5">
                                    <h4 className="text-xs font-bold text-[#a78bfa] mb-4 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]"></span>
                                        Category Taxonomy
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {/* Parent Category */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Parent Category</label>
                                            <select
                                                value={selectedParentCategory}
                                                onChange={(e) => {
                                                    setSelectedParentCategory(e.target.value);
                                                    setSelectedAssetCategory('');
                                                    setSelectedSubCategory('');
                                                }}
                                                className="w-full p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">All Parent Categories</option>
                                                {parentCategories.map((cat) => (
                                                    <option key={cat.category_id} value={cat.category_id}>
                                                        {cat.category_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Asset Category (Cascading) */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Asset Category</label>
                                            <select
                                                value={selectedAssetCategory}
                                                onChange={(e) => {
                                                    setSelectedAssetCategory(e.target.value);
                                                    setSelectedSubCategory('');
                                                }}
                                                className="w-full p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">All Asset Categories</option>
                                                {(selectedParentCategory
                                                    ? assetCategories.filter(cat => String(cat.parent_category_id) === String(selectedParentCategory))
                                                    : assetCategories
                                                ).map((cat) => (
                                                    <option key={cat.asset_category_id} value={cat.asset_category_id}>
                                                        {cat.name} ({cat.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Subcategory (Cascading) */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subcategory</label>
                                            <select
                                                value={selectedSubCategory}
                                                onChange={(e) => setSelectedSubCategory(e.target.value)}
                                                className="w-full p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">All Subcategories</option>
                                                {(selectedAssetCategory
                                                    ? subCategories.filter(sub => String(sub.asset_category_id) === String(selectedAssetCategory))
                                                    : subCategories
                                                ).map((sub) => (
                                                    <option key={sub.asset_sub_category_id} value={sub.asset_sub_category_id}>
                                                        {sub.name} ({sub.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Asset Specifications */}
                                <div className="border-b border-[#2d1b4e]/60 pb-5">
                                    <h4 className="text-xs font-bold text-[#a78bfa] mb-4 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]"></span>
                                        Asset Specifications
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {/* Type */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Asset Type</label>
                                            <select
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                                className="w-full p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">All Types</option>
                                                {types.map((t) => (
                                                    <option key={t.asset_type_id} value={t.asset_type_id}>
                                                        {t.name} ({t.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Variant */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Asset Variant</label>
                                            <select
                                                value={selectedVariant}
                                                onChange={(e) => setSelectedVariant(e.target.value)}
                                                className="w-full p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">All Variants</option>
                                                {variants.map((v) => (
                                                    <option key={v.asset_variant_id} value={v.asset_variant_id}>
                                                        {v.name} ({v.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Orientation */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Orientation</label>
                                            <select
                                                value={selectedOrientation}
                                                onChange={(e) => setSelectedOrientation(e.target.value)}
                                                className="w-full p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">All Orientations</option>
                                                {orientations.map((o) => (
                                                    <option key={o.asset_orientation_id} value={o.asset_orientation_id}>
                                                        {o.name} ({o.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Range & Value Filters */}
                                <div>
                                    <h4 className="text-xs font-bold text-[#a78bfa] mb-4 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]"></span>
                                        Price, Rating & Date
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {/* Price Range */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price Range (₹)</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={minPrice}
                                                    onChange={(e) => setMinPrice(e.target.value)}
                                                    className="w-1/2 p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all placeholder-gray-600 shadow-sm"
                                                />
                                                <span className="text-gray-500 font-bold">-</span>
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={maxPrice}
                                                    onChange={(e) => setMaxPrice(e.target.value)}
                                                    className="w-1/2 p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all placeholder-gray-600 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Minimum Rating</label>
                                            <select
                                                value={minRating}
                                                onChange={(e) => setMinRating(e.target.value)}
                                                className="w-full p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-200 outline-none transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="">Any Rating</option>
                                                <option value="4.5">4.5+ Stars</option>
                                                <option value="4">4.0+ Stars</option>
                                                <option value="3">3.0+ Stars</option>
                                            </select>
                                        </div>

                                        {/* Date Added Range */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Added Range</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="w-1/2 p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-400 outline-none transition-all shadow-sm"
                                                />
                                                <span className="text-gray-500 font-bold">-</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="w-1/2 p-2.5 bg-[#2d1b4e] border border-[#3b2a5f] hover:border-[#a78bfa]/30 focus:border-[#a78bfa]/60 rounded-lg text-sm text-gray-400 outline-none transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-6 flex justify-end pt-4 border-t border-[#2d1b4e] border-dashed">
                                <button
                                    onClick={() => {
                                        setSelectedParentCategory('');
                                        setSelectedAssetCategory('');
                                        setSelectedSubCategory('');
                                        setSelectedType('');
                                        setSelectedVariant('');
                                        setSelectedOrientation('');
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setStartDate('');
                                        setEndDate('');
                                        setMinRating('');
                                    }}
                                    className="px-5 py-2.5 bg-red-500/10 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-white transition-all duration-200"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SlideIn>

            {/* Product Grid - Dokani Style */}
            {
                loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <CardSkeleton key={i} />)}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                            <AnimatePresence>
                                {visibleProducts.map((product, index) => (
                                    <motion.div
                                        key={product.products_id}
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{
                                            type: "spring",
                                            damping: 15,
                                            stiffness: 100,
                                            delay: index * 0.03
                                        }}
                                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                        className={`bg-[#1E1628] rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-xl transition-all group relative border border-[#2d1b4e] hover:shadow-purple-900/10`}
                                    >
                                        {/* Checkbox for multi-select */}

                                        {/* Vertical Ribbon */}
                                        {product.is_draft ? (
                                            <div className="absolute top-0 left-4 w-8 h-12 bg-amber-600 flex items-center justify-center rounded-b-lg shadow-sm z-10 transition-transform hover:scale-110 origin-top">
                                                <span className="text-[10px] font-bold text-white -rotate-90 tracking-wider transform translate-y-1 block">DRAFT</span>
                                            </div>
                                        ) : (
                                            <div className="absolute top-0 left-4 w-8 h-12 bg-[#2d1b4e] flex items-center justify-center rounded-b-lg shadow-sm z-10 transition-transform hover:scale-110 origin-top">
                                                <span className="text-[10px] font-bold text-[#a78bfa] -rotate-90 tracking-wider transform translate-y-1 block">NEW</span>
                                            </div>
                                        )}

                                        {/* 3-Dots Menu */}
                                        <div className="absolute top-12 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2d1b4e] cursor-pointer text-gray-500 group-hover:text-[#a78bfa] transition-colors">
                                            <span className="mb-2 text-xl font-bold tracking-widest leading-none">...</span>
                                        </div>

                                        {/* Floating Actions Overlay */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            className="absolute inset-0 bg-[#130C1C]/80 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 transition-opacity z-20 rounded-[18px] pointer-events-none group-hover:pointer-events-auto"
                                        >
                                            {canView && (
                                                <Link href={`/products/view/${product.products_id}`} className="w-10 h-10 bg-[#1E1628] rounded-full flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-green-500/10 hover:scale-110 transition-all shadow-lg border border-[#2d1b4e]">
                                                    <FontAwesomeIcon icon={faEye} />
                                                </Link>
                                            )}
                                            {canEdit && (
                                                <Link href={`/products/edit/${product.products_id}`} className="w-10 h-10 bg-[#1E1628] rounded-full flex items-center justify-center text-gray-400 hover:text-[#a78bfa] hover:bg-[#2d1b4e] hover:scale-110 transition-all shadow-lg border border-[#2d1b4e]">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Link>
                                            )}
                                            {canDelete && (
                                                <button
                                                    className="w-10 h-10 bg-[#1E1628] rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:scale-110 transition-all shadow-lg border border-[#2d1b4e] disabled:opacity-50"
                                                    onClick={() => handleDelete(product.products_id)}
                                                    disabled={deletingId === product.products_id}
                                                >
                                                    {deletingId === product.products_id ? (
                                                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-sm" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    )}
                                                </button>
                                            )}
                                            {!canView && !canEdit && !canDelete && (
                                                <span className="text-xs text-gray-500 bg-[#1E1628] px-3 py-1 rounded-full border border-[#2d1b4e]">No Access</span>
                                            )}
                                        </motion.div>

                                        {/* Image Area */}
                                        <div className="h-48 flex items-center justify-center my-4 overflow-hidden  relative transition-colors ">
                                            {product.thumbnail ? (
                                                <motion.img
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ duration: 0.3 }}
                                                    src={product.thumbnail}
                                                    alt=""
                                                    className="h-full object-contain max-w-[95%] drop-shadow-sm"
                                                />
                                            ) : (product.images && product.images.length > 0) ? (
                                                <motion.img
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ duration: 0.3 }}
                                                    src={product.images[0]}
                                                    alt=""
                                                    className="h-full object-contain max-w-[95%] drop-shadow-sm"
                                                />
                                            ) : (product.video && product.video.length > 0) ? (
                                                <motion.video
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ duration: 0.3 }}
                                                    src={product.video[0]}
                                                    className="h-full object-contain max-w-[95%] drop-shadow-sm pointer-events-none"
                                                    muted
                                                    loop
                                                    playsInline
                                                    onMouseOver={(e) => e.target.play()}
                                                    onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                                />
                                            ) : (
                                                <div className="text-gray-300">
                                                    <FontAwesomeIcon icon={faSearch} className="text-4xl opacity-20" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Text Content matching Hope UI */}
                                        <div className="px-1 space-y-3">
                                            {/* Title & Rating Row */}
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <span className="text-[13px] font-mono text-[#a78bfa]/60 block mb-1 uppercase tracking-tighter">
                                                        {product.internal_sku || 'NO-SKU'}
                                                    </span>
                                                    <h3 className="font-bold text-gray-100 text-[15px] leading-snug line-clamp-2 group-hover:text-[#a78bfa] transition-colors cursor-pointer">
                                                        {product.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                                    <span>{product.averageRating ? Number(product.averageRating).toFixed(1) : (product.rating ? Number(product.rating).toFixed(1) : '0.0')}</span>
                                                    <FontAwesomeIcon icon={faStar} className="text-[9px]" />
                                                </div>
                                            </div>

                                            {/* Price & Sales Row */}
                                            <div className="flex justify-between items-end border-t border-[#2d1b4e] pt-3 border-dashed">
                                                <div>
                                                    <span className="text-[10px] text-gray-500 block mb-0.5 font-bold uppercase tracking-wider">Price</span>
                                                    <span className="text-lg font-bold text-white">₹{(product.price || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-gray-500 block mb-0.5 font-bold uppercase tracking-wider">Sales</span>
                                                    <span className="text-xs font-semibold text-[#a78bfa] bg-[#2d1b4e] px-2 py-0.5 rounded-md">{product.sales_count || '0'} sold</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Load More Button */}
                        {visibleCount < sortedProducts.length && (
                            <div className="flex justify-center mt-8">
                                <Button
                                    onClick={loadMore}
                                    loading={loadingMore}
                                    variant="secondary"
                                    className="px-8"
                                >
                                    Load More Products
                                </Button>
                            </div>
                        )}
                    </>
                )
            }

            {
                filteredProducts.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 bg-[#1E1628] rounded-[24px] border border-dashed border-[#2d1b4e]"
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[#2d1b4e] mb-4 text-5xl"
                        >
                            <FontAwesomeIcon icon={faSearch} />
                        </motion.div>
                        <h3 className="text-lg font-bold text-white">No Products Found</h3>
                        <p className="text-gray-400 mt-1">Add a new product to get started.</p>
                    </motion.div>
                )
            }

            {/* Import Progress Modal */}
            <AnimatePresence>
                {importProgress && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={(e) => { if (!importProgress.processing && e.target === e.currentTarget) setImportProgress(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#1E1628] border border-[#2d1b4e] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d1b4e]">
                                <div className="flex items-center gap-3">
                                    {importProgress.processing ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-purple-400 text-lg" />
                                    ) : importProgress.isPreview ? (
                                        <FontAwesomeIcon icon={faEye} className="text-blue-400 text-lg" />
                                    ) : importProgress.failed === 0 ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 text-lg" />
                                    ) : (
                                        <FontAwesomeIcon icon={faTimesCircle} className="text-amber-400 text-lg" />
                                    )}
                                    <h2 className="text-white font-bold text-lg">
                                        {importProgress.processing ? 'Processing Import...' : importProgress.isPreview ? 'Import Preview' : 'Import Complete'}
                                    </h2>
                                </div>
                                {!importProgress.processing && (
                                    <button onClick={() => setImportProgress(null)} className="w-8 h-8 rounded-full bg-[#2d1b4e] text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {importProgress.processing ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-16 h-16 border-4 border-[#2d1b4e] border-t-purple-500 rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-400 text-sm">Please wait while we process the spreadsheet...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Summary Stats */}
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="bg-[#2d1b4e] rounded-xl p-4 text-center border border-[#3b2a5f]">
                                                <span className="text-3xl font-bold text-white block mb-1">{importProgress.total}</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Rows</span>
                                            </div>
                                            <div className="bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-500/20">
                                                <span className="text-3xl font-bold text-emerald-400 block mb-1">{importProgress.success}</span>
                                                <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Valid / Imported</span>
                                            </div>
                                            <div className="bg-red-500/10 rounded-xl p-4 text-center border border-red-500/20">
                                                <span className="text-3xl font-bold text-red-400 block mb-1">{importProgress.failed}</span>
                                                <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Failed / Invalid</span>
                                            </div>
                                        </div>

                                        {importProgress.isPreview && importProgress.failed > 0 && (
                                            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                <p className="text-sm text-amber-400"><FontAwesomeIcon icon={faTimesCircle} className="mr-2"/>You have invalid rows. You can either fix the spreadsheet and try again, or confirm the import to only upload the valid rows.</p>
                                            </div>
                                        )}

                                        {/* Detailed Results Log */}
                                        <div className="space-y-2">
                                            {importProgress.results?.map((r, i) => (
                                                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                                                    r.status === 'success'
                                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                                        : 'bg-red-500/5 border-red-500/20'
                                                }`}>
                                                    <div className="mt-0.5 shrink-0">
                                                        {r.status === 'success' ? (
                                                            <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400" />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faTimesCircle} className="text-red-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-500 text-xs font-mono">Row {r.row}</span>
                                                            <span className="text-gray-200 font-semibold truncate">{r.title}</span>
                                                        </div>
                                                        {r.status === 'success' ? (
                                                            <div className="text-gray-500 text-xs mt-1 font-mono">{r.sku} · /{r.slug}</div>
                                                        ) : (
                                                            <div className="text-red-400 text-xs mt-1">{r.reason}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            {/* Modal Footer */}
                            {!importProgress.processing && importProgress.isPreview && (
                                <div className="px-6 py-4 border-t border-[#2d1b4e] bg-[#1a1224] flex justify-end gap-3">
                                    <button 
                                        onClick={() => { setImportProgress(null); setSelectedFile(null); }}
                                        className="px-5 py-2.5 rounded-lg border border-[#2d1b4e] text-gray-300 font-semibold hover:bg-[#2d1b4e] hover:text-white transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmImport}
                                        disabled={importProgress.success === 0}
                                        className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#6D28D9] transition-colors shadow-lg shadow-purple-900/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirm & Import {importProgress.success} Valid Products
                                    </button>
                                </div>
                            )}
                            {!importProgress.processing && !importProgress.isPreview && (
                                <div className="px-6 py-4 border-t border-[#2d1b4e] bg-[#1a1224] flex justify-end">
                                    <button 
                                        onClick={() => setImportProgress(null)}
                                        className="bg-[#2d1b4e] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#3b2a5f] transition-colors text-sm"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default withPermission(Products, 'products');
