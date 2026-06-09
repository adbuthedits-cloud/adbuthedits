"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getAuthToken, getAuthUser, hasPermission } from "../../../../utils/auth";
import AccessDenied from "../../../../components/AccessDenied";
import withPermission from "../../../../components/withPermission";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClipboardCheck, faSpinner, faCheckCircle, faCircleXmark, faChevronLeft,
    faUser, faEnvelope, faPhone, faCreditCard, faUpload, faDownload,
    faExternalLinkAlt, faCircleDot, faTruckFast, faBoxOpen, faUserCheck,
    faClipboardList, faClock, faRefresh, faImage, faFile
} from "@fortawesome/free-solid-svg-icons";

const PROGRESS_STAGES = [
    "Research & Planning",
    "Initial Draft",
    "Design In Progress",
    "Revision",
    "Final Review",
    "Ready for Delivery",
];

const ACTION_ICONS = {
    ORDER_PLACED:    { icon: faBoxOpen,       color: "text-blue-400",   bg: "bg-blue-500/10" },
    ASSIGNED:        { icon: faUserCheck,     color: "text-indigo-400", bg: "bg-indigo-500/10" },
    REASSIGNED:      { icon: faUserCheck,     color: "text-orange-400", bg: "bg-orange-500/10" },
    PICKED_UP:       { icon: faCircleDot,     color: "text-amber-400",  bg: "bg-amber-500/10" },
    PROGRESS_UPDATE: { icon: faClipboardList, color: "text-cyan-400",   bg: "bg-cyan-500/10" },
    DELIVERED:       { icon: faTruckFast,     color: "text-green-400",  bg: "bg-green-500/10" },
    COMPLETED:       { icon: faCheckCircle,   color: "text-purple-400", bg: "bg-purple-500/10" },
};

function formatTime(ts) {
    if (!ts) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
}

function formatDate(ts) {
    if (!ts) return "—";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(ts));
}

/** Count media files in customization object */
function countMediaFiles(val) {
    if (!val) return 0;
    let count = 0;
    if (typeof val === "string") {
        if (val.startsWith("http")) count++;
    } else if (Array.isArray(val)) {
        val.forEach(v => { count += countMediaFiles(v); });
    } else if (typeof val === "object" && val !== null) {
        if (val.url) {
            count++;
        } else {
            Object.values(val).forEach(v => { count += countMediaFiles(v); });
        }
    }
    return count;
}


/** Safely convert any value to a renderable string */
function safeStr(val) {
    if (val === null || val === undefined) return "-";
    if (typeof val === "string") return val || "-";
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (typeof val === "object" && !Array.isArray(val)) {
        if (val.code !== undefined && val.number !== undefined) return (val.code + " " + val.number).trim();
        try { return JSON.stringify(val); } catch { return "[object]"; }
    }
    return String(val);
}
/** Render a single customization field value (text, file URL, nested object) */
function CustomizationValue({ val, label }) {
    // Null / empty
    if (val === null || val === undefined || val === "") return <span className="text-gray-600 text-xs italic">Not provided</span>;

    // Boolean / Number — convert to string immediately
    if (typeof val === "boolean" || typeof val === "number") {
        return <span className="text-gray-200 text-sm">{String(val)}</span>;
    }

    if (typeof val === "string") {
        const isUrl = val.startsWith("http");
        const isImage = isUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(val);
        if (isImage) {
            return (
                <div className="mt-1">
                    <img src={val} alt={label} className="max-h-40 rounded-lg border border-[#3b2a5f] object-contain bg-[#130C1C]" />
                    <a href={val} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#a78bfa] hover:underline mt-1">
                        <FontAwesomeIcon icon={faDownload} /> Download
                    </a>
                </div>
            );
        }
        if (isUrl) {
            return (
                <a href={val} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#a78bfa] hover:underline break-all">
                    <FontAwesomeIcon icon={faFile} /> Download File
                </a>
            );
        }
        return <span className="text-gray-200 text-sm">{val}</span>;
    }

    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-gray-600 text-xs italic">Empty</span>;
        return (
            <div className="space-y-1">
                {val.map((v, i) => <CustomizationValue key={i} val={v} label={`${label} [${i + 1}]`} />)}
            </div>
        );
    }

    if (typeof val === "object") {
        const entries = Object.entries(val);
        if (entries.length === 0) return <span className="text-gray-600 text-xs italic">Empty</span>;
        // Phone-like object { code, number }
        if (val.code !== undefined && val.number !== undefined) {
            return <span className="text-gray-200 text-sm">{`${val.code} ${val.number}`.trim()}</span>;
        }
        return (
            <div className="space-y-2 pl-3 border-l border-[#3b2a5f]">
                {entries.map(([k, v]) => (
                    <div key={k}>
                        <p className="text-gray-500 text-xs capitalize">{k.replace(/_/g, " ")}</p>
                        <CustomizationValue val={v} label={k} />
                    </div>
                ))}
            </div>
        );
    }

    // Final fallback — should never reach here but prevents object rendering
    return <span className="text-gray-200 text-sm">{safeStr(val)}</span>;
}

/** Delivery upload for a single item */
function DeliverItemPanel({ item, orderId, token, apiUrl, onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setMsg({ type: "", text: "" });
        try {
            const fd = new FormData();
            fd.append("file", file);
            await axios.post(
                `${apiUrl}/api/admin/orders/${orderId}/items/${item.order_item_id}/deliver`,
                fd,
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
            );
            setMsg({ type: "success", text: "File delivered! Customer will receive an email shortly." });
            setFile(null);
            setTimeout(() => { setMsg({ type: "", text: "" }); onSuccess(); }, 2500);
        } catch (err) {
            setMsg({ type: "error", text: err.response?.data?.error || "Upload failed." });
        } finally {
            setUploading(false);
        }
    };

    if (item.delivery_status === "delivered") {
        return (
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                <FontAwesomeIcon icon={faCheckCircle} />
                Delivered · Expires {formatDate(item.download_expires_at)}
            </div>
        );
    }

    return (
        <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-[#2d1b4e] border border-[#3b2a5f] border-dashed rounded-lg hover:border-[#a78bfa]/50 transition-all text-xs text-gray-400">
                <FontAwesomeIcon icon={faUpload} className="text-[#a78bfa]" />
                {file ? file.name : "Choose delivery file (image, video, zip)"}
                <input type="file" className="hidden" accept="image/*,video/*,.zip,.rar" onChange={e => setFile(e.target.files[0])} />
            </label>
            {file && (
                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                >
                    {uploading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTruckFast} />}
                    {uploading ? "Uploading & Sending Email..." : "Deliver Content"}
                </button>
            )}
            {msg.text && (
                <p className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${msg.type === "success" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    <FontAwesomeIcon icon={msg.type === "success" ? faCheckCircle : faCircleXmark} />
                    {msg.text}
                </p>
            )}
        </div>
    );
}

function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.orderId;

    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    // Progress stage state
    const [stage, setStage] = useState("");
    const [stageNote, setStageNote] = useState("");
    const [submittingStage, setSubmittingStage] = useState(false);
    const [stageMsg, setStageMsg] = useState({ type: "", text: "" });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        setIsClient(true);
        setUser(getAuthUser());
        setToken(getAuthToken());
    }, []);

    const fetchOrder = useCallback(async () => {
        if (!token || !orderId) return;
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${apiUrl}/api/admin/orders/${orderId}/task-detail`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrder(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load task details.");
        } finally {
            setLoading(false);
        }
    }, [token, orderId, apiUrl]);

    useEffect(() => {
        if (token) fetchOrder();
    }, [token, refreshKey, fetchOrder]);

    const [pickingUp, setPickingUp] = useState(false);

    const handlePickup = async () => {
        if (!token || !orderId) return;
        setPickingUp(true);
        try {
            await axios.post(`${apiUrl}/api/admin/orders/${orderId}/pickup`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRefreshKey(k => k + 1);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to accept order.");
        } finally {
            setPickingUp(false);
        }
    };

    const handleStageSubmit = async () => {
        if (!stage) return;
        setSubmittingStage(true);
        setStageMsg({ type: "", text: "" });
        try {
            await axios.post(
                `${apiUrl}/api/admin/orders/${orderId}/update-progress`,
                { stage, notes: stageNote },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStageMsg({ type: "success", text: `Stage updated to "${stage}"` });
            setStage(""); setStageNote("");
            setTimeout(() => { setStageMsg({ type: "", text: "" }); setRefreshKey(k => k + 1); }, 1500);
        } catch (err) {
            setStageMsg({ type: "error", text: err.response?.data?.error || "Failed to update stage." });
        } finally {
            setSubmittingStage(false);
        }
    };

    if (!isClient || !user) return null;
    if (!hasPermission(user, "my_tasks", "view")) return <div className="p-8"><AccessDenied module="My Tasks" action="view" /></div>;

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="text-center">
                <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-4xl mb-4" />
                <p className="text-gray-500">Loading task details...</p>
            </div>
        </div>
    );

    if (error || !order) return (
        <div className="max-w-lg mx-auto text-center py-24">
            <FontAwesomeIcon icon={faCircleXmark} className="text-red-400 text-5xl mb-4" />
            <p className="text-white font-bold text-xl mb-2">{error || "Task not found"}</p>
            <Link href="/my-tasks" className="text-[#a78bfa] text-sm hover:underline">← Back to My Tasks</Link>
        </div>
    );

    const orderRef = order.order_id.substring(0, 8).toUpperCase();
    const isSuperAdmin = user?.is_super_admin === true;
    const canDeliver = hasPermission(user, "orders", "edit") || isSuperAdmin;

    return (
        <div className="w-full space-y-6">
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between">
                <Link href="/my-tasks" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" /> Back to My Tasks
                </Link>
                <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#2d1b4e] border border-[#3b2a5f] text-gray-400 rounded-lg text-xs hover:text-white transition-all"
                >
                    <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Header Card */}
            <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-mono font-bold text-2xl">#{orderRef}</span>
                            <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                                order.working_status === "in_progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                order.working_status === "delivered"   ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                order.working_status === "assigned"    ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                "bg-gray-500/10 text-gray-400 border-gray-500/20"
                            }`}>
                                {order.working_status?.replace("_", " ").toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">Assigned: {formatTime(order.assigned_at)} · Picked up: {formatTime(order.picked_up_at)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {order.working_status === "assigned" && (
                            <button
                                onClick={handlePickup}
                                disabled={pickingUp}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-[#1a1025] font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all shrink-0"
                            >
                                {pickingUp ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                )}
                                Accept Order
                            </button>
                        )}
                        <div className="text-right">
                            <p className="text-gray-500 text-xs mb-1">Order Total</p>
                            <p className="text-white font-bold text-xl">₹{order.total_amount?.toLocaleString()}</p>
                            {order.discount_amount > 0 && <p className="text-green-400 text-xs">-₹{order.discount_amount?.toLocaleString()} discount</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Customer Info */}
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-5">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Customer Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { icon: faUser,       label: "Name",    val: `${order.user?.first_name || ""} ${order.user?.last_name || ""}`.trim() },
                                { icon: faEnvelope,   label: "Email",   val: order.user?.email },
                                { icon: faPhone,      label: "Phone",   val: safeStr(order.user?.phone_number) },
                                { icon: faCreditCard, label: "Payment", val: order.payment ? `${order.payment.mode?.toUpperCase()} · ${order.payment.status}` : "—" },
                            ].map(info => (
                                <div key={info.label} className="flex items-start gap-3 bg-[#2d1b4e]/40 rounded-xl p-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#2d1b4e] flex items-center justify-center flex-shrink-0">
                                        <FontAwesomeIcon icon={info.icon} className="text-gray-500 text-xs" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">{info.label}</p>
                                        <p className="text-gray-200 text-sm font-medium">{safeStr(info.val)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-5">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Order Items & Customization</h2>
                        <div className="space-y-5">
                            {order.items?.map((item, idx) => (
                                <div key={item.order_item_id} className="border border-[#2d1b4e] rounded-xl overflow-hidden">
                                    {/* Item Header */}
                                    <div className="flex items-center gap-4 p-4 bg-[#2d1b4e]/30">
                                        {item.product?.thumbnail ? (
                                            <img src={item.product.thumbnail} alt={item.product.title} className="w-14 h-14 rounded-xl object-cover border border-[#3b2a5f]" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-[#2d1b4e] flex items-center justify-center border border-[#3b2a5f]">
                                                <FontAwesomeIcon icon={faImage} className="text-gray-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-white font-semibold text-sm">{item.product?.title || `Item #${idx + 1}`}</p>
                                                {item.product?.products_id && (
                                                    <Link
                                                        href={`/products/view/${item.product.products_id}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 rounded-full hover:bg-[#a78bfa]/20 transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faExternalLinkAlt} /> View Product
                                                    </Link>
                                                )}
                                            </div>
                                            {item.product?.internal_sku && (
                                                <p className="text-xs text-purple-400 font-mono mt-0.5">SKU: {item.product.internal_sku}</p>
                                            )}
                                            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                                                <span>Qty: {item.quantity} · ₹{item.price_at_purchase?.toLocaleString()}</span>
                                                {countMediaFiles(item.customization) > 0 && (
                                                    <span className="inline-flex items-center gap-1 bg-[#a78bfa]/10 text-[#a78bfa] px-2 py-0.5 rounded-md border border-[#a78bfa]/20 font-medium text-[9px]">
                                                        <FontAwesomeIcon icon={faImage} /> {countMediaFiles(item.customization)} Media
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 ${
                                            item.delivery_status === "delivered"
                                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        }`}>
                                            {item.delivery_status === "delivered" ? "✓ Delivered" : "Pending"}
                                        </span>
                                    </div>

                                    {/* Customization */}
                                    {(() => {
                                        const rawCust = item.customization;
                                        let parsedCust = rawCust;
                                        if (typeof rawCust === "string") {
                                            try { parsedCust = JSON.parse(rawCust); } catch(e) {}
                                        }
                                        const cust = parsedCust && typeof parsedCust === "object" ? parsedCust : null;
                                        if (!cust || Object.keys(cust).length === 0) return null;
                                        return (
                                            <div className="p-4 border-t border-[#2d1b4e]">
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Form Data</p>
                                                <div className="space-y-3">
                                                    {Object.entries(cust).map(([key, val]) => (
                                                        <div key={key} className="bg-[#130C1C] rounded-lg p-3">
                                                            <p className="text-gray-500 text-xs capitalize mb-1">{key.replace(/_/g, " ")}</p>
                                                            <CustomizationValue val={val} label={key} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Delivery Panel */}
                                    {canDeliver && (
                                        <div className="p-4 border-t border-[#2d1b4e] bg-[#130C1C]/50">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Delivery</p>
                                            <DeliverItemPanel
                                                item={item}
                                                orderId={order.order_id}
                                                token={token}
                                                apiUrl={apiUrl}
                                                onSuccess={() => setRefreshKey(k => k + 1)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress Stage Update */}
                    {order.working_status === "in_progress" && (
                        <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-5">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Update Work Stage</h2>
                            <p className="text-xs text-gray-500 mb-3">Select the current stage of work. This updates the internal timeline only — no email is sent to the customer.</p>
                            <div className="space-y-3">
                                <select
                                    value={stage}
                                    onChange={e => setStage(e.target.value)}
                                    className="w-full bg-[#2d1b4e] border border-[#3b2a5f] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#a78bfa] appearance-none"
                                >
                                    <option value="">— Select Progress Stage —</option>
                                    {PROGRESS_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <textarea
                                    value={stageNote}
                                    onChange={e => setStageNote(e.target.value)}
                                    placeholder="Optional note (e.g. Completed banner layout, awaiting client font files...)"
                                    rows={2}
                                    className="w-full bg-[#2d1b4e] border border-[#3b2a5f] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#a78bfa] placeholder-gray-600 resize-none"
                                />
                                <button
                                    onClick={handleStageSubmit}
                                    disabled={!stage || submittingStage}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#a78bfa] hover:bg-[#9061f9] text-[#1a1025] rounded-xl text-sm font-bold disabled:opacity-40 transition-all"
                                >
                                    {submittingStage ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faClipboardCheck} />}
                                    Update Stage
                                </button>
                                {stageMsg.text && (
                                    <p className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${stageMsg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                        <FontAwesomeIcon icon={stageMsg.type === "success" ? faCheckCircle : faCircleXmark} />
                                        {stageMsg.text}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Timeline */}
                <div className="space-y-6">
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl p-5 sticky top-24">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Order Timeline</h2>
                        {!order.timeline?.length ? (
                            <div className="text-center py-8">
                                <FontAwesomeIcon icon={faClock} className="text-gray-700 text-3xl mb-2" />
                                <p className="text-gray-600 text-sm">No events yet.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-4 top-0 bottom-0 w-px bg-[#2d1b4e]" />
                                <div className="space-y-4">
                                    {order.timeline.map(event => {
                                        const cfg = ACTION_ICONS[event.action] || ACTION_ICONS.PROGRESS_UPDATE;
                                        return (
                                            <div key={event.timeline_id} className="flex gap-3 relative pl-1">
                                                <div className={`w-8 h-8 rounded-full ${cfg.bg} border border-[#2d1b4e] flex items-center justify-center flex-shrink-0 z-10`}>
                                                    <FontAwesomeIcon icon={cfg.icon} className={`text-xs ${cfg.color}`} />
                                                </div>
                                                <div className="flex-1 pb-3">
                                                    <p className="text-white text-xs font-semibold">{event.status_label}</p>
                                                    {event.actor_name && <p className="text-gray-500 text-xs">by {event.actor_name}</p>}
                                                    {event.notes && <p className="text-gray-400 text-xs mt-1 bg-[#2d1b4e]/40 rounded-lg px-2 py-1 italic">{event.notes}</p>}
                                                    <p className="text-gray-600 text-xs mt-1">{formatTime(event.event_at)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withPermission(TaskDetailPage, "my_tasks", "view");
