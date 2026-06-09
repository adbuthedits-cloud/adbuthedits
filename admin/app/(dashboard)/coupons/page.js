"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faCopy, faTicketAlt, faEye, faTimes, faEdit, faSearch, faLayerGroup, faBan, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { getAuthToken } from "../../../utils/auth";
import MultiSelectSearch from "../../../components/MultiSelectSearch";
import toast from "react-hot-toast";

import withPermission from "../../../components/withPermission";

function Coupons() {
    const router = useRouter();
    const user = getAuthToken() ? JSON.parse(localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user') || '{}') : null;
    const canView = true; // Handled by withPermission at page level for the module itself
    const canEdit = user && (user.is_super_admin || (user.permissions?.marketing && user.permissions.marketing.includes('edit')));
    const canDelete = user && (user.is_super_admin || (user.permissions?.marketing && user.permissions.marketing.includes('delete')));
    const [coupons, setCoupons] = useState([]);

    const [parentCategories, setParentCategories] = useState([]);
    const [assetCategories, setAssetCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCouponId, setSelectedCouponId] = useState(null);

    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percentage",
        value: "",
        expiration_date: "",
        start_date: "",
        max_discount_amount: "",
        usage_limit: "",
        min_order_value: "",
        per_user_limit: "1",
        new_user_only: false,
        min_items_count: "",
        included_categories: [], 
        included_asset_categories: [],
        included_asset_sub_categories: [],
        included_products: [],
        excluded_categories: [],
        excluded_asset_categories: [],
        excluded_asset_sub_categories: [],
        excluded_products: [],
        show_on_popup: false,
        popup_title: "",
        popup_message: "",
        media_url: "",
        media_type: ""
    });

    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [selectedCouponUsage, setSelectedCouponUsage] = useState([]);
    const [usageLoading, setUsageLoading] = useState(false);
    const [selectedCouponCode, setSelectedCouponCode] = useState("");

    useEffect(() => {
        fetchCoupons();
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();

            const masterRes = await axios.get(`${apiUrl}/api/admin/master-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setParentCategories(masterRes.data.parentCategories || []);
            setAssetCategories(masterRes.data.categories || []);
            setSubCategories(masterRes.data.subCategories || []);

            const prodRes = await axios.get(`${apiUrl}/api/products`);
            setAllProducts(prodRes.data || []);
        } catch (error) {
            console.error("Failed to fetch master data", error);
        }
    };

    const fetchCoupons = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }
            const res = await axios.get(`${apiUrl}/api/admin/coupons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCoupons(res.data);
            setLoading(false);
        } catch (error) {
            localStorage.setItem("dismissed_promos", JSON.stringify({}));
            toast.success("Dismisals Reset!");
        }
    };

    const handleMediaUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (!isVideo && !isImage) {
            toast.error("Only images or videos are allowed");
            return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append("media", file);
        formDataUpload.append("code", formData.code);

        try {
            toast.loading("Uploading media...", { id: "media-upload" });
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            const res = await axios.post(`${apiUrl}/api/admin/coupons/upload`, formDataUpload, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });

            setFormData(prev => ({
                ...prev,
                media_url: res.data.url,
                media_type: isVideo ? "video" : "image"
            }));
            toast.success("Media uploaded successfully!", { id: "media-upload" });
        } catch (error) {
            console.error("Upload failed", error);
            toast.error(error.response?.data?.error || "Upload failed", { id: "media-upload" });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            await axios.delete(`${apiUrl}/api/admin/coupons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCoupons();
        } catch (error) {
            alert("Failed to delete coupon");
        }
    };

    const handleEdit = (coupon) => {
        setSelectedCouponId(coupon.coupon_id);
        setIsEditing(true);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            value: coupon.value,
            expiration_date: coupon.expiration_date ? new Date(coupon.expiration_date).toISOString().split("T")[0] : "",
            start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().split("T")[0] : "",
            max_discount_amount: coupon.max_discount_amount || "",
            usage_limit: coupon.usage_limit || "",
            min_order_value: coupon.min_order_value || "",
            min_items_count: coupon.min_items_count || "",
            per_user_limit: coupon.per_user_limit || "1",
            new_user_only: coupon.new_user_only,
            included_categories: coupon.included_categories || [],
            included_asset_categories: coupon.included_asset_categories || [],
            included_asset_sub_categories: coupon.included_asset_sub_categories || [],
            included_products: coupon.included_products || [],
            excluded_categories: coupon.excluded_categories || [],
            excluded_asset_categories: coupon.excluded_asset_categories || [],
            excluded_asset_sub_categories: coupon.excluded_asset_sub_categories || [],
            excluded_products: coupon.excluded_products || [],
            show_on_popup: coupon.show_on_popup,
            popup_title: coupon.popup_title || "",
            popup_message: coupon.popup_message || "",
            media_url: coupon.media_url || "",
            media_type: coupon.media_type || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            const dataToSubmit = { ...formData };

            if (!dataToSubmit.min_order_value) dataToSubmit.min_order_value = 0;
            if (!dataToSubmit.min_items_count) dataToSubmit.min_items_count = 0;
            if (!dataToSubmit.usage_limit) dataToSubmit.usage_limit = null;
            if (!dataToSubmit.per_user_limit) dataToSubmit.per_user_limit = null;
            if (!dataToSubmit.max_discount_amount) dataToSubmit.max_discount_amount = null;
            if (!dataToSubmit.start_date) dataToSubmit.start_date = null;
            if (!dataToSubmit.expiration_date) dataToSubmit.expiration_date = null;
            if (!dataToSubmit.media_url) {
                dataToSubmit.media_url = null;
                dataToSubmit.media_type = null;
            }

            if (isEditing) {
                await axios.put(`${apiUrl}/api/admin/coupons/${selectedCouponId}`, dataToSubmit, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${apiUrl}/api/admin/coupons`, dataToSubmit, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setIsModalOpen(false);
            resetForm();
            fetchCoupons();
        } catch (error) {
            alert(error.response?.data?.error || `Failed to ${isEditing ? "update" : "create"} coupon`);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setSelectedCouponId(null);
        setFormData({
            code: "", discount_type: "percentage", value: "", expiration_date: "",
            start_date: "", max_discount_amount: "", usage_limit: "", min_order_value: "",
            min_items_count: "", per_user_limit: "1", new_user_only: false,
            included_categories: [], included_asset_categories: [], included_asset_sub_categories: [], included_products: [],
            excluded_categories: [], excluded_asset_categories: [], excluded_asset_sub_categories: [], excluded_products: [],
            show_on_popup: false, popup_title: "", popup_message: "",
            media_url: "", media_type: ""
        });
    };

    const handleViewUsage = async (coupon) => {
        setIsUsageModalOpen(true);
        setUsageLoading(true);
        setSelectedCouponCode(coupon.code);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            const res = await axios.get(`${apiUrl}/api/admin/coupons/${coupon.coupon_id}/usage`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedCouponUsage(res.data);
        } catch (error) {
            alert("Failed to fetch usage data");
        } finally {
            setUsageLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Coupons & Promo Codes</h1>
                    <p className="text-gray-400">Manage discounts and special offers</p>
                </div>
                {canEdit ? (
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-[#7D287E] hover:bg-[#6a226b] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
                    >
                        <FontAwesomeIcon icon={faPlus} /> Create New Coupon
                    </button>
                ) : (
                    <span className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 bg-gray-800/50 text-gray-600 cursor-not-allowed">
                        <FontAwesomeIcon icon={faPlus} /> Create New Coupon
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D287E]"></div>
                </div>
            ) : coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-[#2d1b4e]/50 rounded-full flex items-center justify-center mb-6 border border-[#3b2a5f] shadow-[0_0_30px_rgba(125,40,126,0.1)]">
                        <FontAwesomeIcon icon={faTicketAlt} className="text-4xl text-[#7D287E]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Coupons Yet</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                        Create your first promo code to boost sales and reward your customers.
                    </p>
                    {canEdit && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#7D287E] hover:bg-[#6a226b] text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:-translate-y-1"
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Create First Coupon
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map((coupon) => (
                        <div key={coupon.coupon_id} className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] relative group overflow-hidden hover:border-[#7D287E] transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                <button onClick={() => router.push(`/coupons/view/${coupon.coupon_id}`)} className="text-green-400 hover:text-green-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-500/10 transition-colors">
                                    <FontAwesomeIcon icon={faEye} />
                                </button>
                                {canEdit && (
                                    <button onClick={() => handleEdit(coupon)} className="text-blue-400 hover:text-blue-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-500/10 transition-colors">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={() => handleDelete(coupon.coupon_id)} className="text-red-400 hover:text-red-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-colors">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#2d1b4e] flex items-center justify-center text-[#a78bfa] text-xl border border-[#3b2a5f] group-hover:border-[#7D287E]/30 transition-colors">
                                    <FontAwesomeIcon icon={faTicketAlt} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-white font-bold text-lg tracking-wide group-hover:text-[#a78bfa] transition-colors">{coupon.code}</h3>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mr-2 ${new Date(coupon.expiration_date) < new Date() ? "bg-red-500/5 text-red-400 border-red-500/20" : "bg-green-500/5 text-green-400 border-green-500/20"}`}>
                                        {new Date(coupon.expiration_date) < new Date() ? "Expired" : "Active"}
                                    </span>
                                    {coupon.show_on_popup && (
                                        <span className="bg-green-500/10 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-green-500/20 animate-pulse">
                                            POPUP ACTIVE
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-[#2d1b4e]/50">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="text-white font-bold text-base">
                                        {coupon.discount_type === "percentage" ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Usage</span>
                                    <span className="text-gray-300 font-medium">{coupon.used_count} <span className="text-gray-600">/</span> {coupon.usage_limit || "∞"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Expires</span>
                                    <span className="text-gray-300 font-medium">
                                        {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : "Never"}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[#2d1b4e]/50">
                                <button onClick={() => handleViewUsage(coupon)} className="w-full py-2 bg-[#2d1b4e] hover:bg-[#3b2a5f] rounded-lg text-xs font-bold text-[#a78bfa] transition-colors flex items-center justify-center gap-2">
                                    <FontAwesomeIcon icon={faEye} /> View Usage Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1E1628] rounded-3xl p-8 w-full max-w-2xl border border-[#2d1b4e] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{isEditing ? "Edit Coupon" : "Create New Coupon"}</h2>
                                    <p className="text-gray-400 text-sm">Configure granular spending rules and marketing</p>
                                </div>
                                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-gray-500 hover:text-white transition-colors">
                                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#7D287E] uppercase tracking-widest border-l-2 border-[#7D287E] pl-3">1. Core Config</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs mb-1 uppercase font-bold tracking-tight">Coupon Code</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="E.g. SUMMER50"
                                                className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E] uppercase font-mono"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">Type</label>
                                                <select
                                                    className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-2 py-3 text-white outline-none focus:border-[#7D287E] text-sm"
                                                    value={formData.discount_type}
                                                    onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                                >
                                                    <option value="percentage">Percent %</option>
                                                    <option value="fixed">Fixed ₹</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-xs mb-1 uppercase font-bold text-center">Value</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E] text-center"
                                                    value={formData.value}
                                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {formData.discount_type === "percentage" && (
                                        <div>
                                            <label className="block text-gray-400 text-xs mb-1 uppercase font-bold tracking-tight">Max Discount Cap (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="Max amount to discount (optional)"
                                                className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E]"
                                                value={formData.max_discount_amount}
                                                onChange={e => setFormData({ ...formData, max_discount_amount: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#7D287E] uppercase tracking-widest border-l-2 border-[#7D287E] pl-3">2. Availability</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">Start Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E]"
                                                value={formData.start_date}
                                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">Expiry Date</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E]"
                                                value={formData.expiration_date}
                                                onChange={e => setFormData({ ...formData, expiration_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">Global Usage Limit</label>
                                            <input
                                                type="number"
                                                placeholder="Leave empty for ∞"
                                                className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E]"
                                                value={formData.usage_limit}
                                                onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">Limit Per User</label>
                                            <input
                                                type="number"
                                                placeholder="Default: 1"
                                                className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E]"
                                                value={formData.per_user_limit}
                                                onChange={e => setFormData({ ...formData, per_user_limit: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-[#7D287E] uppercase tracking-widest border-l-2 border-[#7D287E] pl-3">3. Targeting & Cart Rules</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center gap-3 p-4 bg-[#130C1C] border border-[#2d1b4e] rounded-2xl group cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, new_user_only: !prev.new_user_only }))}>
                                            <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${formData.new_user_only ? "bg-[#7D287E]" : "bg-gray-700"}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.new_user_only ? "translate-x-4" : "translate-x-0"}`} />
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold">New User Acquisition</p>
                                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tight">First purchase only</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1 ml-1">Min. Order Value (₹)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E]"
                                                    value={formData.min_order_value}
                                                    onChange={e => setFormData({ ...formData, min_order_value: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1 ml-1">Min. Items Count</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-[#7D287E]"
                                                    value={formData.min_items_count}
                                                    onChange={e => setFormData({ ...formData, min_items_count: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-green-500/[0.03] border border-green-500/10 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xs" />
                                            <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest">Inclusion Rules (Applied to these only)</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                            <MultiSelectSearch
                                                label="Included Parent Categories"
                                                options={parentCategories.map(c => ({ label: c.category_name, value: c.category_id }))}
                                                selectedValues={formData.included_categories}
                                                onSelect={(vals) => setFormData({ ...formData, included_categories: vals })}
                                                placeholder="Select Parent Categories..."
                                            />
                                            <MultiSelectSearch
                                                label="Included Asset Categories"
                                                options={assetCategories.map(c => ({ label: c.name, value: c.asset_category_id }))}
                                                selectedValues={formData.included_asset_categories}
                                                onSelect={(vals) => setFormData({ ...formData, included_asset_categories: vals })}
                                                placeholder="Select Asset Categories..."
                                            />
                                            <MultiSelectSearch
                                                label="Included Subcategories"
                                                options={subCategories.map(c => ({ label: c.name, value: c.asset_sub_category_id }))}
                                                selectedValues={formData.included_asset_sub_categories}
                                                onSelect={(vals) => setFormData({ ...formData, included_asset_sub_categories: vals })}
                                                placeholder="Select Subcategories..."
                                            />
                                            <MultiSelectSearch
                                                label="Included Specific Products"
                                                options={allProducts.map(p => ({ label: p.title, value: p.products_id }))}
                                                selectedValues={formData.included_products}
                                                onSelect={(vals) => setFormData({ ...formData, included_products: vals })}
                                                placeholder="Select Products..."
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-red-500/[0.03] border border-red-500/10 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FontAwesomeIcon icon={faBan} className="text-red-500 text-xs" />
                                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Exclusion Rules (Blocked for these)</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                            <MultiSelectSearch
                                                label="Excluded Parent Categories"
                                                options={parentCategories.map(c => ({ label: c.category_name, value: c.category_id }))}
                                                selectedValues={formData.excluded_categories}
                                                onSelect={(vals) => setFormData({ ...formData, excluded_categories: vals })}
                                                placeholder="Select Parent Categories..."
                                            />
                                            <MultiSelectSearch
                                                label="Excluded Asset Categories"
                                                options={assetCategories.map(c => ({ label: c.name, value: c.asset_category_id }))}
                                                selectedValues={formData.excluded_asset_categories}
                                                onSelect={(vals) => setFormData({ ...formData, excluded_asset_categories: vals })}
                                                placeholder="Select Asset Categories..."
                                            />
                                            <MultiSelectSearch
                                                label="Excluded Subcategories"
                                                options={subCategories.map(c => ({ label: c.name, value: c.asset_sub_category_id }))}
                                                selectedValues={formData.excluded_asset_sub_categories}
                                                onSelect={(vals) => setFormData({ ...formData, excluded_asset_sub_categories: vals })}
                                                placeholder="Select Subcategories..."
                                            />
                                            <MultiSelectSearch
                                                label="Excluded Specific Products"
                                                options={allProducts.map(p => ({ label: p.title, value: p.products_id }))}
                                                selectedValues={formData.excluded_products}
                                                onSelect={(vals) => setFormData({ ...formData, excluded_products: vals })}
                                                placeholder="Select Products..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-6 bg-purple-900/10 border border-purple-900/20 rounded-3xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest pl-1">4. Storefront Marketing</h3>
                                            <p className="text-gray-400 text-xs mt-1">Enable website-wide promotion popup</p>
                                        </div>
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, show_on_popup: !prev.show_on_popup }))}>
                                            <div className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${formData.show_on_popup ? "bg-green-500" : "bg-gray-700"}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.show_on_popup ? "translate-x-5" : "translate-x-0"} shadow-lg`} />
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {formData.show_on_popup && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="space-y-4 overflow-hidden"
                                            >
                                                <div>
                                                    <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">Popup Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="E.g. Diwali Flash Sale! 🪔"
                                                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
                                                        value={formData.popup_title}
                                                        onChange={e => setFormData({ ...formData, popup_title: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">Popup Message</label>
                                                    <textarea
                                                        rows="3"
                                                        placeholder="Write a catchy promo text here..."
                                                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 resize-none text-sm"
                                                        value={formData.popup_message}
                                                        onChange={e => setFormData({ ...formData, popup_message: e.target.value })}
                                                    />
                                                </div>

                                                <div className="pt-4 border-t border-purple-500/10">
                                                    <label className="block text-gray-400 text-xs mb-2 uppercase font-bold">Promotional Media (Optional)</label>
                                                    <div className="relative group">
                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2d1b4e] rounded-2xl cursor-pointer bg-[#130C1C] hover:bg-[#1A1128] hover:border-[#7D287E] transition-all overflow-hidden">
                                                            {formData.media_url ? (
                                                                <>
                                                                    {formData.media_type === "video" ? (
                                                                        <video src={formData.media_url} muted autoPlay loop className="w-full h-full object-cover opacity-60" />
                                                                    ) : (
                                                                        <img src={formData.media_url} alt="Promo" className="w-full h-full object-cover opacity-60" />
                                                                    )}
                                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <FontAwesomeIcon icon={faPlus} className="text-white text-xl mb-1" />
                                                                        <p className="text-white text-[10px] font-bold uppercase">Change Media</p>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center py-4">
                                                                    <FontAwesomeIcon icon={faPlus} className="text-purple-400 mb-2" />
                                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Upload Image/Video</p>
                                                                </div>
                                                            )}
                                                            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaUpload} />
                                                        </label>
                                                        {formData.media_url && (
                                                            <button 
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, media_url: "", media_type: "" })}
                                                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-[#2d1b4e]">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[#7D287E] hover:bg-[#6a226b] text-white px-10 py-3 rounded-xl font-bold transform transition-all active:scale-95 shadow-xl shadow-purple-900/30"
                                    >
                                        {isEditing ? "Update Promotion" : "Create Promotion"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isUsageModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1E1628] rounded-2xl w-full max-w-4xl border border-[#2d1b4e] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-[#2d1b4e] flex justify-between items-center bg-[#130C1C]">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Usage Details</h2>
                                    <p className="text-[#a78bfa] text-sm font-medium mt-1">Code: {selectedCouponCode}</p>
                                </div>
                                <button
                                    onClick={() => setIsUsageModalOpen(false)}
                                    className="w-8 h-8 rounded-full bg-[#2d1b4e] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto">
                                {usageLoading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7D287E]"></div>
                                    </div>
                                ) : selectedCouponUsage.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-[#2d1b4e]/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3b2a5f]">
                                            <FontAwesomeIcon icon={faTicketAlt} className="text-2xl text-gray-500" />
                                        </div>
                                        <h3 className="text-white font-medium mb-1">No Usage Yet</h3>
                                        <p className="text-gray-500 text-sm">This coupon hasn't been used by any customer.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-300">
                                            <thead className="text-xs uppercase bg-[#130C1C] text-gray-400 border-b border-[#2d1b4e]">
                                                <tr>
                                                    <th className="px-6 py-4 rounded-tl-lg font-semibold tracking-wider">User</th>
                                                    <th className="px-6 py-4 font-semibold tracking-wider">Order details</th>
                                                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Amount</th>
                                                    <th className="px-6 py-4 rounded-tr-lg font-semibold tracking-wider">Date used</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedCouponUsage.map((usage, idx) => (
                                                    <tr key={usage.usage_id} className={`border-b border-[#2d1b4e]/50 hover:bg-[#2d1b4e]/20 transition-colors ${idx % 2 === 0 ? "bg-[#1E1628]" : "bg-[#1a1325]"}`}>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-white">{usage.user?.first_name} {usage.user?.last_name}</div>
                                                            <div className="text-xs text-gray-500">{usage.user?.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-mono text-xs text-[#a78bfa] bg-[#2d1b4e] inline-block px-2 py-1 rounded">
                                                                #{usage.order?.order_id?.slice(0, 8)}...
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1 capitalize">{usage.order?.status}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="font-bold text-white">₹{usage.order?.total_amount}</div>
                                                            <div className="text-xs text-green-400">Saved: ₹{usage.order?.discount_amount}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                                            {new Date(usage.used_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default withPermission(Coupons, "marketing");
