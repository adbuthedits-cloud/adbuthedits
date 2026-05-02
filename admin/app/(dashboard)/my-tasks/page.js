"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { getAuthToken, getAuthUser, hasPermission } from "../../../utils/auth";
import AccessDenied from "../../../components/AccessDenied";
import withPermission from "../../../components/withPermission";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClipboardCheck, faSpinner, faCheckCircle, faCircleXmark,
    faRefresh, faChevronRight, faClock, faCircleDot, faTruckFast,
    faUser, faBoxOpen
} from "@fortawesome/free-solid-svg-icons";

function formatTime(ts) {
    if (!ts) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(new Date(ts));
}

const STATUS_CONFIG = {
    unassigned:  { label: "Awaiting Pickup",  color: "text-blue-400",   dot: "bg-blue-400",   badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    assigned:    { label: "Ready to Pick Up", color: "text-amber-400",  dot: "bg-amber-400",  badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    in_progress: { label: "In Progress",      color: "text-green-400",  dot: "bg-green-400",  badge: "bg-green-500/10 text-green-400 border-green-500/20" },
    delivered:   { label: "Delivered",        color: "text-purple-400", dot: "bg-purple-400", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    completed:   { label: "Completed",        color: "text-gray-400",   dot: "bg-gray-400",   badge: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const FILTERS = [
    { key: "all",        label: "All" },
    { key: "assigned",   label: "Ready to Pick Up" },
    { key: "in_progress",label: "In Progress" },
    { key: "delivered",  label: "Delivered" },
    { key: "completed",  label: "Completed" },
];

function MyTasksPage() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [filter, setFilter] = useState("all");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        setIsClient(true);
        setUser(getAuthUser());
        setToken(getAuthToken());
    }, []);

    const fetchTasks = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${apiUrl}/api/admin/orders/my-tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data || []);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        if (token) fetchTasks();
    }, [token, refreshKey, fetchTasks]);

    if (!isClient || !user) return null;

    if (!hasPermission(user, "my_tasks", "view")) {
        return <div className="p-8"><AccessDenied module="My Tasks" action="view" /></div>;
    }

    const filtered = tasks.filter(t => filter === "all" || t.working_status === filter);

    // Stats
    const stats = {
        total: tasks.length,
        pickup: tasks.filter(t => t.working_status === "assigned").length,
        active: tasks.filter(t => t.working_status === "in_progress").length,
        done:   tasks.filter(t => ["delivered", "completed"].includes(t.working_status)).length,
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <FontAwesomeIcon icon={faClipboardCheck} className="text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-13">Orders assigned to you — pick up, track, and deliver</p>
                </div>
                <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm"
                >
                    <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Assigned", value: stats.total,  color: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10", border: "border-[#a78bfa]/20" },
                    { label: "Ready to Pick Up", value: stats.pickup, color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
                    { label: "In Progress",    value: stats.active, color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
                    { label: "Delivered",      value: stats.done,   color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === f.key
                                ? "bg-[#a78bfa] text-[#1a1025]"
                                : "bg-[#1a1025] border border-[#2d1b4e] text-gray-400 hover:border-[#a78bfa]/50 hover:text-white"
                        }`}
                    >
                        {f.label}
                        {f.key !== "all" && (
                            <span className="ml-1.5 text-xs opacity-70">
                                ({tasks.filter(t => t.working_status === f.key).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faCircleXmark} /> {error}
                </div>
            )}

            {/* Task List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-amber-400 text-4xl mb-4" />
                        <p className="text-gray-500">Loading your tasks...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 bg-[#1a1025] border border-[#2d1b4e] rounded-2xl">
                    <FontAwesomeIcon icon={faClipboardCheck} className="text-gray-700 text-5xl mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No tasks found</p>
                    <p className="text-gray-600 text-sm mt-1">
                        {filter === "all" ? "No orders are assigned to you yet." : `No ${filter.replace("_", " ")} tasks.`}
                    </p>
                </div>
            ) : (
                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#2d1b4e] bg-[#2d1b4e]/40">
                        <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Ref</div>
                        <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</div>
                        <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</div>
                        <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:block">Items</div>
                        <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:block">Assigned</div>
                        <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-[#2d1b4e]">
                        {filtered.map(task => {
                            const cfg = STATUS_CONFIG[task.working_status] || STATUS_CONFIG.unassigned;
                            const orderRef = task.order_id.substring(0, 8).toUpperCase();
                            const deliveredCount = task.items?.filter(i => i.delivery_status === "delivered").length || 0;
                            const totalItems = task.items?.length || 0;

                            return (
                                <Link
                                    key={task.order_id}
                                    href={`/my-tasks/${task.order_id}`}
                                    className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-[#2d1b4e]/30 transition-colors group items-center"
                                >
                                    {/* Order Ref */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0 ${task.working_status === "in_progress" ? "animate-pulse" : ""}`} />
                                        <div>
                                            <p className="text-white font-mono font-bold text-sm">#{orderRef}</p>
                                            <p className="text-gray-600 text-xs">₹{task.total_amount?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Customer */}
                                    <div className="col-span-3 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-[#2d1b4e] border border-[#3b2a5f] flex items-center justify-center flex-shrink-0">
                                            <FontAwesomeIcon icon={faUser} className="text-gray-500 text-[10px]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-gray-200 text-sm font-medium truncate">
                                                {task.user?.first_name} {task.user?.last_name}
                                            </p>
                                            <p className="text-gray-500 text-xs truncate">{task.user?.email}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    <div className="col-span-2 hidden md:flex items-center gap-2">
                                        <span className="text-gray-300 text-sm font-medium">{deliveredCount}/{totalItems}</span>
                                        <span className="text-gray-600 text-xs">delivered</span>
                                        {deliveredCount === totalItems && totalItems > 0 && (
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 text-xs" />
                                        )}
                                    </div>

                                    {/* Assigned */}
                                    <div className="col-span-1 hidden lg:block">
                                        <p className="text-gray-500 text-xs">{formatTime(task.assigned_at)}</p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="col-span-1 flex justify-end">
                                        <div className="w-8 h-8 rounded-lg bg-[#2d1b4e] group-hover:bg-[#a78bfa]/20 border border-[#3b2a5f] group-hover:border-[#a78bfa]/40 flex items-center justify-center transition-all">
                                            <FontAwesomeIcon icon={faChevronRight} className="text-gray-500 group-hover:text-[#a78bfa] text-xs transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default withPermission(MyTasksPage, 'my_tasks', 'view');
