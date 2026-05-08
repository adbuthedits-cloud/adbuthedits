"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faInbox, faFilter, faSort, faSortUp, faSortDown,
    faFile, faChevronRight, faCheckCircle, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { getAuthToken, getAuthUser } from '../../../utils/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    'in-review': { label: 'In Review', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    resolved:    { label: 'Resolved',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const SOURCE_CONFIG = {
    enquiry_form: { label: 'Enquiry', color: 'text-violet-400' },
    contact_form: { label: 'Contact', color: 'text-sky-400' },
    get_in_touch: { label: 'Get In Touch', color: 'text-teal-400' },
};

function SortIcon({ col, cfg }) {
    if (cfg.key !== col) return <FontAwesomeIcon icon={faSort} className="ml-1 opacity-25 text-[10px]" />;
    return cfg.dir === 'asc'
        ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-[#a78bfa] text-[10px]" />
        : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-[#a78bfa] text-[10px]" />;
}

export default function EnquiriesPage() {
    const router = useRouter();
    const [allowed, setAllowed] = useState(null);

    useEffect(() => {
        const user = getAuthUser();
        if (!user) { router.push('/login'); return; }
        // Super admin always allowed; any admin with a token is allowed for enquiries
        setAllowed(true);
    }, []);

    if (allowed === null) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a78bfa]" />
        </div>
    );

    return <EnquiriesContent />;
}

function EnquiriesContent() {
    const router = useRouter();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [notification, setNotification] = useState(null);
    const [sortCfg, setSortCfg] = useState({ key: 'createdAt', dir: 'desc' });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const getToken = () => {
        const token = getAuthToken();
        if (!token) { router.push('/login'); return null; }
        return token;
    };

    const fetchEnquiries = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (sourceFilter !== 'all') params.source = sourceFilter;
            if (search) params.search = search;
            const res = await axios.get(`${apiUrl}/api/enquiry`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setEnquiries(res.data);
        } catch (err) {
            console.error('Enquiry fetch error:', err.response?.data || err.message);
            showNotification('error', `Failed to load: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sourceFilter, search]);

    useEffect(() => {
        const t = setTimeout(fetchEnquiries, 300);
        return () => clearTimeout(t);
    }, [fetchEnquiries]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const requestSort = (key) => {
        setSortCfg(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    };

    const sorted = [...enquiries].sort((a, b) => {
        let av = a[sortCfg.key] ?? '', bv = b[sortCfg.key] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        return (av < bv ? -1 : av > bv ? 1 : 0) * (sortCfg.dir === 'asc' ? 1 : -1);
    });

    const TH = ({ col, children }) => (
        <th
            onClick={() => requestSort(col)}
            className="py-3 px-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-[#a78bfa] transition-colors select-none whitespace-nowrap"
        >
            {children} <SortIcon col={col} cfg={sortCfg} />
        </th>
    );

    return (
        <>
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold max-w-sm ${notification.type === 'success' ? 'bg-[#0d2b1f] text-emerald-400 border-emerald-500/50' : 'bg-[#2b0d0d] text-rose-400 border-rose-500/50'}`}
                    >
                        <FontAwesomeIcon icon={notification.type === 'success' ? faCheckCircle : faExclamationCircle} />
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">Enquiries</h1>
                    <p className="text-gray-500 text-sm mt-1">All customer enquiries, contact messages, and project requests.</p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-[#1E1628] border border-[#2d1b4e] px-4 py-2 rounded-xl">
                    <FontAwesomeIcon icon={faInbox} className="text-amber-400" />
                    <span className="text-gray-400"><strong className="text-white">{enquiries.filter(e => e.status === 'pending').length}</strong> pending</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search name, email, phone, service..."
                        className="w-full pl-11 pr-4 py-2.5 bg-[#1E1628] border border-[#2d1b4e] text-gray-200 rounded-xl outline-none focus:border-[#a78bfa] transition-colors placeholder-gray-600 text-sm"
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[#1E1628] border border-[#2d1b4e] text-gray-300 rounded-xl outline-none focus:border-[#a78bfa] text-sm cursor-pointer">
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-review">In Review</option>
                    <option value="resolved">Resolved</option>
                </select>
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[#1E1628] border border-[#2d1b4e] text-gray-300 rounded-xl outline-none focus:border-[#a78bfa] text-sm cursor-pointer">
                    <option value="all">All Sources</option>
                    <option value="enquiry_form">Enquiry Form</option>
                    <option value="contact_form">Contact Form</option>
                </select>
            </div>

            {/* Sortable Table */}
            <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-[#2d1b4e] bg-[#130C1C]">
                            <tr>
                                <TH col="full_name">Name</TH>
                                <TH col="email">Email</TH>
                                <TH col="service">Service / Message</TH>
                                <TH col="source">Source</TH>
                                <TH col="status">Status</TH>
                                <TH col="createdAt">Date</TH>
                                <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Files</th>
                                <th className="py-3 px-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-[#2d1b4e]/50">
                                        {[...Array(8)].map((__, j) => (
                                            <td key={j} className="py-4 px-4"><div className="h-3.5 bg-[#2d1b4e] rounded animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : sorted.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-gray-600">
                                        <FontAwesomeIcon icon={faInbox} className="text-3xl mb-3 block opacity-20 mx-auto" />
                                        No enquiries found.
                                    </td>
                                </tr>
                            ) : sorted.map(enq => {
                                const st = STATUS_CONFIG[enq.status] || STATUS_CONFIG.pending;
                                const sc = SOURCE_CONFIG[enq.source] || { label: enq.source || '—', color: 'text-gray-400' };
                                return (
                                    <tr key={enq.enquiry_id}
                                        className="border-b border-dashed border-[#2d1b4e]/50 last:border-0 hover:bg-[#2d1b4e]/20 transition-colors group">
                                        <td className="py-4 px-4 font-semibold text-white">{enq.full_name}</td>
                                        <td className="py-4 px-4 text-gray-400 text-xs max-w-[160px] truncate">{enq.email}</td>
                                        <td className="py-4 px-4">
                                            {enq.service ? (
                                                <div>
                                                    <p className="text-[#a78bfa] text-xs font-semibold">{enq.service}</p>
                                                    {enq.sub_service && <p className="text-gray-600 text-[11px]">{enq.sub_service}</p>}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-xs line-clamp-1">{enq.requirement_desc || '—'}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`text-[11px] font-semibold ${sc.color}`}>{sc.label}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.color}`}>{st.label}</span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 text-xs whitespace-nowrap">
                                        {(() => { const d = new Date(enq.createdAt || enq.created_at); return isNaN(d) ? '—' : d.toLocaleDateString('en-IN'); })()}
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 text-xs">
                                            {enq.attachments?.length > 0
                                                ? <span className="flex items-center gap-1 text-gray-400"><FontAwesomeIcon icon={faFile} className="text-[10px]" />{enq.attachments.length}</span>
                                                : '—'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <Link href={`/enquiries/${enq.enquiry_id}`}
                                                className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-[#a78bfa] transition-colors font-medium whitespace-nowrap">
                                                View <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
