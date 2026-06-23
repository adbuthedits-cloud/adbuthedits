"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faBan, faCheckCircle, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { getAuthToken } from "../../../../utils/auth";
import MultiSelectSearch from "../../../../components/MultiSelectSearch";
import toast from "react-hot-toast";
import withPermission from "../../../../components/withPermission";
import { useUnsavedChangesWarning } from "../../../../hooks/useUnsavedChangesWarning";

function CreateCoupon() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [masterLoading, setMasterLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);

    const [parentCategories, setParentCategories] = useState([]);
    const [assetCategories, setAssetCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    const defaultForm = {
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
    };

    const [formData, setFormData] = useState(defaultForm);
    const [initialFormData] = useState(defaultForm);

    useUnsavedChangesWarning(isDirty);

    useEffect(() => {
        const isDifferent = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        setIsDirty(isDifferent);
    }, [formData, initialFormData]);

    useEffect(() => {
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
            toast.error("Failed to load categories/products");
        } finally {
            setMasterLoading(false);
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
        formDataUpload.append("code", formData.code || "UNNAMED");

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code) return toast.error("Coupon code is required");
        if (!formData.value) return toast.error("Discount value is required");

        setSaving(true);
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

            await axios.post(`${apiUrl}/api/admin/coupons`, dataToSubmit, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Coupon created successfully!");
            setIsDirty(false);
            router.push("/coupons");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to create coupon");
        } finally {
            setSaving(false);
        }
    };

    if (masterLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D287E]"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/coupons" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1E1628] border border-[#2d1b4e] text-gray-400 hover:bg-[#2d1b4e] hover:text-[#a78bfa] transition-colors shadow-lg shadow-purple-900/10">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Create Coupon</h1>
                    <p className="text-gray-400 text-sm">Configure granular spending rules and storefront marketing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-[#1E1628] rounded-3xl p-8 border border-[#2d1b4e] shadow-2xl">
                {/* 1. Core Config */}
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

                {/* 2. Availability */}
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

                {/* 3. Targeting & Cart Rules */}
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

                    {/* Inclusion Rules */}
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

                    {/* Exclusion Rules */}
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

                {/* 4. Storefront Marketing */}
                <div className="space-y-4 p-6 bg-[#130C1C] border border-[#2d1b4e] rounded-3xl">
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

                    {formData.show_on_popup && (
                        <div className="space-y-4 overflow-hidden pt-2 border-t border-purple-500/10">
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
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-[#2d1b4e]">
                    <Link
                        href="/coupons"
                        className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest flex items-center justify-center"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#7D287E] hover:bg-[#6a226b] text-white px-10 py-3 rounded-xl font-bold transform transition-all active:scale-95 shadow-xl shadow-purple-900/30 flex items-center justify-center disabled:opacity-50"
                    >
                        {saving ? "Creating..." : "Create Promotion"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default withPermission(CreateCoupon, "marketing");
