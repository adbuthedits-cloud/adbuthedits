"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faEnvelope, faUser, faPhone, faBuilding, faMapMarkerAlt,
    faPaperPlane, faTimes, faFile, faDownload, faSpinner,
    faCheckCircle, faExclamationCircle, faCalendarAlt, faTag, faFilter,
    faStickyNote, faLink
} from '@fortawesome/free-solid-svg-icons';
import { getAuthToken, getAuthUser } from '../../../../utils/auth';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  dot: 'bg-amber-400' },
    'in-review': { label: 'In Review',  bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    dot: 'bg-blue-400' },
    resolved:    { label: 'Resolved',   bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
};

const SOURCE_LABELS = {
    enquiry_form:  { label: 'Enquiry Form',    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    contact_form:  { label: 'Contact Form',    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    get_in_touch:  { label: 'Get In Touch',    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    elearning_coming_soon: { label: 'E-Learning Coming Soon', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
};

function Avatar({ name, role }) {
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
    const colors = ['bg-violet-600', 'bg-indigo-600', 'bg-sky-600', 'bg-teal-600', 'bg-rose-600'];
    const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
    return (
        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`} title={`${name} — ${role}`}>
            {initials}
        </div>
    );
}

export default function EnquiryDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [enquiry, setEnquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [channel, setChannel] = useState('email');
    const [sending, setSending] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [notification, setNotification] = useState(null);
    const [loadingAttachment, setLoadingAttachment] = useState(null);
    const repliesEndRef = useRef(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const getToken = () => {
        const token = getAuthToken();
        if (!token) { router.push('/login'); return null; }
        return token;
    };

    const fetchEnquiry = async () => {
        const token = getToken();
        if (!token || !id) return;
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/api/enquiry/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnquiry(res.data);
            setSubject(`Re: ${res.data.service ? 'Enquiry about ' + res.data.service : 'Your Enquiry'}`);
        } catch (err) {
            showNotification('error', 'Failed to load enquiry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEnquiry(); }, [id]);

    useEffect(() => {
        if (enquiry?.replies?.length) {
            setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [enquiry?.replies?.length]);

    const showNotification = (type, msg) => {
        setNotification({ type, message: msg });
        setTimeout(() => setNotification(null), 4000);
    };

    const updateStatus = async (status) => {
        const token = getToken();
        if (!token) return;
        setStatusUpdating(true);
        try {
            await axios.put(`${apiUrl}/api/enquiry/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnquiry(prev => ({ ...prev, status }));
            showNotification('success', 'Status updated');
        } catch (err) {
            showNotification('error', 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const sendReply = async () => {
        if (!message.trim()) { showNotification('error', 'Message cannot be empty'); return; }
        if (channel === 'email' && !subject.trim()) { showNotification('error', 'Subject is required for email'); return; }
        const token = getToken();
        if (!token) return;
        setSending(true);
        try {
            await axios.post(`${apiUrl}/api/enquiry/${id}/reply`,
                { subject, message, channel },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showNotification('success', channel === 'email' ? `Email sent to ${enquiry.email}` : 'Note saved');
            setMessage('');
            fetchEnquiry(); // Refresh to show new reply in history
        } catch (err) {
            showNotification('error', err.response?.data?.error || 'Failed to send');
        } finally {
            setSending(false);
        }
    };

    const openAttachment = async (file) => {
        const token = getToken();
        if (!token) return;
        setLoadingAttachment(file.key);
        try {
            const res = await axios.get(`${apiUrl}/api/enquiry/${id}/attachment-url`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { key: file.key }
            });
            window.open(res.data.url, '_blank');
        } catch (err) {
            showNotification('error', 'Failed to open file');
        } finally {
            setLoadingAttachment(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a78bfa]" />
            </div>
        );
    }

    if (!enquiry) {
        return <div className="text-center text-gray-500 mt-20">Enquiry not found.</div>;
    }

    const s = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.pending;
    const src = SOURCE_LABELS[enquiry.source] || { label: enquiry.source, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };

    return (
        <>
            {/* Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold ${notification.type === 'success' ? 'bg-[#0d2b1f] text-emerald-400 border-emerald-500/50' : 'bg-[#2b0d0d] text-rose-400 border-rose-500/50'}`}
                    >
                        <FontAwesomeIcon icon={notification.type === 'success' ? faCheckCircle : faExclamationCircle} />
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back + Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/enquiries')} className="w-9 h-9 rounded-xl bg-[#1E1628] border border-[#2d1b4e] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#a78bfa] transition-all">
                    <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold text-white truncate">{enquiry.full_name}</h1>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.bg}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot} mr-1.5`} />
                            {s.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${src.color}`}>{src.label}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">#{enquiry.enquiry_id.slice(0, 8).toUpperCase()} · Received {(() => { const d = new Date(enquiry.createdAt || enquiry.created_at); return isNaN(d) ? '—' : d.toLocaleString('en-IN'); })()}</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={enquiry.status}
                        onChange={e => updateStatus(e.target.value)}
                        disabled={statusUpdating}
                        className="bg-[#1E1628] border border-[#2d1b4e] text-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#a78bfa] cursor-pointer disabled:opacity-50"
                    >
                        <option value="pending">Pending</option>
                        <option value="in-review">In Review</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">

                {/* LEFT: Customer & Project Details */}
                <div className="space-y-4">

                    {/* Customer Card */}
                    <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] p-5">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Customer</h3>
                        <div className="space-y-3">
                            <DetailRow icon={faUser} label="Name" value={enquiry.full_name} />
                            <DetailRow icon={faEnvelope} label="Email" value={<a href={`mailto:${enquiry.email}`} className="text-[#a78bfa] hover:underline">{enquiry.email}</a>} />
                            {enquiry.phone && <DetailRow icon={faPhone} label="Phone" value={<a href={`tel:${enquiry.phone}`} className="hover:text-[#a78bfa] transition-colors">{enquiry.phone}</a>} />}
                            {enquiry.company_name && <DetailRow icon={faBuilding} label="Company" value={enquiry.company_name} />}
                            {enquiry.city && <DetailRow icon={faMapMarkerAlt} label="City" value={enquiry.city} />}
                        </div>
                    </div>

                    {/* Project Card — only for enquiry form */}
                    {(enquiry.service || enquiry.requirement_desc) && (
                        <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] p-5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Project Details</h3>
                            <div className="space-y-3">
                                {enquiry.service && <DetailRow icon={faTag} label="Service" value={enquiry.service} />}
                                {enquiry.sub_service && <DetailRow icon={faTag} label="Sub-Service" value={enquiry.sub_service} />}
                                {enquiry.requirement_type && <DetailRow icon={faFilter} label="Type" value={enquiry.requirement_type} />}
                                {enquiry.expected_timeline && <DetailRow icon={faCalendarAlt} label="Timeline" value={enquiry.expected_timeline} />}
                                {enquiry.requirement_desc && (
                                    <div className="pt-3 border-t border-[#2d1b4e]">
                                        <p className="text-[11px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Description</p>
                                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{enquiry.requirement_desc}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {enquiry.attachments?.length > 0 && (
                        <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] p-5">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                                Attachments ({enquiry.attachments.length})
                            </h3>
                            <div className="space-y-2">
                                {enquiry.attachments.map((file, i) => (
                                    <button key={i} onClick={() => openAttachment(file)} disabled={loadingAttachment === file.key}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#130C1C] border border-[#2d1b4e] hover:border-[#a78bfa]/40 transition-all group disabled:opacity-50">
                                        <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center flex-shrink-0">
                                            <FontAwesomeIcon icon={loadingAttachment === file.key ? faSpinner : faFile}
                                                className={`text-[#a78bfa] text-sm ${loadingAttachment === file.key ? 'animate-spin' : ''}`} />
                                        </div>
                                        <span className="text-xs text-gray-300 truncate flex-1 text-left">{file.name}</span>
                                        <FontAwesomeIcon icon={faDownload} className="text-gray-600 group-hover:text-[#a78bfa] text-xs flex-shrink-0 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Reply History + Compose */}
                <div className="flex flex-col gap-4">

                    {/* Reply Thread */}
                    <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] flex-1">
                        <div className="p-5 border-b border-[#2d1b4e]">
                            <h3 className="text-sm font-bold text-white">Reply History</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{enquiry.replies?.length || 0} {enquiry.replies?.length === 1 ? 'reply' : 'replies'}</p>
                        </div>

                        <div className="p-5 space-y-4 min-h-[200px] max-h-[420px] overflow-y-auto custom-scroll">
                            {!enquiry.replies?.length ? (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-2">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-2xl opacity-20" />
                                    <p className="text-sm">No replies yet. Be the first to respond.</p>
                                </div>
                            ) : enquiry.replies.map((reply, i) => (
                                <motion.div
                                    key={reply.reply_id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex gap-3"
                                >
                                    <Avatar name={reply.admin_name} role={reply.admin_role} />
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-[#130C1C] rounded-xl p-4 border border-[#2d1b4e]">
                                            {/* Reply Header */}
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="font-semibold text-white text-sm">{reply.admin_name}</span>
                                                <span className="text-[10px] bg-[#2d1b4e] text-gray-400 px-2 py-0.5 rounded-full border border-[#3b2a5f]">{reply.admin_role}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${reply.channel === 'email' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                    <FontAwesomeIcon icon={reply.channel === 'email' ? faEnvelope : faStickyNote} className="text-[9px]" />
                                                    {reply.channel === 'email' ? 'Email' : 'Internal Note'}
                                                </span>
                                            </div>
                                            {reply.subject && (
                                                <p className="text-xs text-gray-500 mb-2 font-medium">{reply.subject}</p>
                                            )}
                                            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                                        </div>
                                        <p className="text-[11px] text-gray-600 mt-1.5 ml-1">
                                            {(() => { const d = new Date(reply.createdAt || reply.created_at); return isNaN(d) ? '—' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); })()}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={repliesEndRef} />
                        </div>
                    </div>

                    {/* Compose Box */}
                    <div className="bg-[#1E1628] rounded-2xl border border-[#2d1b4e] p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-sm font-bold text-white flex-1">Compose Reply</h3>
                            {/* Channel Toggle */}
                            <div className="flex bg-[#130C1C] rounded-lg border border-[#2d1b4e] p-0.5 text-xs">
                                <button onClick={() => setChannel('email')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${channel === 'email' ? 'bg-[#7C3AED] text-white' : 'text-gray-400 hover:text-white'}`}>
                                    <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" /> Email
                                </button>
                                <button onClick={() => setChannel('note')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${channel === 'note' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                    <FontAwesomeIcon icon={faStickyNote} className="text-[10px]" /> Note
                                </button>
                            </div>
                        </div>

                        {channel === 'email' && (
                            <input
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Subject"
                                className="w-full mb-3 p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa] transition-colors placeholder-gray-600"
                            />
                        )}

                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={5}
                            placeholder={channel === 'email'
                                ? `Dear ${enquiry.full_name},\n\nThank you for reaching out...`
                                : 'Add an internal note (not sent to customer)...'}
                            className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa] transition-colors resize-none placeholder-gray-600"
                        />

                        <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-gray-600">
                                {channel === 'email' ? `Will be sent to ${enquiry.email}` : 'Only visible to admin team'}
                            </p>
                            <button
                                onClick={sendReply}
                                disabled={sending || !message.trim()}
                                className="flex items-center gap-2 bg-[#7C3AED] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6D28D9] transition-all disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={sending ? faSpinner : faPaperPlane} className={sending ? 'animate-spin' : ''} />
                                {sending ? 'Sending...' : channel === 'email' ? 'Send Email' : 'Save Note'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#2d1b4e] flex items-center justify-center flex-shrink-0 mt-0.5">
                <FontAwesomeIcon icon={icon} className="text-[#a78bfa] text-xs" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">{label}</p>
                <div className="text-sm text-gray-200 mt-0.5">{value}</div>
            </div>
        </div>
    );
}
