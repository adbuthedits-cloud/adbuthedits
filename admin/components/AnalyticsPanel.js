"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getAuthToken, logout } from "../utils/auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    TrendingUp, 
    TrendingDown, 
    IndianRupee, 
    ShoppingCart, 
    Clock, 
    Users, 
    Package, 
    Tag, 
    MessageSquare, 
    Percent, 
    AlertCircle, 
    Activity,
    CheckCircle,
    XCircle,
    Calendar
} from "lucide-react";

export default function AnalyticsPanel({ isOpen, onClose }) {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAnalytics = async () => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        const token = getAuthToken();
        if (!token) {
            window.location.href = "/login";
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        try {
            const res = await axios.get(`${apiUrl}/api/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setRecentOrders(res.data.recentOrders || []);
        } catch (err) {
            console.error("Error fetching analytics panel data:", err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                window.location.href = "/login";
            } else {
                setError("Failed to fetch statistics. Please retry.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAnalytics();
        }
    }, [isOpen]);

    // Format numbers
    const formatNum = (num) => (num !== undefined ? num.toLocaleString() : "0");

    // Format currency
    const formatCurrency = (num) => (num !== undefined ? `₹${num.toLocaleString()}` : "₹0");

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#0b0612] z-50 backdrop-blur-sm"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#130C1C] border-l border-[#2d1b4e] z-50 shadow-2xl flex flex-col text-white"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#2d1b4e] flex items-center justify-between bg-[#1a1025]">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-[#a78bfa]/10 rounded-lg text-[#a78bfa]">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg leading-tight">Detailed Statistics</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Real-time store performance data</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg bg-[#2d1b4e]/50 text-gray-400 hover:text-white hover:bg-[#2d1b4e] transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scroll space-y-6">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-3">
                                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#a78bfa] animate-spin"></div>
                                    <span className="text-sm text-gray-400">Retrieving stats...</span>
                                </div>
                            ) : error ? (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
                                    <AlertCircle size={32} className="mx-auto text-red-500" />
                                    <p className="text-sm text-red-400">{error}</p>
                                    <button
                                        onClick={fetchAnalytics}
                                        className="px-4 py-2 bg-[#2d1b4e] text-xs font-semibold rounded-lg hover:bg-[#3b2a5f] transition-all"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : stats ? (
                                <>
                                    {/* Financial Section */}
                                    <div className="space-y-3">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Financials</div>
                                        
                                        {/* Revenue Card */}
                                        <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-4 flex justify-between items-center group hover:border-[#a78bfa]/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                                                    <IndianRupee size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium">Total Revenue</p>
                                                    <p className="text-lg font-bold mt-0.5">{formatCurrency(stats.revenue)}</p>
                                                </div>
                                            </div>
                                            {stats.revenueGrowth !== undefined && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                                                    parseFloat(stats.revenueGrowth) >= 0 
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                }`}>
                                                    {parseFloat(stats.revenueGrowth) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {Math.abs(parseFloat(stats.revenueGrowth))}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Conversion Rate Card */}
                                        <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-4 flex justify-between items-center group hover:border-[#a78bfa]/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa] rounded-lg">
                                                    <Percent size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium">Conversion Rate</p>
                                                    <p className="text-lg font-bold mt-0.5">{stats.conversionRate || "0.00%"}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-medium">Orders / Customers</span>
                                        </div>
                                    </div>

                                    {/* Order Breakdown */}
                                    <div className="space-y-3">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Order Management</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-3.5 space-y-2">
                                                <div className="flex justify-between text-gray-400">
                                                    <ShoppingCart size={16} />
                                                    <span className="text-[10px] bg-[#2d1b4e] px-1.5 py-0.5 rounded text-gray-300">Total</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Orders placed</p>
                                                    <p className="text-lg font-bold mt-0.5">{formatNum(stats.totalOrders)}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-3.5 space-y-2">
                                                <div className="flex justify-between text-amber-400">
                                                    <Clock size={16} />
                                                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">Pending</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Awaiting delivery</p>
                                                    <p className="text-lg font-bold mt-0.5">{formatNum(stats.totalPendingOrders)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inventory & Customers */}
                                    <div className="space-y-3">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Customers & Inventory</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-3.5 space-y-2">
                                                <div className="flex justify-between text-[#a78bfa]">
                                                    <Users size={16} />
                                                    <span className="text-[10px] bg-[#a78bfa]/10 border border-[#a78bfa]/20 px-1.5 py-0.5 rounded">Users</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Registered</p>
                                                    <p className="text-lg font-bold mt-0.5">{formatNum(stats.totalUsers)}</p>
                                                </div>
                                            </div>

                                            <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-3.5 space-y-2">
                                                <div className="flex justify-between text-blue-400">
                                                    <Package size={16} />
                                                    <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">Catalog</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Total Products</p>
                                                    <p className="text-lg font-bold mt-0.5">{formatNum(stats.totalProducts)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marketing & Support */}
                                    <div className="space-y-3">
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Marketing & Support</div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Active Coupons */}
                                            <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-3.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-[#a78bfa]/10 text-[#a78bfa] rounded-lg">
                                                        <Tag size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Active Coupons</p>
                                                        <p className="text-base font-bold">{formatNum(stats.activeCoupons)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Open Enquiries */}
                                            <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-3.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                                                        <MessageSquare size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Open Enquiries</p>
                                                        <p className="text-base font-bold">{formatNum(stats.recentInquiriesCount)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity Mini-Feed */}
                                    {recentOrders && recentOrders.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Latest Sales Activity</div>
                                            <div className="bg-[#1e1628] border border-[#2d1b4e] rounded-xl p-4 divide-y divide-[#2d1b4e]/50">
                                                {recentOrders.map((order, idx) => (
                                                    <div key={order.order_id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-gray-200">
                                                                {order.user?.first_name || "Guest Customer"}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-white">₹{order.total_amount?.toLocaleString()}</p>
                                                            <p className={`text-[10px] font-semibold uppercase ${
                                                                order.status === "paid" || order.status === "completed" || order.status === "delivered" 
                                                                    ? "text-emerald-400" 
                                                                    : order.status === "cancelled" || order.status === "failed" 
                                                                        ? "text-rose-400" 
                                                                        : "text-amber-400"
                                                            }`}>
                                                                {order.status || "paid"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No data available.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#2d1b4e] bg-[#1a1025] flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2d1b4e] hover:bg-[#3b2a5f] text-gray-300 hover:text-white transition-all w-full"
                            >
                                Close Panel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
