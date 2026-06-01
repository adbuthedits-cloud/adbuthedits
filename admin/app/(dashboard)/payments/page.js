"use client";
import withPermission from "../../../components/withPermission";

import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faSearch, faSort, faWallet, faCheckCircle, faTimesCircle, 
    faClock, faBox, faTimes, faUndo, faBan, faCoins, faUser, 
    faEnvelope, faPhone, faCalendarAlt, faCreditCard, faChevronRight,
    faClipboard, faArrowRight, faDownload, faFileAlt, faImage, faInfoCircle,
    faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken } from "../../../utils/auth";
import { SlideIn, TableRowFade } from "../../../components/Animations";

function Payments() {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        collectedAmount: 0,
        capturedCount: 0,
        refundedAmount: 0,
        refundedCount: 0,
        failedCount: 0
    });
    
    // Filters & Navigation
    const [statusFilter, setStatusFilter] = useState("all"); // all, created, captured, refunded, failed
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState("all"); // all, today, 7days, 30days, custom
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [methodFilter, setMethodFilter] = useState("all"); // all, card, upi, netbanking, wallet
    
    // Side Panel detail view
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    
    // Refund / Reject Sub-forms inside Detail Panel
    const [showRefundForm, setShowRefundForm] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [submittingAction, setSubmittingAction] = useState(false);

    useEffect(() => {
        fetchPaymentsData();
        fetchStatsData();
    }, [statusFilter, dateRange, startDate, endDate, methodFilter]);

    // Helpers to build API query params
    const getQueryString = () => {
        let params = [];
        
        // Date filters
        if (dateRange === "today") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            params.push(`from=${today.toISOString()}`);
        } else if (dateRange === "7days") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            params.push(`from=${sevenDaysAgo.toISOString()}`);
        } else if (dateRange === "30days") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            params.push(`from=${thirtyDaysAgo.toISOString()}`);
        } else if (dateRange === "custom" && startDate && endDate) {
            params.push(`from=${new Date(startDate).toISOString()}`);
            params.push(`to=${new Date(endDate).toISOString()}`);
        }

        if (statusFilter && statusFilter !== "all") {
            params.push(`status=${statusFilter}`);
        }
        if (methodFilter && methodFilter !== "all") {
            params.push(`method=${methodFilter}`);
        }

        return params.length > 0 ? "?" + params.join("&") : "";
    };

    const fetchPaymentsData = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }
            
            let url = `${apiUrl}/api/admin/payments${getQueryString()}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPayments(res.data.payments || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch payments", error);
            setLoading(false);
        }
    };

    const fetchStatsData = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            let url = `${apiUrl}/api/admin/payments/stats${getQueryString()}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    // Filter payments client-side for immediate search responsiveness
    const filteredPayments = payments.filter(p =>
        p.id?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.contact?.includes(search) ||
        (p.user?.name && p.user.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.localPayment?.order?.order_id && p.localPayment.order.order_id.toLowerCase().includes(search.toLowerCase()))
    );

    const handleSelectPayment = (payment) => {
        setSelectedPayment(payment);
        setShowDetailPanel(true);
        setShowRefundForm(false);
        setShowRejectForm(false);
        setRefundAmount(payment.amount - (payment.amount_refunded || 0));
        setAdminNotes("");
        setRejectionReason("");
    };

    const processRefund = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            const res = await axios.post(`${apiUrl}/api/admin/payments/${selectedPayment.id}/refund`, {
                amount: refundAmount,
                adminNotes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert("Refund processed successfully!");
                setShowRefundForm(false);
                setShowDetailPanel(false);
                fetchPaymentsData();
                fetchStatsData();
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to process refund");
        } finally {
            setSubmittingAction(false);
        }
    };

    const rejectRefund = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            const res = await axios.post(`${apiUrl}/api/admin/payments/${selectedPayment.id}/reject-refund`, {
                rejectionReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert("Refund request rejected.");
                setShowRejectForm(false);
                setShowDetailPanel(false);
                fetchPaymentsData();
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to reject refund request");
        } finally {
            setSubmittingAction(false);
        }
    };

    const clearAllFilters = () => {
        setStatusFilter("all");
        setSearch("");
        setDateRange("all");
        setStartDate("");
        setEndDate("");
        setMethodFilter("all");
    };

    const StatusBadge = ({ status }) => {
        let styles = "bg-gray-500/10 text-gray-400 border border-gray-500/20";
        if (status === "captured" || status === "success") {
            styles = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"; 
        } else if (status === "refunded") {
            styles = "bg-purple-500/10 text-purple-400 border border-purple-500/20"; 
        } else if (status === "failed") {
            styles = "bg-rose-500/10 text-rose-400 border border-rose-500/20"; 
        } else if (status === "created" || status === "authorized") {
            styles = "bg-amber-500/10 text-amber-400 border border-amber-500/20"; 
        }

        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide capitalize ${styles}`}>
                {status === "captured" ? "Captured" : status}
            </span>
        );
    };

    return (
        <div className="min-h-screen text-gray-200">
            {/* Header Title */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Payments Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Manage Razorpay transactions, refunds, and customer change requests.</p>
            </div>

            {/* Collected, Refunds, Failed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Collected Amount Card */}
                <div className="bg-[#1E1628] p-6 rounded-2xl border border-[#2d1b4e] shadow-lg flex items-center justify-between group hover:border-[#a78bfa]/40 transition-all duration-300">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Collected Amount</p>
                        <p className="text-3xl font-black text-white mt-2">₹{stats.collectedAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-gray-500 mt-1">from {stats.capturedCount} captured payments</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                        <FontAwesomeIcon icon={faCoins} className="text-lg" />
                    </div>
                </div>

                {/* Refunds Card */}
                <div className="bg-[#1E1628] p-6 rounded-2xl border border-[#2d1b4e] shadow-lg flex items-center justify-between group hover:border-[#a78bfa]/40 transition-all duration-300">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Refunds</p>
                        <p className="text-3xl font-black text-white mt-2">₹{stats.refundedAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{stats.refundedCount} processed refunds</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                        <FontAwesomeIcon icon={faUndo} className="text-lg" />
                    </div>
                </div>

                {/* Failed Card */}
                <div className="bg-[#1E1628] p-6 rounded-2xl border border-[#2d1b4e] shadow-lg flex items-center justify-between group hover:border-[#a78bfa]/40 transition-all duration-300">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Failed Payments</p>
                        <p className="text-3xl font-black text-white mt-2">{stats.failedCount}</p>
                        <p className="text-[10px] text-gray-500 mt-1">unsuccessful transaction attempts</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400">
                        <FontAwesomeIcon icon={faBan} className="text-lg" />
                    </div>
                </div>
            </div>

            <div className="mb-6 border-b border-[#2d1b4e]" />
                    {/* Sub-tabs & Filter Row */}
                    <div className="bg-[#1E1628] p-5 rounded-2xl border border-[#2d1b4e] mb-6 space-y-4">
                        {/* Sub Tabs Status Pills */}
                        <div className="flex flex-wrap gap-2 pb-2 border-b border-[#2d1b4e]/50">
                            {["all", "created", "captured", "refunded", "failed"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${statusFilter === status ? "bg-[#a78bfa] text-[#130C1C]" : "bg-[#2d1b4e] text-gray-400 hover:text-white hover:bg-[#3b2a5f]"}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Search & Select dropdowns */}
                        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                            {/* Search bar */}
                            <div className="relative w-full lg:w-[350px]">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                                    <FontAwesomeIcon icon={faSearch} className="text-xs" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by Payment ID, Email, Phone..."
                                    value={search}
                                    onChange={handleSearchChange}
                                    className="w-full pl-9 pr-4 py-2 bg-[#2d1b4e] text-xs text-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#a78bfa] border border-transparent focus:border-[#a78bfa]/20 placeholder-gray-500"
                                />
                            </div>

                            {/* Dropdown filters */}
                            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                                {/* Date filter */}
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="bg-[#2d1b4e] text-xs text-gray-300 font-bold px-3 py-2 rounded-xl border border-transparent outline-none focus:border-[#a78bfa]/20 cursor-pointer"
                                >
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                    <option value="custom">Custom Range</option>
                                </select>

                                {/* Method filter */}
                                <select
                                    value={methodFilter}
                                    onChange={(e) => setMethodFilter(e.target.value)}
                                    className="bg-[#2d1b4e] text-xs text-gray-300 font-bold px-3 py-2 rounded-xl border border-transparent outline-none focus:border-[#a78bfa]/20 cursor-pointer"
                                >
                                    <option value="all">All Methods</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="netbanking">Netbanking</option>
                                    <option value="wallet">Wallet</option>
                                </select>

                                {/* Clear Filters */}
                                <button 
                                    onClick={clearAllFilters}
                                    className="px-4 py-2 border border-[#2d1b4e] hover:bg-[#2d1b4e] text-xs font-bold text-gray-400 hover:text-white rounded-xl transition-all"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Custom Date Inputs if custom range selected */}
                        {dateRange === "custom" && (
                            <div className="flex flex-wrap gap-3 pt-2">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>From:</span>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-[#2d1b4e] text-gray-200 border border-transparent rounded-lg p-1.5 font-bold outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>To:</span>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-[#2d1b4e] text-gray-200 border border-transparent rounded-lg p-1.5 font-bold outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table View */}
                    <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#2d1b4e] border-b border-[#3b2a5f] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4">Payment ID</th>
                                        <th className="px-5 py-4">Order ID</th>
                                        <th className="px-5 py-4">Bank RRN / Method</th>
                                        <th className="px-5 py-4">Customer details</th>
                                        <th className="px-5 py-4">Created on</th>
                                        <th className="px-5 py-4">Amount</th>
                                        <th className="px-5 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2d1b4e]/60 text-xs">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                                                <div className="flex justify-center items-center gap-2.5">
                                                    <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-base" />
                                                    <span>Fetching payments from Razorpay...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredPayments.length > 0 ? (
                                        filteredPayments.map((p) => {
                                            const rrn = p.acquirer_data?.rrn || p.acquirer_data?.bank_transaction_id || "—";
                                            const name = p.user?.name || "Anonymous";
                                            const formattedDate = new Intl.DateTimeFormat('en-IN', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            }).format(new Date(p.created_at));
                                            
                                            // Identify if refund requested
                                            const refundReq = p.localPayment?.refund_request_status === 'pending';

                                            return (
                                                <tr 
                                                    key={p.id} 
                                                    onClick={() => handleSelectPayment(p)}
                                                    className="hover:bg-[#2d1b4e]/30 cursor-pointer transition-all border-b border-[#2d1b4e]/40"
                                                >
                                                    <td className="px-5 py-4 font-mono text-[11px] text-[#a78bfa] font-bold">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{p.id}</span>
                                                            {refundReq && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="Refund Request Pending" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 font-mono text-[11px] text-[#a78bfa] font-bold">
                                                        {p.localPayment?.order?.order_id ? (
                                                            <Link 
                                                                href={`/orders/${p.localPayment.order.order_id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="hover:underline hover:text-[#c4b5fd] transition-colors"
                                                            >
                                                                #{p.localPayment.order.order_id.slice(0, 8).toUpperCase()}
                                                            </Link>
                                                        ) : p.order_id ? (
                                                            <span className="text-gray-500 font-normal">{p.order_id}</span>
                                                        ) : (
                                                            <span className="text-gray-500 font-normal">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-semibold text-white">{rrn}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{p.method}</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-white">{name}</div>
                                                        <div className="text-[10px] text-gray-500">{p.email || "—"}</div>
                                                        <div className="text-[10px] text-gray-500">{p.contact || "—"}</div>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-400 font-semibold">{formattedDate}</td>
                                                    <td className="px-5 py-4 font-extrabold text-white">₹{p.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-5 py-4">
                                                        <StatusBadge status={p.status} />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-16 text-center">
                                                <div className="text-gray-600 text-3xl mb-2">
                                                    <FontAwesomeIcon icon={faWallet} />
                                                </div>
                                                <p className="text-gray-500 font-bold">No payments matching current filters</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

            {/* SIDE PANEL: Complete Details & Refund Processing */}
            <AnimatePresence>
                {showDetailPanel && selectedPayment && (
                    <>
                        {/* Overlay backdrop */}
                        <div 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" 
                            onClick={() => setShowDetailPanel(false)}
                        />
                        
                        {/* Sliding Panel */}
                        <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-[#130C1C] border-l border-[#2d1b4e] shadow-2xl z-50 overflow-y-auto custom-scroll flex flex-col">
                            {/* Panel Header */}
                            <div className="p-6 bg-[#1a1025] border-b border-[#2d1b4e] flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm font-bold text-[#a78bfa]">{selectedPayment.id}</span>
                                        <StatusBadge status={selectedPayment.status} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Transaction details from Razorpay</p>
                                </div>
                                <button 
                                    onClick={() => setShowDetailPanel(false)}
                                    className="w-9 h-9 rounded-full bg-[#2d1b4e] hover:bg-[#3b2a5f] text-gray-400 hover:text-white flex items-center justify-center transition-all"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Panel Body */}
                            <div className="p-6 space-y-6 flex-grow">
                                {/* Top Amount Card */}
                                <div className="p-5 bg-gradient-to-br from-[#2d1b4e]/40 to-[#1a1025] rounded-2xl border border-[#2d1b4e] flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Payment Amount</p>
                                        <p className="text-3xl font-black text-white mt-1">₹{selectedPayment.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                        {selectedPayment.amount_refunded > 0 && (
                                            <p className="text-[10px] text-purple-400 font-semibold mt-1">
                                                ₹{selectedPayment.amount_refunded} refunded ({selectedPayment.refund_status})
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Method</p>
                                        <p className="text-sm font-bold text-white capitalize mt-1">{selectedPayment.method}</p>
                                    </div>
                                </div>

                                {/* Customer Profile */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-[#2d1b4e]/60">
                                        <FontAwesomeIcon icon={faUser} className="text-[#a78bfa]" /> Customer Info
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 bg-[#1a1025] border border-[#2d1b4e] rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Registered User</p>
                                            <p className="text-white font-semibold mt-1">{selectedPayment.user?.name || "Guest Checkout"}</p>
                                        </div>
                                        <div className="p-3 bg-[#1a1025] border border-[#2d1b4e] rounded-xl">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">User Email</p>
                                            <p className="text-white font-semibold mt-1">{selectedPayment.email || "—"}</p>
                                        </div>
                                        <div className="p-3 bg-[#1a1025] border border-[#2d1b4e] rounded-xl sm:col-span-2">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">User Phone</p>
                                            <p className="text-white font-semibold mt-1">{selectedPayment.contact || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Connected Order Details */}
                                {selectedPayment.localPayment?.order ? (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-[#2d1b4e]/60">
                                            <FontAwesomeIcon icon={faBox} className="text-emerald-400" /> Order Details
                                        </h4>
                                        <div className="p-4 bg-[#1a1025] border border-[#2d1b4e] rounded-2xl space-y-4">
                                            <div className="flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Order ID</p>
                                                    <Link 
                                                        href={`/orders/${selectedPayment.localPayment.order.order_id}`}
                                                        className="text-[#a78bfa] font-bold font-mono hover:underline block mt-0.5"
                                                    >
                                                        #{selectedPayment.localPayment.order.order_id.slice(0, 8).toUpperCase()}...
                                                    </Link>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Order Status</p>
                                                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold capitalize text-[10px]">
                                                        {selectedPayment.localPayment.order.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order items */}
                                            <div className="space-y-3 border-t border-[#2d1b4e]/60 pt-3">
                                                {selectedPayment.localPayment.order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex gap-3 text-xs items-center">
                                                        <div className="w-10 h-10 bg-[#130C1C] border border-[#2d1b4e] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                            {item.product?.thumbnail ? (
                                                                <img src={item.product.thumbnail} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <FontAwesomeIcon icon={faBox} className="text-gray-500 text-sm" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-white truncate">{item.product?.title || "Deleted Product"}</p>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">Qty: {item.quantity} · Price: ₹{item.price_at_purchase?.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center text-xs text-rose-300 flex items-center gap-2 justify-center">
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <span>No matching order record exists in local database (Failed/Abandoned Checkout)</span>
                                    </div>
                                )}

                                {/* Customer Refund Request details */}
                                {selectedPayment.localPayment?.refund_request_status && selectedPayment.localPayment.refund_request_status !== 'none' && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-[#2d1b4e]/60">
                                            <FontAwesomeIcon icon={faFileAlt} className="text-blue-400" /> Customer Refund Request
                                        </h4>
                                        <div className="bg-[#1a1025] border border-blue-500/20 rounded-2xl p-4 space-y-3 text-xs">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Request Status</p>
                                                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        selectedPayment.localPayment.refund_request_status === 'pending' ? 'bg-blue-500/10 text-blue-400' :
                                                        selectedPayment.localPayment.refund_request_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                        {selectedPayment.localPayment.refund_request_status}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Requested On</p>
                                                    <p className="text-white mt-0.5">{new Date(selectedPayment.localPayment.refund_requested_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="border-t border-[#2d1b4e]/60 pt-3">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Reason</p>
                                                <p className="text-white font-semibold mt-0.5">{selectedPayment.localPayment.refund_request_reason}</p>
                                            </div>
                                            
                                            {selectedPayment.localPayment.refund_request_details && (
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Additional Details</p>
                                                    <p className="text-gray-300 mt-0.5 whitespace-pre-wrap">{selectedPayment.localPayment.refund_request_details}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Admin Action Section */}
                                {selectedPayment.status === "captured" && (
                                    <div className="pt-4 border-t border-[#2d1b4e] space-y-4">
                                        {!showRefundForm && !showRejectForm ? (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setShowRefundForm(true)}
                                                    className="flex-1 py-3 bg-[#a78bfa] hover:bg-[#906ef5] text-[#130C1C] font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg"
                                                >
                                                    <FontAwesomeIcon icon={faUndo} />
                                                    Process Refund
                                                </button>
                                                
                                                {selectedPayment.localPayment?.refund_request_status === 'pending' && (
                                                    <button
                                                        onClick={() => setShowRejectForm(true)}
                                                        className="flex-1 py-3 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faBan} />
                                                        Reject Request
                                                    </button>
                                                )}
                                            </div>
                                        ) : showRefundForm ? (
                                            /* Refund sub-form */
                                            <form onSubmit={processRefund} className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] p-4 space-y-4 text-xs">
                                                <div className="flex justify-between items-center pb-2 border-b border-[#2d1b4e]/60">
                                                    <h5 className="font-bold text-white flex items-center gap-1.5">
                                                        <FontAwesomeIcon icon={faUndo} className="text-[#a78bfa]" />
                                                        Refund Transaction
                                                    </h5>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowRefundForm(false)}
                                                        className="text-gray-400 hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Refund Amount (INR)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        max={selectedPayment.amount - (selectedPayment.amount_refunded || 0)}
                                                        required
                                                        value={refundAmount}
                                                        onChange={(e) => setRefundAmount(e.target.value)}
                                                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-[#a78bfa]/30"
                                                    />
                                                    <p className="text-[10px] text-gray-500 mt-1">Maximum refundable: ₹{selectedPayment.amount - (selectedPayment.amount_refunded || 0)}</p>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Internal Admin Notes / Reasons</label>
                                                    <textarea 
                                                        placeholder="Notes describing the reason for refund..."
                                                        rows="3"
                                                        value={adminNotes}
                                                        onChange={(e) => setAdminNotes(e.target.value)}
                                                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl p-3 text-xs outline-none focus:border-[#a78bfa]/30 resize-none text-gray-200"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submittingAction}
                                                    className="w-full py-3 bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {submittingAction ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUndo} />}
                                                    Confirm and Process Refund
                                                </button>
                                            </form>
                                        ) : (
                                            /* Reject sub-form */
                                            <form onSubmit={rejectRefund} className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] p-4 space-y-4 text-xs">
                                                <div className="flex justify-between items-center pb-2 border-b border-[#2d1b4e]/60">
                                                    <h5 className="font-bold text-white flex items-center gap-1.5">
                                                        <FontAwesomeIcon icon={faBan} className="text-red-400" />
                                                        Reject Refund Request
                                                    </h5>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowRejectForm(false)}
                                                        className="text-gray-400 hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Rejection Reason (Emailed to Customer)</label>
                                                    <textarea 
                                                        placeholder="Provide the reason for rejecting this refund request..."
                                                        rows="3"
                                                        required
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        className="w-full bg-[#130C1C] border border-[#2d1b4e] rounded-xl p-3 text-xs outline-none focus:border-[#a78bfa]/30 resize-none text-gray-200"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submittingAction}
                                                    className="w-full py-3 bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {submittingAction ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faBan} />}
                                                    Reject Refund Request
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default withPermission(Payments, "payments");
