"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getAuthToken, getAuthUser, hasPermission } from "../../../utils/auth";
import AccessDenied from "../../../components/AccessDenied";
import withPermission from "../../../components/withPermission";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faRoute, faSpinner, faCheckCircle, faCircleXmark, faUser,
    faClock, faCircleDot, faTruckFast, faClipboardList, faSearch,
    faChevronDown, faChevronUp, faRefresh, faUserCheck, faBoxOpen
} from "@fortawesome/free-solid-svg-icons";

// ─── Status Config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    unassigned:  { label: "Unassigned",   color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/20", dot: "bg-gray-400" },
    assigned:    { label: "Assigned",     color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20", dot: "bg-blue-400" },
    in_progress: { label: "In Progress",  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20", dot: "bg-amber-400" },
    delivered:   { label: "Delivered",    color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20", dot: "bg-green-400" },
    completed:   { label: "Completed",    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "bg-purple-400" },
};

const ACTION_ICONS = {
    ORDER_PLACED:        { icon: faBoxOpen,       color: "text-blue-400",   bg: "bg-blue-500/10" },
    ASSIGNED:            { icon: faUserCheck,     color: "text-indigo-400", bg: "bg-indigo-500/10" },
    REASSIGNED:          { icon: faUserCheck,     color: "text-orange-400", bg: "bg-orange-500/10" },
    PICKED_UP:           { icon: faCircleDot,     color: "text-amber-400",  bg: "bg-amber-500/10" },
    PROGRESS_UPDATE:     { icon: faClipboardList, color: "text-cyan-400",   bg: "bg-cyan-500/10" },
    DELIVERED:           { icon: faTruckFast,     color: "text-green-400",  bg: "bg-green-500/10" },
    COMPLETED:           { icon: faCheckCircle,   color: "text-purple-400", bg: "bg-purple-500/10" },
    NOTIFICATION_SENT:   { icon: faClock,         color: "text-gray-400",   bg: "bg-gray-500/10" },
};

function formatTime(ts) {
    if (!ts) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(new Date(ts));
}

// ─── Timeline Component ────────────────────────────────────────────────────
function OrderTimelineView({ orderId, token, apiUrl }) {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId || !token) return;
        axios.get(`${apiUrl}/api/admin/orders/${orderId}/timeline`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => setTimeline(r.data)).catch(() => {}).finally(() => setLoading(false));
    }, [orderId, token, apiUrl]);

    if (loading) return (
        <div className="py-6 flex justify-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa]" />
        </div>
    );

    if (!timeline.length) return (
        <p className="text-gray-500 text-sm py-4 text-center">No timeline events yet.</p>
    );

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-[#2d1b4e]" />
            <div className="space-y-4">
                {timeline.map((event, idx) => {
                    const cfg = ACTION_ICONS[event.action] || ACTION_ICONS.PROGRESS_UPDATE;
                    return (
                        <div key={event.timeline_id} className="flex gap-4 relative pl-1">
                            {/* Dot */}
                            <div className={`w-9 h-9 rounded-full ${cfg.bg} border border-[#2d1b4e] flex items-center justify-center flex-shrink-0 z-10`}>
                                <FontAwesomeIcon icon={cfg.icon} className={`text-xs ${cfg.color}`} />
                            </div>
                            {/* Content */}
                            <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-white font-semibold text-sm">{event.status_label}</p>
                                        {event.actor_name && (
                                            <p className="text-gray-500 text-xs mt-0.5">
                                                by <span className="text-gray-300">{event.actor_name}</span>
                                                {event.actor_role && <span className="text-gray-600"> · {event.actor_role}</span>}
                                            </p>
                                        )}
                                        {event.notes && (
                                            <p className="text-gray-400 text-xs mt-1 bg-[#2d1b4e]/50 rounded-lg px-3 py-2 border border-[#2d1b4e]">{event.notes}</p>
                                        )}
                                    </div>
                                    <span className="text-gray-600 text-xs whitespace-nowrap">{formatTime(event.event_at)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Order Row Component ───────────────────────────────────────────────────
function OrderTrackingRow({ order, token, apiUrl, staff, onRefresh, canAssign }) {
    const [expanded, setExpanded] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(order.assigned_to || "");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const cfg = STATUS_CONFIG[order.working_status] || STATUS_CONFIG.unassigned;
    const orderRef = order.order_id.substring(0, 8).toUpperCase();

    const handleAssign = async () => {
        if (!selectedStaff) return;
        setAssigning(true);
        setError("");
        try {
            await axios.post(`${apiUrl}/api/admin/orders/${order.order_id}/assign`,
                { assignedTo: selectedStaff },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess("Assigned! Processing...");
            setTimeout(() => { setSuccess(""); onRefresh(); }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || "Assignment failed");
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl overflow-hidden transition-all duration-200 hover:border-[#a78bfa]/30">
            {/* Row Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} flex-shrink-0 ${order.working_status === 'in_progress' ? 'animate-pulse' : ''}`} />
                    
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-mono font-bold text-sm">#{orderRef}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} font-semibold`}>
                                {cfg.label}
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">
                            {order.user?.first_name} {order.user?.last_name} · {order.user?.email}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Assigned</p>
                        <p className="text-xs text-gray-300">
                            {order.assignedEmployee ? `${order.assignedEmployee.first_name} ${order.assignedEmployee.last_name || ''}`.trim() : "—"}
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-500">Placed</p>
                        <p className="text-xs text-gray-300">{formatTime(order.createdAt)}</p>
                    </div>
                    <div className="text-gray-500">
                        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-xs" />
                    </div>
                </div>
            </button>

            {/* Expanded Panel */}
            {expanded && (
                <div className="border-t border-[#2d1b4e] px-5 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Assignment Panel */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assignment</h4>
                        
                        {/* Info Grid */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs px-3 py-2 bg-[#2d1b4e]/40 rounded-lg">
                                <span className="text-gray-500">Assigned To</span>
                                <span className="text-gray-200 font-medium">
                                    {order.assignedEmployee ? `${order.assignedEmployee.first_name} ${order.assignedEmployee.last_name || ''}`.trim() : "Not Assigned"}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs px-3 py-2 bg-[#2d1b4e]/40 rounded-lg">
                                <span className="text-gray-500">Assigned At</span>
                                <span className="text-gray-200">{order.assigned_at ? formatTime(order.assigned_at) : "—"}</span>
                            </div>
                            <div className="flex justify-between text-xs px-3 py-2 bg-[#2d1b4e]/40 rounded-lg">
                                <span className="text-gray-500">Picked Up At</span>
                                <span className="text-gray-200">{order.picked_up_at ? formatTime(order.picked_up_at) : "—"}</span>
                            </div>
                            <div className="flex justify-between text-xs px-3 py-2 bg-[#2d1b4e]/40 rounded-lg">
                                <span className="text-gray-500">Customer Status</span>
                                <span className="text-gray-200 capitalize">{order.status}</span>
                            </div>
                        </div>

                        {/* Assign Dropdown */}
                        {canAssign && (
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">
                                    {order.assigned_to ? "Re-assign to" : "Assign to"} Staff:
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedStaff}
                                        onChange={e => setSelectedStaff(e.target.value)}
                                        className="flex-1 bg-[#2d1b4e] border border-[#3b2a5f] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#a78bfa]"
                                    >
                                        <option value="">— Select Staff —</option>
                                        {staff.map(s => (
                                            <option key={s.admin_id} value={s.admin_id}>
                                                {s.first_name} {s.last_name || ''} ({s.role})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAssign}
                                        disabled={assigning || !selectedStaff}
                                        className="px-4 py-2 bg-[#a78bfa] hover:bg-[#9061f9] text-[#1a1025] rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {assigning ? <FontAwesomeIcon icon={faSpinner} spin /> : "Assign"}
                                    </button>
                                </div>
                                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                                {success && <p className="text-green-400 text-xs mt-1">{success}</p>}
                            </div>
                        )}
                    </div>

                    {/* Right: Timeline */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Timeline</h4>
                        <OrderTimelineView orderId={order.order_id} token={token} apiUrl={apiUrl} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
function OrderTrackingPage() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isClient, setIsClient] = useState(false);

    const [orders, setOrders] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [refreshKey, setRefreshKey] = useState(0);
    const [error, setError] = useState("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        setIsClient(true);
        const u = getAuthUser();
        const t = getAuthToken();
        setUser(u);
        setToken(t);
    }, []);

    const fetchData = useCallback(async () => {
        if (!token || !user) return;
        const headers = { Authorization: `Bearer ${token}` };
        setLoading(true);
        setError("");
        try {
            const canAssignOrders = hasPermission(user, "orders", "assign") || user.is_super_admin === true;
            let ordersRes, staffRes;
            if (canAssignOrders) {
                const [oRes, sRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/admin/orders`, { headers }),
                    axios.get(`${apiUrl}/api/admin/staff`, { headers }),
                ]);
                ordersRes = oRes;
                staffRes = sRes;
            } else {
                ordersRes = await axios.get(`${apiUrl}/api/admin/orders`, { headers });
                staffRes = { data: [] };
            }
            setOrders(ordersRes.data || []);
            setStaff(staffRes.data || []);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, [token, user, apiUrl]);

    useEffect(() => {
        if (token && user) fetchData();
    }, [token, user, refreshKey, fetchData]);

    if (!isClient) return null;
    if (!user) return null;
    if (!hasPermission(user, "order_tracking", "view")) {
        return <div className="p-8"><AccessDenied module="Order Tracking" action="view" /></div>;
    }

    const canAssign = hasPermission(user, "orders", "assign");
    const isSuperAdmin = user?.is_super_admin === true;

    // Filtered & searched orders
    const filtered = orders.filter(o => {
        const matchStatus = filterStatus === "all" || o.working_status === filterStatus;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            o.order_id.toLowerCase().includes(q) ||
            (o.user?.first_name || "").toLowerCase().includes(q) ||
            (o.user?.email || "").toLowerCase().includes(q) ||
            (o.assignedEmployee?.first_name || "").toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    // Stats
    const stats = {
        total: orders.length,
        unassigned: orders.filter(o => o.working_status === "unassigned").length,
        in_progress: orders.filter(o => o.working_status === "in_progress").length,
        delivered: orders.filter(o => o.working_status === "delivered" || o.working_status === "completed").length,
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
                            <FontAwesomeIcon icon={faRoute} className="text-[#a78bfa]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Order Tracking</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-13">Live workflow — assignment, progress & delivery timeline</p>
                </div>
                <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm transition-all"
                >
                    <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Orders", value: stats.total, color: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10" },
                    { label: "Unassigned", value: stats.unassigned, color: "text-gray-400", bg: "bg-gray-500/10" },
                    { label: "In Progress", value: stats.in_progress, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Delivered", value: stats.delivered, color: "text-green-400", bg: "bg-green-500/10" },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border border-[#2d1b4e] rounded-xl p-4`}>
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by order ID, customer, or employee..."
                        className="w-full bg-[#1a1025] border border-[#2d1b4e] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#a78bfa]"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {["all", "unassigned", "assigned", "in_progress", "delivered"].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                                filterStatus === s
                                    ? "bg-[#a78bfa] text-[#1a1025]"
                                    : "bg-[#1a1025] border border-[#2d1b4e] text-gray-400 hover:border-[#a78bfa]/50"
                            }`}
                        >
                            {s.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faCircleXmark} /> {error}
                </div>
            )}

            {/* Order List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-3xl mb-3" />
                        <p className="text-gray-500 text-sm">Loading orders...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <FontAwesomeIcon icon={faRoute} className="text-gray-600 text-4xl mb-3" />
                        <p className="text-gray-500">No orders found</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(order => (
                        <OrderTrackingRow
                            key={order.order_id}
                            order={order}
                            token={token}
                            apiUrl={apiUrl}
                            staff={staff}
                            canAssign={canAssign || isSuperAdmin}
                            onRefresh={() => setRefreshKey(k => k + 1)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default withPermission(OrderTrackingPage, 'order_tracking', 'view');
