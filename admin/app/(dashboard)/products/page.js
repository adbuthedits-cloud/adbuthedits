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
    const [categories, setCategories] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minRating, setMinRating] = useState('');
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Import state
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(null); // null | { total, current, results[] }
    const importFileRef = useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const res = await axios.get(`${apiUrl}/api/categories`);
            setCategories(res.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
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

        const matchCategory = selectedCategory ? p.category_id === selectedCategory : true;

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

        return matchSearch && matchCategory && matchMinPrice && matchMaxPrice && matchStartDate && matchEndDate && matchRating;
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
        e.target.value = '';
        setShowImportMenu(false);
        setImporting(true);
        setImportProgress({ total: 0, current: 0, results: [], processing: true });

        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post(`${apiUrl}/api/admin/products/import`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setImportProgress({ ...res.data, processing: false });
            if (res.data.success > 0) fetchProducts();
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setImportProgress({ total: 0, success: 0, failed: 1, results: [{ row: '-', title: file.name, status: 'error', reason: msg }], processing: false });
        } finally {
            setImporting(false);
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
                            className="bg-[#1a1224] border border-[#2d1b4e] rounded-xl p-5 mb-8 overflow-hidden shadow-lg shadow-black/20"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full p-2.5 bg-[#2d1b4e] border border-transparent rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/50 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((cat) => (
                                            <option key={cat.category_id} value={cat.category_id}>
                                                {cat.category_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Price Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price Range (₹)</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            className="w-1/2 p-2.5 bg-[#2d1b4e] border border-transparent rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/50 outline-none transition-all placeholder-gray-600"
                                        />
                                        <span className="text-gray-500 font-bold">-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            className="w-1/2 p-2.5 bg-[#2d1b4e] border border-transparent rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/50 outline-none transition-all placeholder-gray-600"
                                        />
                                    </div>
                                </div>

                                {/* Date Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Added</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-1/2 p-2.5 bg-[#2d1b4e] border border-transparent rounded-lg text-sm text-gray-400 focus:ring-2 focus:ring-[#a78bfa]/50 outline-none transition-all"
                                        />
                                        <span className="text-gray-500 font-bold">-</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-1/2 p-2.5 bg-[#2d1b4e] border border-transparent rounded-lg text-sm text-gray-400 focus:ring-2 focus:ring-[#a78bfa]/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Rating Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Minimum Rating</label>
                                    <select
                                        value={minRating}
                                        onChange={(e) => setMinRating(e.target.value)}
                                        className="w-full p-2.5 bg-[#2d1b4e] border border-transparent rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/50 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">Any Rating</option>
                                        <option value="4.5">4.5+ Stars</option>
                                        <option value="4">4.0+ Stars</option>
                                        <option value="3">3.0+ Stars</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end pt-4 border-t border-[#2d1b4e] border-dashed">
                                <button
                                    onClick={() => {
                                        setSelectedCategory('');
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setStartDate('');
                                        setEndDate('');
                                        setMinRating('');
                                    }}
                                    className="px-4 py-2 bg-red-500/10 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
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
                                        className="bg-[#1E1628] rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-xl hover:shadow-purple-900/10 transition-all group relative border border-[#2d1b4e]"
                                    >
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
                                        <div className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2d1b4e] cursor-pointer text-gray-500 group-hover:text-[#a78bfa] transition-colors">
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
                                    ) : importProgress.failed === 0 ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 text-lg" />
                                    ) : (
                                        <FontAwesomeIcon icon={faTimesCircle} className="text-amber-400 text-lg" />
                                    )}
                                    <h2 className="text-white font-bold text-lg">
                                        {importProgress.processing ? 'Processing Import...' : 'Import Complete'}
                                    </h2>
                                </div>
                                {!importProgress.processing && (
                                    <button onClick={() => setImportProgress(null)} className="w-8 h-8 rounded-full bg-[#2d1b4e] text-gray-400 hover:text-white flex items-center justify-center transition-colors">
                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    </button>
                                )}
                            </div>

                            {/* Summary Stats */}
                            {!importProgress.processing && (
                                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-[#2d1b4e]">
                                    <div className="bg-[#2d1b4e] rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-white">{importProgress.total}</div>
                                        <div className="text-xs text-gray-400 mt-1">Total Rows</div>
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-emerald-400">{importProgress.success}</div>
                                        <div className="text-xs text-gray-400 mt-1">Imported</div>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-red-400">{importProgress.failed}</div>
                                        <div className="text-xs text-gray-400 mt-1">Failed</div>
                                    </div>
                                </div>
                            )}

                            {/* Row Results */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                                {importProgress.processing ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-purple-400 text-4xl" />
                                        <p className="text-gray-400">Processing your spreadsheet row by row...</p>
                                        <p className="text-gray-500 text-xs">Do not close this window</p>
                                    </div>
                                ) : (
                                    importProgress.results?.map((r, i) => (
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
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {!importProgress.processing && (
                                <div className="px-6 py-4 border-t border-[#2d1b4e] flex justify-between items-center">
                                    <p className="text-gray-500 text-xs">Products list has been refreshed automatically.</p>
                                    <button
                                        onClick={() => setImportProgress(null)}
                                        className="px-5 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold hover:bg-[#6D28D9] transition-colors"
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
