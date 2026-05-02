"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCheck, faTimes, faTrash, faSearch, faFilter, faCircleNotch, faUserCircle, faEye, faSort, faExclamationCircle, faReply, faRobot, faSave, faToggleOn, faToggleOff } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../../components/Button";
import ReviewDetailsModal from "../../../components/ReviewDetailsModal";
import { getAuthToken, getAuthUser, hasPermission } from "../../../utils/auth";
import withPermission from "../../../components/withPermission";
import { useSortableData } from "../../../hooks/useSortableData";

function Reviews() {
    const router = useRouter();
    const user = getAuthUser();
    const canEdit = hasPermission(user, "reviews", "edit");
    const canDelete = hasPermission(user, "reviews", "delete");

    const [reviews, setReviews] = useState([]);
    const [metrics, setMetrics] = useState({ total: 0, lowRating: 0, avgRating: 0 });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [search, setSearch] = useState("");
    const [settings, setSettings] = useState({ auto_reply_text: "", is_auto_reply_enabled: true });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);

    const { items: sortedReviews, requestSort, sortConfig } = useSortableData(reviews);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReviews();
        }, 500);
        return () => clearTimeout(timer);
    }, [filterStatus, search]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchReviews(true);
        }, 10000);
        return () => clearInterval(interval);
    }, [filterStatus, search]);

    const fetchSettings = async () => {
        try {
            setSettingsLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            const res = await axios.get(`${apiUrl}/api/admin/reviews/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(res.data);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!canEdit) return;
        try {
            setSettingsSaving(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            await axios.post(`${apiUrl}/api/admin/reviews/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Settings saved successfully");
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("Failed to save settings");
        } finally {
            setSettingsSaving(false);
        }
    };

    const fetchReviews = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            if (!token) {
                if (!silent) router.push("/login");
                return;
            }
            const res = await axios.get(`${apiUrl}/api/admin/reviews`, {
                params: { status: filterStatus, search },
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(res.data.reviews);
            if (res.data.metrics) setMetrics(res.data.metrics);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        if (!canEdit) return;
        try {
            setActionLoading(id);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            if (!token) { router.push("/login"); return; }
            await axios.patch(`${apiUrl}/api/admin/reviews/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReviews(prev => prev.map(r => r.review_id === id ? { ...r, status: newStatus } : r));
            fetchReviews();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        } finally {
            setActionLoading(null);
        }
    };

    const deleteReview = async (id) => {
        if (!canDelete) return;
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            setActionLoading(id);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            if (!token) { router.push("/login"); return; }
            await axios.delete(`${apiUrl}/api/admin/reviews/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(prev => prev.filter(r => r.review_id !== id));
            fetchReviews();
        } catch (error) {
            console.error("Failed to delete review", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleModalStatusUpdate = async (id, status) => {
        await updateStatus(id, status);
        setSelectedReview(prev => prev ? ({ ...prev, status }) : null);
    };

    const handleModalDelete = async (id) => {
        await deleteReview(id);
        setSelectedReview(null);
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            approved: "bg-green-500/10 text-green-400 border-green-500/20",
            pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            rejected: "bg-red-500/10 text-red-400 border-red-500/20"
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <>
            <AnimatePresence>
                {selectedReview && (
                    <ReviewDetailsModal
                        review={selectedReview}
                        onClose={() => setSelectedReview(null)}
                        onUpdateStatus={handleModalStatusUpdate}
                        onDelete={handleModalDelete}
                    />
                )}
            </AnimatePresence>

            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-white tracking-tight">Reviews & Ratings</h1>
                <p className="text-gray-400 text-sm mt-1">Manage user feedback and moderate content.</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1E1628] p-6 rounded-[18px] border border-[#2d1b4e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2d1b4e] flex items-center justify-center text-white">
                        <FontAwesomeIcon icon={faStar} />
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Reviews</div>
                        <div className="text-2xl font-bold text-white">{metrics.total}</div>
                    </div>
                </div>
                <div className="bg-[#1E1628] p-6 rounded-[18px] border border-[#2d1b4e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Critical (1-2★)</div>
                        <div className="text-2xl font-bold text-white">{metrics.lowRating}</div>
                    </div>
                </div>
                <div className="bg-[#1E1628] p-6 rounded-[18px] border border-[#2d1b4e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                        <FontAwesomeIcon icon={faStar} />
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Average Rating</div>
                        <div className="text-2xl font-bold text-white">{metrics.avgRating}</div>
                    </div>
                </div>
            </div>

            {/* Auto Reply Settings Card */}
            <div className="bg-[#1E1628] p-6 rounded-[22px] border border-[#2d1b4e] mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#a78bfa]/5 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-[#a78bfa]/10 transition-colors" />
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#a78bfa]/10 rounded-lg text-[#a78bfa]">
                                <FontAwesomeIcon icon={faRobot} />
                            </div>
                            <h2 className="text-lg font-bold text-white">Automated Review Assistant</h2>
                            {canEdit && (
                                <button
                                    onClick={() => setSettings(prev => ({ ...prev, is_auto_reply_enabled: !prev.is_auto_reply_enabled }))}
                                    className={`ml-auto md:ml-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${settings.is_auto_reply_enabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
                                >
                                    <FontAwesomeIcon icon={settings.is_auto_reply_enabled ? faToggleOn : faToggleOff} />
                                    {settings.is_auto_reply_enabled ? "ENABLED" : "DISABLED"}
                                </button>
                            )}
                            {!canEdit && (
                                <span className={`ml-auto md:ml-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border cursor-not-allowed opacity-50 ${settings.is_auto_reply_enabled ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                                    <FontAwesomeIcon icon={settings.is_auto_reply_enabled ? faToggleOn : faToggleOff} />
                                    {settings.is_auto_reply_enabled ? "ENABLED" : "DISABLED"}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <textarea
                                value={settings.auto_reply_text}
                                onChange={(e) => canEdit && setSettings(prev => ({ ...prev, auto_reply_text: e.target.value }))}
                                readOnly={!canEdit}
                                placeholder="Enter text to automatically reply to new reviews..."
                                className={`w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-[#a78bfa] min-h-[100px] transition-colors ${!canEdit ? "cursor-not-allowed opacity-60" : ""}`}
                            />
                            <p className="text-[10px] text-gray-500 mt-2 px-1 italic">This text will be sent automatically 3 seconds after a new review is submitted.</p>
                        </div>
                    </div>
                    {canEdit && (
                        <div className="md:w-48 w-full">
                            <button
                                onClick={saveSettings}
                                disabled={settingsSaving}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${settingsSaving ? "bg-[#2d1b4e] text-gray-500" : "bg-[#a78bfa] text-white hover:bg-[#8b5cf6] shadow-lg shadow-[#a78bfa]/10"}`}
                            >
                                <FontAwesomeIcon icon={settingsSaving ? faCircleNotch : faSave} spin={settingsSaving} />
                                {settingsSaving ? "Saving..." : "Save Settings"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#1E1628] p-2.5 rounded-xl border border-[#2d1b4e] mb-6 flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {["all", "approved", "rejected"].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${filterStatus === status
                                ? "bg-[#2d1b4e] text-white shadow-sm"
                                : "text-gray-400 hover:text-white hover:bg-[#2d1b4e]/50"
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                    <input
                        type="text"
                        placeholder="Search product or user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#a78bfa] transition-colors"
                    />
                </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-[#1E1628] rounded-[18px] border border-[#2d1b4e] overflow-hidden">
                <div className="overflow-x-auto custom-scroll">
                    <table className="w-full">
                        <thead className="bg-[#2d1b4e]/50 text-gray-400 text-xs font-bold uppercase tracking-wider text-left">
                            <tr>
                                <th onClick={() => requestSort("product.title")} className="px-4 py-3 cursor-pointer hover:text-[#a78bfa]">
                                    Product <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th onClick={() => requestSort("user.first_name")} className="px-4 py-3 cursor-pointer hover:text-[#a78bfa]">
                                    User <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th onClick={() => requestSort("rating")} className="px-4 py-3 cursor-pointer hover:text-[#a78bfa]">
                                    Rating <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th className="px-4 py-3 w-[250px]">Comment</th>
                                <th onClick={() => requestSort("status")} className="px-4 py-3 cursor-pointer hover:text-[#a78bfa]">
                                    Status <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th onClick={() => requestSort("createdAt")} className="px-4 py-3 cursor-pointer hover:text-[#a78bfa]">
                                    Date <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d1b4e]">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        <FontAwesomeIcon icon={faCircleNotch} spin className="mr-2" /> Loading reviews...
                                    </td>
                                </tr>
                            ) : sortedReviews.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No reviews found.
                                    </td>
                                </tr>
                            ) : (
                                sortedReviews.map(review => (
                                    <tr key={review.review_id} className="hover:bg-[#2d1b4e]/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3 max-w-[200px]">
                                                <div className="w-8 h-8 rounded-lg bg-[#2d1b4e] overflow-hidden flex-shrink-0 relative">
                                                    {review.product?.thumbnail && (
                                                        <Image src={review.product.thumbnail} alt={review.product.title} fill className="object-cover" sizes="48px" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-200 font-medium truncate" title={review.product?.title}>
                                                    {review.product?.title || "Unknown Product"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 max-w-[150px]">
                                                <div className="w-6 h-6 rounded-full bg-[#2d1b4e] flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                                                    <FontAwesomeIcon icon={faUserCircle} />
                                                </div>
                                                <span className="text-sm text-gray-300 truncate">
                                                    {review.user ? `${review.user.first_name} ${review.user.last_name}` : "Deleted User"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex text-yellow-400 text-xs space-x-0.5">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <FontAwesomeIcon key={i} icon={faStar} className={i <= review.rating ? "" : "text-[#2d1b4e]"} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-400 line-clamp-2 w-[250px]">{review.comment}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={review.status || "approved"} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                {/* View Details - always visible */}
                                                <div className="relative inline-block">
                                                    {review.unread_admin && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedReview(review);
                                                            setReviews(prev => prev.map(r => r.review_id === review.review_id ? { ...r, unread_admin: false } : r));
                                                        }}
                                                        className="w-7 h-7 rounded-lg bg-[#2d1b4e] text-white hover:bg-[#a78bfa] transition-colors flex items-center justify-center"
                                                        title="View Details"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                                                    </button>
                                                </div>

                                                {/* Edit/Delete buttons - gated by permission */}
                                                {actionLoading === review.review_id ? (
                                                    <FontAwesomeIcon icon={faCircleNotch} spin className="text-gray-500" />
                                                ) : (
                                                    <>
                                                        {canEdit && review.status !== "approved" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateStatus(review.review_id, "approved")}
                                                                className="w-7 h-7 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors flex items-center justify-center"
                                                                title="Approve"
                                                            >
                                                                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                                            </button>
                                                        )}
                                                        {canEdit && review.status !== "rejected" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateStatus(review.review_id, "rejected")}
                                                                className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors flex items-center justify-center"
                                                                title="Reject"
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteReview(review.review_id)}
                                                                className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                                                                title="Delete"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default withPermission(Reviews, "reviews");
