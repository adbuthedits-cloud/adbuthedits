"use client";
import withPermission from "../../../components/withPermission";

import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSort, faWallet, faCheckCircle, faTimesCircle, faClock, faBox } from "@fortawesome/free-solid-svg-icons";
import { useSortableData } from "../../../hooks/useSortableData";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthToken } from "../../../utils/auth";
import { SlideIn, TableRowFade } from "../../../components/Animations";

function Payments() {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }
            const res = await axios.get(`${apiUrl}/api/admin/payments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch payments", error);
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        let styles = "bg-gray-100 text-gray-600";
        let icon = faClock;

        if (status === "completed" || status === "success") {
            styles = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"; 
            icon = faCheckCircle;
        } else if (status === "failed") {
            styles = "bg-rose-500/10 text-rose-400 border border-rose-500/20"; 
            icon = faTimesCircle;
        } else if (status === "pending") {
            styles = "bg-amber-500/10 text-amber-400 border border-amber-500/20"; 
            icon = faClock;
        }

        return (
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 w-fit ${styles}`}>
                <FontAwesomeIcon icon={icon} className="text-[10px]" />
                <span className="capitalize">{status}</span>
            </span>
        );
    };

    const filteredPayments = payments.filter(p =>
        p.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.order_id?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const { items: sortedPayments, requestSort } = useSortableData(filteredPayments);

    const [visibleCount, setVisibleCount] = useState(20);
    const visiblePayments = sortedPayments.slice(0, visibleCount);

    const loadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">Payments</h1>
                    <p className="text-gray-400 text-sm mt-1">Monitor all financial transactions and payment history.</p>
                </div>
            </div>

            <div className="bg-[#1E1628] p-2.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-[#2d1b4e] mb-6">
                <div className="relative w-full md:w-[400px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-sm" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Payment ID, Order ID, or Email..."
                        className="w-full pl-11 pr-4 py-2.5 bg-[#2d1b4e] text-sm text-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#a78bfa]/50 transition-all placeholder-gray-500 border border-transparent focus:border-[#a78bfa]/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[#1E1628] rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] overflow-hidden">
                <div className="overflow-x-auto custom-scroll">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#2d1b4e] border-b border-[#3b2a5f]">
                            <tr>
                                <th onClick={() => requestSort("payment_id")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">ID <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort("razorpay_payment_id")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">RZP ID <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort("order.order_id")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Order ID <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort("user.email")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">User <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort("amount")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Amount <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort("mode")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Mode <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort("status")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Status <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort("createdAt")} className="cursor-pointer hover:text-[#a78bfa] px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Date <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d1b4e]">
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#7C3AED] border-t-transparent"></div>
                                                Loading payments...
                                            </div>
                                        </td>
                                    </tr>
                                ) : visiblePayments.length > 0 ? (
                                    visiblePayments.map((payment, index) => (
                                        <TableRowFade key={payment.payment_id} index={index}>
                                            <td className="px-4 py-3 font-mono text-[11px] text-gray-400">
                                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigator.clipboard.writeText(payment.payment_id)} title="Click to copy Payment ID">
                                                    <span className="truncate max-w-[80px]">{payment.payment_id}</span>
                                                    <FontAwesomeIcon icon={faBox} className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-white font-semibold">
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-[100px]" title={payment.razorpay_payment_id || payment.transaction_id}>
                                                        {payment.razorpay_payment_id || payment.transaction_id || "-"}
                                                    </span>
                                                    {payment.razorpay_order_id && (
                                                        <span className="text-[9px] text-gray-500 mt-0.5 truncate max-w-[100px]" title={payment.razorpay_order_id}>
                                                            Ord: {payment.razorpay_order_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {payment.order?.order_id ? (
                                                    <Link href={`/orders/${payment.order.order_id}`}>
                                                        <span className="text-sm text-[#a78bfa] font-medium hover:underline cursor-pointer truncate block max-w-[80px]">
                                                            #{payment.order.order_id.slice(0, 8)}...
                                                        </span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white text-sm truncate max-w-[120px]" title={payment.user?.first_name}>{payment.user?.first_name || "Unknown"}</div>
                                                <div className="text-[10px] text-gray-500 truncate max-w-[120px]" title={payment.user?.email}>{payment.user?.email}</div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                                                ₹{payment.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400 capitalize">
                                                {payment.mode || "N/A"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={payment.status} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                <div>{new Date(payment.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[9px] text-gray-600">{new Date(payment.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                        </TableRowFade>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="text-gray-600 mb-3 text-4xl">
                                                <FontAwesomeIcon icon={faWallet} />
                                            </div>
                                            <p className="text-gray-500">No payment records found</p>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {visibleCount < sortedPayments.length && (
                <div className="flex justify-center mt-8 pb-8">
                    <button
                        onClick={loadMore}
                        className="px-6 py-3 rounded-xl bg-[#2d1b4e] text-gray-200 font-bold hover:bg-[#3b2a5f] hover:text-white transition-all shadow-lg border border-[#3b2a5f]"
                    >
                        Load More Payments
                    </button>
                </div>
            )}
        </>
    );
}

export default withPermission(Payments, "payments");
