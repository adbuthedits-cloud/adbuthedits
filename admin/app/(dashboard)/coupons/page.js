"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faTicketAlt, faEye, faTimes, faEdit } from "@fortawesome/free-solid-svg-icons";
import { getAuthToken } from "../../../utils/auth";
import toast from "react-hot-toast";
import withPermission from "../../../components/withPermission";

function Coupons() {
    const router = useRouter();

    const user = getAuthToken() ? JSON.parse(localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user') || '{}') : null;
    const canEdit = user && (user.is_super_admin || (user.permissions?.marketing && user.permissions.marketing.includes('edit')));
    const canDelete = user && (user.is_super_admin || (user.permissions?.marketing && user.permissions.marketing.includes('delete')));
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [selectedCouponUsage, setSelectedCouponUsage] = useState([]);
    const [usageLoading, setUsageLoading] = useState(false);
    const [selectedCouponCode, setSelectedCouponCode] = useState("");

    useEffect(() => {
        fetchCoupons();
    }, []);

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
            console.error("Failed to fetch coupons", error);
            localStorage.setItem("dismissed_promos", JSON.stringify({}));
            toast.error("Failed to load coupons");
            setLoading(false);
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
            toast.success("Coupon deleted successfully!");
            fetchCoupons();
        } catch (error) {
            console.error("Failed to delete coupon", error);
            toast.error("Failed to delete coupon");
        }
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
            console.error("Failed to fetch usage details", error);
            toast.error("Failed to fetch usage details");
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
                    <Link
                        href="/coupons/create"
                        className="bg-[#7D287E] hover:bg-[#6a226b] text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
                    >
                        <FontAwesomeIcon icon={faPlus} /> Create New Coupon
                    </Link>
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
                        <Link
                            href="/coupons/create"
                            className="bg-[#7D287E] hover:bg-[#6a226b] text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transform hover:-translate-y-1"
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Create First Coupon
                        </Link>
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
                                    <Link href={`/coupons/edit/${coupon.coupon_id}`} className="text-blue-400 hover:text-blue-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-500/10 transition-colors">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
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
