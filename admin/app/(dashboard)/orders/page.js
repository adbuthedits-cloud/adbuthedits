"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { getAuthToken, getAuthUser, hasPermission } from "../../../utils/auth";
import withPermission from "../../../components/withPermission";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClock, faEye, faSearch, faSort, faCheckCircle, faBoxOpen,
    faShoppingBag, faTruckFast, faHourglassHalf, faArrowUpRightFromSquare,
    faSpinner, faFilter, faChevronDown
} from "@fortawesome/free-solid-svg-icons";
import { useSortableData } from "../../../hooks/useSortableData";

const STATUS_FILTERS = ["All", "Paid", "Pending", "Delivered", "In Progress"];

function StatCard({ icon, label, value, color }) {
    return (
        <div className={`bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <FontAwesomeIcon icon={icon} className="text-sm" />
            </div>
            <div>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white font-bold text-xl">{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ order }) {
    const total = order.items?.length || 0;
    const delivered = order.items?.filter(i => i.delivery_status === "delivered").length || 0;
    if (total > 0 && total === delivered)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20"><FontAwesomeIcon icon={faCheckCircle} />Delivered</span>;
    if (delivered > 0)
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><FontAwesomeIcon icon={faBoxOpen} />{delivered}/{total} Delivered</span>;
    if (["inprocessing", "in_progress"].includes(order.status))
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><FontAwesomeIcon icon={faHourglassHalf} />In Progress</span>;
    if (order.status === "paid")
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20"><FontAwesomeIcon icon={faClock} />Processing</span>;
    return <span className="text-gray-500 text-xs">—</span>;
}

function PayBadge({ status }) {
    const map = {
        paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${map[status] || map.pending}`}>
            {(status || "pending").toUpperCase()}
        </span>
    );
}

function fmt(d) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [visibleCount, setVisibleCount] = useState(20);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        const token = getAuthToken();
        if (!token) { window.location.href = "/login"; return; }
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await axios.get(`${apiUrl}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
            setOrders(res.data);
            try {
                await axios.put(`${apiUrl}/api/admin/orders/mark-viewed`, {}, { headers: { Authorization: `Bearer ${token}` } });
                window.dispatchEvent(new Event("ordersViewed"));
            } catch {}
        } catch (err) {
            if (err.response?.status === 401) { localStorage.removeItem("admin_token"); window.location.href = "/login"; }
        } finally { setLoading(false); }
    };

    // Stats
    const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const deliveredCount = orders.filter(o => o.items?.every(i => i.delivery_status === "delivered")).length;
    const processingCount = orders.filter(o => ["paid", "inprocessing", "in_progress"].includes(o.status) && !o.items?.every(i => i.delivery_status === "delivered")).length;

    const applyFilter = (o) => {
        if (filter === "Delivered") return o.items?.every(i => i.delivery_status === "delivered");
        if (filter === "In Progress") return ["inprocessing", "in_progress"].includes(o.status);
        if (filter === "Paid") return o.status === "paid";
        if (filter === "Pending") return o.status === "pending";
        return true;
    };

    const filtered = orders.filter(o =>
        applyFilter(o) && (
            o.order_id?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.email?.toLowerCase().includes(search.toLowerCase())
        )
    );

    const { items: sorted, requestSort } = useSortableData(filtered);
    const visible = sorted.slice(0, visibleCount);

    const loadMore = async () => {
        setLoadingMore(true);
        await new Promise(r => setTimeout(r, 400));
        setVisibleCount(p => p + 20);
        setLoadingMore(false);
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">All Orders</h1>
                    <p className="text-gray-400 text-sm mt-0.5">{orders.length} total orders · ₹{totalRevenue.toLocaleString()} revenue</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={faShoppingBag} label="Total Orders" value={orders.length} color="bg-[#a78bfa]/10 text-[#a78bfa]" />
                <StatCard icon={faCheckCircle} label="Delivered" value={deliveredCount} color="bg-purple-500/10 text-purple-400" />
                <StatCard icon={faHourglassHalf} label="Processing" value={processingCount} color="bg-amber-500/10 text-amber-400" />
                <StatCard icon={faTruckFast} label="Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}k`} color="bg-sky-500/10 text-sky-400" />
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-3 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-sm" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by order ID, name or email..."
                        className="w-full pl-11 pr-4 py-2.5 bg-[#2d1b4e] text-sm text-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#a78bfa]/40 placeholder-gray-500 border border-transparent focus:border-[#a78bfa]/30 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f ? "bg-[#a78bfa] text-white shadow-lg shadow-purple-500/20" : "bg-[#2d1b4e] text-gray-400 hover:text-white"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-3xl" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-20">
                        <FontAwesomeIcon icon={faBoxOpen} className="text-gray-700 text-5xl mb-4" />
                        <p className="text-gray-400 font-medium">No orders found</p>
                        <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#2d1b4e]/60 border-b border-[#3b2a5f]">
                                <tr>
                                    {[["order_id","Order"], ["user.email","Customer"], ["total_amount","Amount"], ["status","Payment"], ["delivery","Delivery"], ["createdAt","Date"]].map(([key, label]) => (
                                        <th
                                            key={key}
                                            onClick={() => key !== "delivery" && requestSort(key)}
                                            className={`px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${key !== "delivery" ? "cursor-pointer hover:text-[#a78bfa]" : ""}`}
                                        >
                                            {label} {key !== "delivery" && <FontAwesomeIcon icon={faSort} className="ml-0.5 opacity-40" />}
                                        </th>
                                    ))}
                                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2d1b4e]/60">
                                {visible.map(order => (
                                    <tr key={order.order_id} className="hover:bg-[#2d1b4e]/25 transition-all group">
                                        {/* Order ID */}
                                        <td className="px-5 py-4">
                                            <p className="font-mono text-sm text-white font-semibold">#{order.order_id.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-[10px] text-gray-600 mt-0.5">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</p>
                                        </td>
                                        {/* Customer */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-[#a78bfa]/20 flex items-center justify-center text-[#a78bfa] text-xs font-bold flex-shrink-0">
                                                    {(order.user?.first_name?.[0] || "?").toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white text-sm font-semibold truncate">{order.user?.first_name || "Guest"}</p>
                                                    <p className="text-gray-500 text-xs truncate">{order.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Amount */}
                                        <td className="px-5 py-4">
                                            <p className="text-white font-bold text-sm">₹{order.total_amount?.toLocaleString()}</p>
                                            {order.discount_amount > 0 && (
                                                <p className="text-emerald-500 text-[10px]">-₹{order.discount_amount?.toLocaleString()} off</p>
                                            )}
                                        </td>
                                        {/* Payment */}
                                        <td className="px-5 py-4"><PayBadge status={order.status} /></td>
                                        {/* Delivery */}
                                        <td className="px-5 py-4"><StatusBadge order={order} /></td>
                                        {/* Date */}
                                        <td className="px-5 py-4">
                                            <p className="text-gray-400 text-xs">{fmt(order.createdAt)}</p>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href={`/orders/${order.order_id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 rounded-lg text-xs font-semibold hover:bg-[#a78bfa]/20 transition-all"
                                            >
                                                <FontAwesomeIcon icon={faEye} /> View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Load More */}
            {visibleCount < sorted.length && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2d1b4e] text-[#a78bfa] rounded-xl text-sm font-semibold hover:bg-[#3b2a5f] transition-all disabled:opacity-50"
                    >
                        {loadingMore ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faChevronDown} />}
                        {loadingMore ? "Loading..." : `Load More (${sorted.length - visibleCount} remaining)`}
                    </button>
                </div>
            )}
        </>
    );
}

export default withPermission(Orders, "orders");
