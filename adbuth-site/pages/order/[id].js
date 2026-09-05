import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { cdnImage } from '../../utils/cdn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen, faCheckCircle, faClock, faDownload, faChevronLeft,
    faChevronDown, faChevronUp, faCircleDot, faTruckFast, faUserCheck,
    faClipboardList, faSpinner, faCircleExclamation, faImage, faFile,
    faCreditCard, faCalendarDays, faHashtag, faPlay, faEye, faFilm,
    faTimes, faUpload, faTrash
} from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const ORDER_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: faBoxOpen, desc: 'Payment confirmed' },
    { key: 'inprocessing', label: 'In Progress', icon: faCircleDot, desc: '5–7 working days' },
    { key: 'delivered', label: 'Delivered', icon: faTruckFast, desc: 'Files ready' },
];

const ACTION_LABELS = {
    ORDER_PLACED: { label: 'Order Confirmed', color: '#7c3aed' },
    ASSIGNED: { label: 'Order Accepted', color: '#6366f1' },
    REASSIGNED: { label: 'Order Under Review', color: '#f97316' },
    PICKED_UP: { label: 'In Production', color: '#f59e0b' },
    PROGRESS_UPDATE: { label: 'Update', color: '#06b6d4' },
    DELIVERED: { label: 'Files Delivered', color: '#10b981' },
    COMPLETED: { label: 'Order Complete', color: '#8b5cf6' },
};

// Notes/labels that should never be shown to customers
const HIDDEN_NOTES = [
    /employee/i, /picked up/i, /assigned to/i, /staff/i, /admin/i
];
function cleanNote(note) {
    if (!note) return null;
    if (HIDDEN_NOTES.some(r => r.test(note))) return null;
    return note;
}

function fmt(ts, short = false) {
    if (!ts) return '—';
    return new Intl.DateTimeFormat('en-IN', short
        ? { day: '2-digit', month: 'short', year: 'numeric' }
        : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    ).format(new Date(ts));
}

function getStepIndex(status) {
    if (!status || status === 'pending') return 0;
    if (['paid', 'placed'].includes(status)) return 1;
    if (['inprocessing', 'in_progress'].includes(status)) return 2;
    if (['delivered', 'completed'].includes(status)) return 3;
    return 0;
}

/** Count media files in customization object */
function countMediaFiles(val) {
    if (!val) return 0;
    let count = 0;
    if (typeof val === 'string') {
        if (val.startsWith('http')) count++;
    } else if (Array.isArray(val)) {
        val.forEach(v => { count += countMediaFiles(v); });
    } else if (typeof val === 'object') {
        if (val.url) {
            count++;
        } else {
            Object.values(val).forEach(v => { count += countMediaFiles(v); });
        }
    }
    return count;
}

/** Renders a customization field value safely */
function CustField({ label, val }) {
    if (val === null || val === undefined || val === '') {
        return <span className="text-gray-400 text-xs italic">Not provided</span>;
    }
    if (typeof val === 'boolean' || typeof val === 'number') {
        return <span className="text-gray-800 text-sm">{String(val)}</span>;
    }
    if (typeof val === 'string') {
        const isUrl = val.startsWith('http');
        const isImg = isUrl && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(val);
        if (isImg) return (
            <div>
                <img src={val} alt={label} className="max-h-32 rounded-lg border border-gray-200 object-contain bg-gray-50 mt-1" />
                <a href={val} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline mt-1">
                    <FontAwesomeIcon icon={faDownload} /> Download
                </a>
            </div>
        );
        if (isUrl) return (
            <a href={val} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline">
                <FontAwesomeIcon icon={faFile} /> View File
            </a>
        );
        return <span className="text-gray-800 text-sm">{val}</span>;
    }
    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-gray-400 text-xs italic">Empty</span>;
        return <div className="space-y-1">{val.map((v, i) => <CustField key={i} label={`${label}[${i}]`} val={v} />)}</div>;
    }
    if (typeof val === 'object') {
        if (val.code !== undefined && val.number !== undefined) return <span className="text-gray-800 text-sm">{val.code} {val.number}</span>;
        if (val.url) return <CustField label={label} val={val.url} />;
        return (
            <div className="space-y-2 pl-3 border-l-2 border-gray-100">
                {Object.entries(val).map(([k, v]) => (
                    <div key={k}>
                        <p className="text-gray-400 text-xs capitalize">{k.replace(/_/g, ' ')}</p>
                        <CustField label={k} val={v} />
                    </div>
                ))}
            </div>
        );
    }
    return <span className="text-gray-800 text-sm">{String(val)}</span>;
}

/** Single order item — collapsed by default, expands on click */
function OrderItem({ item, idx }) {
    const [open, setOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const delivered = item.delivery_status === 'delivered';
    const expired = delivered && item.download_expires_at && new Date(item.download_expires_at) < new Date();
    const nearExpiry = delivered && !expired && item.download_expires_at &&
        (new Date(item.download_expires_at) - new Date()) < 7 * 24 * 60 * 60 * 1000;

    const custEntries = item.customization
        ? Object.entries(typeof item.customization === 'string' ? JSON.parse(item.customization) : item.customization)
        : [];

    const handleDownload = async (e) => {
        e.stopPropagation();
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/orders/items/${item.order_item_id}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (d.url) window.open(d.url, '_blank');
            else alert(d.msg || 'Could not generate download link');
        } catch { alert('Error downloading file'); }
        finally { setDownloading(false); }
    };

    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
            {/* Row — always visible */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product?.thumbnail || item.product?.images?.[0]
                        ? <img src={cdnImage(item.product.thumbnail || item.product.images[0])} alt={item.product.title} className="w-full h-full object-cover" />
                        : <FontAwesomeIcon icon={faImage} className="text-gray-300" />
                    }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.product?.title || `Item #${idx + 1}`}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {delivered && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700">
                                ✓ Delivered
                            </span>
                        )}
                        <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                        {custEntries.length > 0 && <span className="text-[10px] text-purple-500">{custEntries.length} form field{custEntries.length !== 1 ? 's' : ''}</span>}
                        {countMediaFiles(item.customization) > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1">
                                <FontAwesomeIcon icon={faImage} className="text-[9px]" /> {countMediaFiles(item.customization)} Media Attached
                            </span>
                        )}
                    </div>
                </div>
                {/* Price + download quick-access */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm">₹{item.price_at_purchase?.toLocaleString()}</p>
                    {delivered && !expired && (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); handleDownload(e); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleDownload(e)}
                            aria-disabled={downloading}
                            className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold cursor-pointer select-none ${downloading ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                            {downloading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faDownload} />}
                            Download
                        </div>
                    )}
                    {expired && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg font-medium">
                            <FontAwesomeIcon icon={faCircleExclamation} /> Expired
                        </span>
                    )}
                    <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="text-gray-400 text-xs ml-1" />
                </div>
            </button>

            {/* Expanded detail */}
            {open && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-50 bg-gray-50/50 space-y-5">

                    {/* Delivery info */}
                    {delivered && (
                        <div className={`rounded-xl p-4 border ${expired ? 'bg-red-50 border-red-100' : 'bg-purple-50 border-purple-100'}`}>
                            <p className="text-sm font-bold text-gray-800 mb-1">
                                {expired ? '⏰ Download Window Closed' : '✅ Files Ready for Download'}
                            </p>
                            {item.download_expires_at && (
                                <p className={`text-xs ${expired ? 'text-red-600' : nearExpiry ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                                    {expired
                                        ? `Download link expired on ${fmt(item.download_expires_at, true)}.`
                                        : `Download available until ${fmt(item.download_expires_at, true)}${nearExpiry ? ' — expiring soon!' : '.'}`
                                    }
                                </p>
                            )}
                            {!expired && (
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-60 transition-colors"
                                >
                                    {downloading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faDownload} />}
                                    Download Your Files
                                </button>
                            )}
                            {expired && (
                                <Link href="/contact-us" className="mt-2 inline-flex text-xs text-red-600 hover:underline font-medium">
                                    Contact support →
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Customization form fields */}
                    {custEntries.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-black uppercase tracking-wider mb-3">Your Submitted Information</p>
                            <div className="space-y-2">
                                {custEntries.map(([key, val]) => (
                                    <div key={key} className="bg-white rounded-xl px-4 py-3 border border-gray-100">
                                        <p className="text-xs text-gray-400 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                                        <CustField label={key} val={val} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No extra info */}
                    {custEntries.length === 0 && !delivered && (
                        <p className="text-xs text-gray-400 italic text-center py-2">No additional form details for this item.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function OrderDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, loading: authLoading } = useAuth();

    const [order, setOrder] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showChangesModal, setShowChangesModal] = useState(false);
    const [refundReason, setRefundReason] = useState('Incorrect customization details');
    const [refundDetails, setRefundDetails] = useState('');
    const [changeInstructions, setChangeInstructions] = useState('');
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [submittingAction, setSubmittingAction] = useState(false);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingFile(true);
        const token = localStorage.getItem('token');
        const uploaded = [...uploadedUrls];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch(`${API_URL}/api/cart/upload-media`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    uploaded.push(data.url);
                } else {
                    alert(`Failed to upload ${file.name}`);
                }
            } catch (err) {
                console.error(err);
                alert(`Error uploading ${file.name}`);
            }
        }
        setUploadedUrls(uploaded);
        setUploadingFile(false);
    };

    const handleRemoveUploadedFile = (indexToRemove) => {
        setUploadedUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleRefundRequest = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/orders/${id}/request-refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason: refundReason, details: refundDetails })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Refund request submitted successfully');
                setShowRefundModal(false);
                router.reload();
            } else {
                alert(data.error || 'Failed to submit refund request');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong');
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleChangeRequest = async (e) => {
        e.preventDefault();
        setSubmittingAction(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/orders/${id}/request-changes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ instructions: changeInstructions, attachments: uploadedUrls })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Change request submitted successfully');
                setShowChangesModal(false);
                setChangeInstructions('');
                setUploadedUrls([]);
                router.reload();
            } else {
                alert(data.error || 'Failed to submit change request');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong');
        } finally {
            setSubmittingAction(false);
        }
    };

    useEffect(() => {
        if (authLoading || !id) return;
        if (!user) { router.push('/login'); return; }
        const token = localStorage.getItem('token');
        const h = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`${API_URL}/api/orders/${id}`, { headers: h }).then(r => r.json()),
            fetch(`${API_URL}/api/orders/${id}/timeline`, { headers: h }).then(r => r.json()).catch(() => []),
        ]).then(([o, t]) => {
            if (o.error) setError(o.error);
            else { setOrder(o); setTimeline(Array.isArray(t) ? t : []); }
        }).catch(() => setError('Could not load order details.'))
            .finally(() => setLoading(false));
    }, [id, user, authLoading, router]);

    if (authLoading || loading) return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <main className="flex-grow flex items-center justify-center pt-32">
                <FontAwesomeIcon icon={faSpinner} spin className="text-purple-600 text-4xl" />
            </main>
            <Footer />
        </div>
    );

    if (error || !order) return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <main className="flex-grow flex items-center justify-center pt-32 px-4">
                <div className="text-center bg-white rounded-3xl p-12 shadow-sm border border-gray-100 max-w-md">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-gray-300 text-5xl mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Order not found'}</h2>
                    <Link href="/orders" className="text-purple-600 hover:underline text-sm">← Back to Orders</Link>
                </div>
            </main>
            <Footer />
        </div>
    );

    const stepIndex = getStepIndex(order.status);
    const orderRef = order.order_id.substring(0, 8).toUpperCase();
    const deliveredCount = order.items?.filter(i => i.delivery_status === 'delivered').length || 0;
    const totalItems = order.items?.length || 0;

    // Estimate delivery date: 7 working days from order creation
    const orderDate = new Date(order.createdAt);
    let workingDays = 0, estDate = new Date(orderDate);
    while (workingDays < 7) {
        estDate.setDate(estDate.getDate() + 1);
        if (estDate.getDay() !== 0 && estDate.getDay() !== 6) workingDays++;
    }
    const estDelivery = fmt(estDate, true);

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <main className="flex-grow pt-32 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" /> Back to My Orders
                    </Link>

                    {/* Header */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-6 text-white">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-purple-200 text-xs mb-1">Order Reference</p>
                                    <h1 className="text-2xl font-bold font-mono">#{orderRef}</h1>
                                    <p className="text-purple-200 text-xs mt-1">{fmt(order.createdAt)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-purple-200 text-xs mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold">₹{order.total_amount?.toLocaleString()}</p>
                                    {deliveredCount > 0 && (
                                        <p className="text-green-300 text-xs mt-1">{deliveredCount}/{totalItems} items delivered</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order meta pills */}
                        <div className="flex flex-wrap gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-100">
                                <FontAwesomeIcon icon={faHashtag} className="text-gray-400" />
                                {order.order_id.substring(0, 12).toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-100">
                                <FontAwesomeIcon icon={faCreditCard} className="text-gray-400" />
                                {order.payment?.mode?.toUpperCase() || 'Online'} · {order.payment?.status || 'Paid'}
                            </div>
                            {order.status !== 'delivered' && order.status !== 'completed' && (
                                <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
                                    <FontAwesomeIcon icon={faCalendarDays} className="text-purple-400" />
                                    Est. delivery by {estDelivery} (5–7 working days)
                                </div>
                            )}
                        </div>

                        {/* Status stepper */}
                        <div className="px-6 py-8">
                            <div className="flex items-center justify-between relative">
                                <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-100 mx-10" />
                                <div
                                    className="absolute left-0 top-5 h-0.5 bg-purple-500 mx-10 transition-all duration-700"
                                    style={{ width: `${Math.min(((stepIndex - 1) / (ORDER_STEPS.length - 1)) * 100, 100)}%` }}
                                />
                                {ORDER_STEPS.map((step, i) => {
                                    const done = i < stepIndex - 1;
                                    const active = i === stepIndex - 1;
                                    return (
                                        <div key={step.key} className="flex flex-col items-center relative z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${done ? 'bg-purple-600 border-purple-600 text-white' :
                                                active ? 'bg-white border-purple-600 text-purple-600 shadow-lg shadow-purple-100' :
                                                    'bg-white border-gray-200 text-gray-300'
                                                }`}>
                                                {done
                                                    ? <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                                                    : <FontAwesomeIcon icon={step.icon} className="text-sm" />
                                                }
                                            </div>
                                            <p className={`text-xs font-semibold mt-2 text-center ${active ? 'text-purple-700' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                                                {step.label}
                                            </p>
                                            <p className="text-[10px] text-gray-400 text-center hidden sm:block">{step.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>


                    </div>

                    <div className="space-y-4">
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-900">
                                Order Items
                                <span className="ml-2 text-sm text-gray-400 font-normal">Click an item to see details</span>
                            </h2>
                            <div className="space-y-3">
                                {order.items?.map((item, idx) => (
                                    <OrderItem key={item.order_item_id} item={item} idx={idx} />
                                ))}
                            </div>

                            {/* Payment summary */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-2">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">Payment Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{order.items?.reduce((s, i) => s + (i.price_at_purchase * i.quantity), 0).toLocaleString()}</span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>−₹{order.discount_amount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1">
                                        <span>Total Paid</span>
                                        <span>₹{order.total_amount?.toLocaleString()}</span>
                                    </div>
                                    {order.payment && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Paid via {order.payment.mode?.toUpperCase()} · Transaction: {order.payment.razorpay_payment_id || '—'}
                                        </p>
                                    )}
                                </div>

                                {/* Order & Refund Actions */}
                                {['paid', 'placed', 'delivered', 'completed', 'inprocessing', 'in_progress'].includes(order.status) && (
                                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                                        {/* Change Request Status Badges */}
                                        {order.change_request_status === 'pending' && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                                                <FontAwesomeIcon icon={faClock} />
                                                <span>Change request under review</span>
                                            </div>
                                        )}
                                        {order.change_request_status === 'completed' && (
                                            <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                <span>Customization changes completed!</span>
                                            </div>
                                        )}

                                        {/* Refund Request Status Badges */}
                                        {order.payment?.refund_request_status === 'pending' && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                                                <FontAwesomeIcon icon={faClock} />
                                                <span>Refund request pending approval</span>
                                            </div>
                                        )}
                                        {order.payment?.refund_request_status === 'approved' && (
                                            <div className="p-3 bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold rounded-xl flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                <span>Refund Approved / Order Cancelled</span>
                                            </div>
                                        )}
                                        {order.payment?.refund_request_status === 'rejected' && (
                                            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCircleExclamation} />
                                                <span>Refund Request Declined</span>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {order.payment?.refund_request_status !== 'approved' && (
                                            <div className="flex gap-2.5">
                                                {order.change_request_status !== 'pending' && (
                                                    <button
                                                        onClick={() => setShowChangesModal(true)}
                                                        className="flex-1 py-2.5 px-3 bg-black text-white hover:bg-gray-800 transition-colors text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        Request Changes
                                                    </button>
                                                )}
                                                {order.payment?.refund_request_status !== 'pending' && order.payment?.refund_request_status !== 'approved' && (
                                                    <button
                                                        onClick={() => setShowRefundModal(true)}
                                                        className="flex-1 py-2.5 px-3 border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                                                    >
                                                        Request Refund
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Request Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Request Refund</h3>
                            <button onClick={() => setShowRefundModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <form onSubmit={handleRefundRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Refund</label>
                                <select
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold !text-black outline-none focus:border-purple-600 transition-colors"
                                    style={{ color: '#000000', backgroundColor: '#f9fafb' }}
                                >
                                    <option value="Incorrect customization details" className="text-black bg-white" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Incorrect customization details</option>
                                    <option value="Technical download issue" className="text-black bg-white" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Technical download issue</option>
                                    <option value="Wrong item ordered" className="text-black bg-white" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Wrong item ordered</option>
                                    <option value="Delivered late" className="text-black bg-white" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Delivered late</option>
                                    <option value="Other" className="text-black bg-white" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Additional Details (Optional)</label>
                                <textarea
                                    value={refundDetails}
                                    onChange={(e) => setRefundDetails(e.target.value)}
                                    placeholder="Please provide details about your refund request..."
                                    rows="4"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm !text-black placeholder:text-gray-500 outline-none focus:border-purple-600 transition-colors resize-none"
                                    style={{ color: '#000000', caretColor: '#000000', backgroundColor: '#f9fafb' }}
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submittingAction}
                                    className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {submittingAction ? 'Submitting...' : 'Submit Refund Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Request Changes Modal */}
            {showChangesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Request Customization Edits</h3>
                            <button onClick={() => setShowChangesModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <form onSubmit={handleChangeRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions / Details</label>
                                <textarea
                                    value={changeInstructions}
                                    onChange={(e) => setChangeInstructions(e.target.value)}
                                    placeholder="Describe the exact changes you need (e.g. text replacements, color changes, custom requests)..."
                                    rows="5"
                                    required
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm !text-black placeholder:text-gray-500 outline-none focus:border-purple-600 transition-colors resize-none"
                                    style={{ color: '#000000', caretColor: '#000000', backgroundColor: '#f9fafb' }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload Reference Files / Replacement Media</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-purple-300 transition-colors relative cursor-pointer">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        disabled={uploadingFile}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <p className="text-xs font-bold text-gray-700">Drag & drop files or click to browse</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Supports JPEG, PNG, WEBP, GIF, MP4 (Max 50MB per file)</p>
                                </div>
                            </div>

                            {uploadedUrls.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Uploaded Attachments ({uploadedUrls.length})</p>
                                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                        {uploadedUrls.map((url, idx) => (
                                            <div key={url} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                                                <span className="truncate max-w-[280px] font-semibold text-gray-700">{url.split('/').pop().split('?')[0]}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveUploadedFile(idx)}
                                                    className="w-6 h-6 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {uploadingFile && (
                                <div className="p-3 bg-purple-50 text-purple-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    <span>Uploading files...</span>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submittingAction || uploadingFile}
                                    className="w-full py-3 bg-[#7E22CE] text-white font-bold rounded-xl hover:bg-purple-800 transition-all disabled:opacity-50"
                                >
                                    {submittingAction ? 'Submitting...' : 'Submit Change Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
