"use client";
import withPermission from '../../../components/withPermission';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope, faUser, faPhone, faBuilding, faMapMarkerAlt,
    faSearch, faPaperPlane, faTimes, faFile, faDownload,
    faCheckCircle, faExclamationCircle, faSpinner, faInbox,
    faCalendarAlt, faTag, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { getAuthToken } from '../../../utils/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    'in-review': { label: 'In Review', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    resolved:  { label: 'Resolved',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

function EnquiriesPage() {
    const router = useRouter();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replySubject, setReplySubject] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [notification, setNotification] = useState(null);
    const [loadingAttachment, setLoadingAttachment] = useState(null);

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
            if (search) params.search = search;
            const res = await axios.get(`${apiUrl}/api/enquiry`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setEnquiries(res.data);
        } catch (err) {
            showNotification('error', 'Failed to load enquiries');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => {
        const timer = setTimeout(fetchEnquiries, 300);
        return () => clearTimeout(timer);
    }, [fetchEnquiries]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const updateStatus = async (enquiryId, status) => {
        const token = getToken();
        if (!token) return;
        try {
            await axios.put(`${apiUrl}/api/enquiry/${enquiryId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnquiries(prev => prev.map(e => e.enquiry_id === enquiryId ? { ...e, status } : e));
            if (selected?.enquiry_id === enquiryId) setSelected(prev => ({ ...prev, status }));
            showNotification('success', 'Status updated');
        } catch (err) {
            showNotification('error', 'Failed to update status');
        }
    };

    const sendReply = async () => {
        if (!replySubject.trim() || !replyMessage.trim()) {
            showNotification('error', 'Subject and message are required');
            return;
        }
        const token = getToken();
        if (!token) return;
        setSending(true);
        try {
            await axios.post(`${apiUrl}/api/enquiry/${selected.enquiry_id}/reply`,
                { subject: replySubject, message: replyMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showNotification('success', `Reply sent to ${selected.email}`);
            setShowReplyModal(false);
            setReplySubject('');
            setReplyMessage('');
            // Refresh the enquiry status in list
            fetchEnquiries();
        } catch (err) {
            showNotification('error', err.response?.data?.error || 'Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const openAttachment = async (file) => {
        const token = getToken();
        if (!token) return;
        setLoadingAttachment(file.key);
        try {
            const res = await axios.get(`${apiUrl}/api/enquiry/${selected.enquiry_id}/attachment-url`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { key: file.key }
            });
            window.open(res.data.url, '_blank');
        } catch (err) {
            showNotification('error', 'Failed to open file. It may no longer exist.');
        } finally {
            setLoadingAttachment(null);
        }
    };

    const openReplyModal = () => {
        setReplySubject(`Re: Your Enquiry about ${selected?.service}`);
        setReplyMessage('');
        setShowReplyModal(true);
    };

    return (
        <>
            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-semibold ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                    >
                        <FontAwesomeIcon icon={notification.type === 'success' ? faCheckCircle : faExclamationCircle} />
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">Enquiries</h1>
                    <p className="text-gray-400 text-sm mt-1">View and respond to customer project enquiries.</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400 bg-[#1E1628] border border-[#2d1b4e] px-4 py-2 rounded-xl">
                    <FontAwesomeIcon icon={faInbox} className="text-[#a78bfa]" />
                    <span><strong className="text-white">{enquiries.filter(e => e.status === 'pending').length}</strong> pending</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email, phone, or service..."
                        className="w-full pl-11 pr-4 py-3 bg-[#1E1628] border border-[#2d1b4e] text-gray-200 rounded-xl outline-none focus:border-[#a78bfa] transition-colors placeholder-gray-600 text-sm"
                    />
                </div>
                <div className="relative">
                    <FontAwesomeIcon icon={faFilter} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="pl-10 pr-6 py-3 bg-[#1E1628] border border-[#2d1b4e] text-gray-200 rounded-xl outline-none focus:border-[#a78bfa] transition-colors text-sm appearance-none cursor-pointer"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in-review">In Review</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-6">
                {/* List */}
                <div className={`flex-1 flex flex-col gap-3 min-w-0 ${selected ? 'hidden lg:flex' : 'flex'}`}>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-[#1E1628] rounded-2xl p-5 border border-[#2d1b4e] animate-pulse h-24" />
                        ))
                    ) : enquiries.length === 0 ? (
                        <div className="bg-[#1E1628] rounded-2xl p-12 border border-[#2d1b4e] text-center text-gray-500">
                            <FontAwesomeIcon icon={faInbox} className="text-4xl mb-4 opacity-30" />
                            <p>No enquiries found.</p>
                        </div>
                    ) : enquiries.map(enq => (
                        <div
                            key={enq.enquiry_id}
                            onClick={() => setSelected(enq)}
                            className={`bg-[#1E1628] rounded-2xl p-5 border transition-all cursor-pointer hover:border-[#a78bfa]/50 ${selected?.enquiry_id === enq.enquiry_id ? 'border-[#a78bfa]' : 'border-[#2d1b4e]'}`}
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-white truncate">{enq.full_name}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[enq.status]?.color}`}>
                                            {STATUS_CONFIG[enq.status]?.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{enq.email}</p>
                                    <p className="text-xs text-[#a78bfa] mt-1">{enq.service} {enq.sub_service ? `→ ${enq.sub_service}` : ''}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs text-gray-500">{new Date(enq.created_at).toLocaleDateString('en-IN')}</p>
                                    {enq.attachments?.length > 0 && (
                                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                                            <FontAwesomeIcon icon={faFile} className="text-[10px]" />
                                            {enq.attachments.length}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {enq.requirement_desc && (
                                <p className="text-xs text-gray-500 mt-2 line-clamp-1">{enq.requirement_desc}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Detail Panel */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full lg:w-[420px] flex-shrink-0 bg-[#1E1628] rounded-2xl border border-[#2d1b4e] overflow-y-auto max-h-[calc(100vh-180px)] sticky top-4"
                        >
                            {/* Panel Header */}
                            <div className="p-6 border-b border-[#2d1b4e] flex justify-between items-center">
                                <h3 className="font-bold text-white text-lg">Enquiry Details</h3>
                                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white transition-colors">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Status Control */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${STATUS_CONFIG[selected.status]?.color}`}>
                                        {STATUS_CONFIG[selected.status]?.label}
                                    </span>
                                    <select
                                        value={selected.status}
                                        onChange={e => updateStatus(selected.enquiry_id, e.target.value)}
                                        className="bg-[#2d1b4e] border border-[#3b2a5f] text-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#a78bfa] cursor-pointer"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-review">In Review</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>

                                {/* Customer Info */}
                                <div className="bg-[#2d1b4e]/30 rounded-xl p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <FontAwesomeIcon icon={faUser} className="text-[#a78bfa] w-4" />
                                        <span className="font-semibold text-white">{selected.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-[#a78bfa] w-4" />
                                        <a href={`mailto:${selected.email}`} className="hover:text-[#a78bfa] transition-colors">{selected.email}</a>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <FontAwesomeIcon icon={faPhone} className="text-[#a78bfa] w-4" />
                                        <a href={`tel:${selected.phone}`} className="hover:text-[#a78bfa] transition-colors">{selected.phone}</a>
                                    </div>
                                    {selected.company_name && (
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <FontAwesomeIcon icon={faBuilding} className="text-[#a78bfa] w-4" />
                                            <span>{selected.company_name}</span>
                                        </div>
                                    )}
                                    {selected.city && (
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#a78bfa] w-4" />
                                            <span>{selected.city}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Project Info */}
                                <div className="bg-[#2d1b4e]/30 rounded-xl p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Project</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <FontAwesomeIcon icon={faTag} className="text-[#a78bfa] w-4" />
                                        <span>{selected.service} {selected.sub_service ? `→ ${selected.sub_service}` : ''}</span>
                                    </div>
                                    {selected.requirement_type && (
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <FontAwesomeIcon icon={faFilter} className="text-[#a78bfa] w-4" />
                                            <span>{selected.requirement_type}</span>
                                        </div>
                                    )}
                                    {selected.expected_timeline && (
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="text-[#a78bfa] w-4" />
                                            <span>{selected.expected_timeline}</span>
                                        </div>
                                    )}
                                    {selected.requirement_desc && (
                                        <div className="mt-2 pt-2 border-t border-[#3b2a5f]">
                                            <p className="text-xs text-gray-500 mb-1">Description</p>
                                            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{selected.requirement_desc}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Attachments */}
                                {selected.attachments?.length > 0 && (
                                    <div className="bg-[#2d1b4e]/30 rounded-xl p-4 space-y-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                            Attachments ({selected.attachments.length})
                                        </h4>
                                        {selected.attachments.map((file, i) => (
                                            <button
                                                key={i}
                                                onClick={() => openAttachment(file)}
                                                disabled={loadingAttachment === file.key}
                                                className="w-full flex items-center gap-3 bg-[#1E1628] rounded-lg p-3 hover:bg-[#3b2a5f] transition-colors group border border-[#3b2a5f] hover:border-[#a78bfa]/50 disabled:opacity-50"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center flex-shrink-0">
                                                    {loadingAttachment === file.key
                                                        ? <FontAwesomeIcon icon={faSpinner} className="text-[#a78bfa] animate-spin text-sm" />
                                                        : <FontAwesomeIcon icon={faFile} className="text-[#a78bfa] text-sm" />
                                                    }
                                                </div>
                                                <span className="text-sm text-gray-300 truncate flex-1 text-left">{file.name}</span>
                                                <FontAwesomeIcon icon={faDownload} className="text-gray-500 group-hover:text-[#a78bfa] transition-colors text-xs flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Received On */}
                                <p className="text-xs text-gray-600 text-center">
                                    Received on {new Date(selected.created_at).toLocaleString('en-IN')}
                                </p>

                                {/* Reply Button */}
                                <button
                                    onClick={openReplyModal}
                                    className="w-full bg-[#7C3AED] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#6D28D9] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                    Send Email Reply
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {showReplyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1E1628] border border-[#2d1b4e] rounded-2xl w-full max-w-2xl p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Send Reply</h2>
                                    <p className="text-sm text-gray-400 mt-1">To: <span className="text-[#a78bfa]">{selected?.full_name}</span> &lt;{selected?.email}&gt;</p>
                                </div>
                                <button onClick={() => setShowReplyModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 mb-2 block">Subject</label>
                                    <input
                                        value={replySubject}
                                        onChange={e => setReplySubject(e.target.value)}
                                        className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-white outline-none focus:border-[#a78bfa] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-300 mb-2 block">Message</label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={e => setReplyMessage(e.target.value)}
                                        rows={8}
                                        placeholder={`Dear ${selected?.full_name},\n\nThank you for reaching out to us...`}
                                        className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-white outline-none focus:border-[#a78bfa] transition-colors resize-none placeholder-gray-600"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => setShowReplyModal(false)} className="text-gray-400 hover:text-white px-5 py-2.5 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={sendReply}
                                        disabled={sending}
                                        className="bg-[#7C3AED] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#6D28D9] transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {sending ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faPaperPlane} />}
                                        {sending ? 'Sending...' : 'Send Reply'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

export default withPermission(EnquiriesPage, 'enquiries');
