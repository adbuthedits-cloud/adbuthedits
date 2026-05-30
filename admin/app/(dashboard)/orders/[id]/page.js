"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faBox, faUser, faEdit, faPaperPlane, faCheckCircle,
    faTrash, faCircleNotch, faRoute, faSpinner, faImage, faFile,
    faCreditCard, faCalendarDays, faDownload, faEye, faPlay,
    faHashtag, faPhone, faEnvelope, faCircleDot, faClock, faUserShield
} from '@fortawesome/free-solid-svg-icons';
import DeliveryModal from '../../../../components/DeliveryModal';
import { getAuthToken, getAuthUser } from '../../../../utils/auth';
import withPermission from '../../../../components/withPermission';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function fmt(d) {
    if (!d) return '—';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
}

function fmtDate(d) {
    if (!d) return '—';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}

function CustomImagePreview({ value, label }) {
    const [error, setError] = useState(false);
    
    if (error) return (
        <div className="mt-1 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <FontAwesomeIcon icon={faImage} className="text-red-400" />
            <div className="overflow-hidden">
                <p className="text-xs font-bold text-red-400">Image Expired / Deleted</p>
                <p className="text-[10px] text-red-300 truncate max-w-[200px]">{value.split('/').pop().split('?')[0]}</p>
            </div>
        </div>
    );

    return (
        <div className="mt-1 space-y-1">
            <img src={value} alt={label} onError={() => setError(true)} className="max-h-48 w-full object-contain rounded-xl border border-[#2d1b4e] bg-[#0d0816]" />
            <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#a78bfa] hover:underline">
                <FontAwesomeIcon icon={faEye} /> Open Full Size
            </a>
        </div>
    );
}

/** Renders a value — shows media inline */
function FieldValue({ label, value }) {
    if (value === null || value === undefined) return <span className="text-gray-600 text-xs italic">—</span>;

    if (typeof value === 'object' && value !== null) {
        if (value.code !== undefined && value.number !== undefined)
            return <span className="text-gray-200 text-sm">{value.code} {value.number}</span>;
        if (value.url) return <FieldValue label={label} value={value.url} />;
        return (
            <div className="space-y-1 mt-1">
                {Object.entries(value).map(([k, v]) => (
                    <div key={k}>
                        <p className="text-[9px] text-gray-600 uppercase">{k.replace(/_/g,' ')}</p>
                        <FieldValue label={k} value={v} />
                    </div>
                ))}
            </div>
        );
    }

    if (typeof value === 'string' && value.startsWith('http')) {
        const ext = value.split('?')[0].split('.').pop().toLowerCase();
        const isImg = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
        const isVid = ['mp4','mov','webm','mkv','avi'].includes(ext);
        if (isImg) return <CustomImagePreview value={value} label={label} />;
        if (isVid) return (
            <div className="mt-1">
                <video src={value} controls className="w-full max-h-48 rounded-xl border border-[#2d1b4e] bg-black" />
            </div>
        );
        return (
            <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#a78bfa] hover:underline mt-1">
                <FontAwesomeIcon icon={faFile} /> Open / Download File
            </a>
        );
    }

    return <span className="text-gray-200 text-sm">{String(value)}</span>;
}

/** Renders a group of customization fields */
function CustomizationGroup({ groupName, fields }) {
    return (
        <div className="bg-[#130C1C] rounded-xl border border-[#2d1b4e] p-4">
            <h5 className="text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest mb-3">{groupName}</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(fields).map(([label, value]) => (
                    <div key={label} className="bg-[#1a1025] rounded-lg p-2.5 border border-[#2d1b4e]">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label.replace(/_/g,' ')}</p>
                        <FieldValue label={label} value={value} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Delivery content inline preview */
function DeliveredContentPanel({ item }) {
    if (item.delivery_status !== 'delivered' || !item.delivery_link) return null;
    const url = item.delivery_link;
    const ext = url.split('?')[0].split('.').pop().toLowerCase();
    const isImg = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
    const isVid = ['mp4','mov','webm','mkv','avi'].includes(ext);
    const expired = item.download_expires_at && new Date(item.download_expires_at) < new Date();

    return (
        <div className="mt-4 pt-4 border-t border-[#2d1b4e] border-dashed">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCheckCircle} /> Delivered Content
                </h4>
                {item.download_expires_at && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${expired ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {expired ? 'Expired' : `Until ${fmtDate(item.download_expires_at)}`}
                    </span>
                )}
            </div>
            <div className="bg-[#130C1C] rounded-xl border border-[#2d1b4e] p-3">
                {isImg && (
                    <div className="space-y-2">
                        <img src={url} alt="Delivered" className="w-full max-h-64 object-contain rounded-lg border border-[#2d1b4e] bg-[#0d0816]" />
                        <div className="flex gap-2">
                            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 rounded-lg hover:bg-[#a78bfa]/20 transition-all">
                                <FontAwesomeIcon icon={faEye} /> View Full
                            </a>
                            <a href={url} download className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#2d1b4e] text-gray-300 rounded-lg hover:bg-[#3b2a5f] transition-all">
                                <FontAwesomeIcon icon={faDownload} /> Download
                            </a>
                        </div>
                    </div>
                )}
                {isVid && (
                    <div className="space-y-2">
                        <video src={url} controls className="w-full max-h-64 rounded-lg border border-[#2d1b4e] bg-black" />
                        <a href={url} download className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#2d1b4e] text-gray-300 rounded-lg hover:bg-[#3b2a5f] transition-all">
                            <FontAwesomeIcon icon={faDownload} /> Download Video
                        </a>
                    </div>
                )}
                {!isImg && !isVid && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                            <FontAwesomeIcon icon={faFile} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-200">Delivered File (.{ext || 'file'})</p>
                            <p className="text-xs text-gray-500">Click to open or download</p>
                        </div>
                        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 rounded-lg hover:bg-[#a78bfa]/20 transition-all">
                            <FontAwesomeIcon icon={faEye} /> Open
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-[#130C1C]/50 rounded-xl border border-[#2d1b4e]">
            <div className="w-7 h-7 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa] flex-shrink-0 mt-0.5">
                <FontAwesomeIcon icon={icon} className="text-xs" />
            </div>
            <div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-gray-200 mt-0.5">{value || '—'}</p>
            </div>
        </div>
    );
}

function OrderDetails() {
    const authUser = getAuthUser() || {};
    const canEdit = authUser.is_super_admin || authUser.permissions?.orders?.includes('edit');
    const canDelete = authUser.is_super_admin || authUser.permissions?.orders?.includes('delete');

    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);

    useEffect(() => { if (id) fetchOrderDetails(); }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const token = getAuthToken();
            if (!token) { router.push('/login'); return; }
            const [orderRes, tlRes] = await Promise.allSettled([
                axios.get(`${API_URL}/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/admin/orders/${id}/timeline`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (orderRes.status === 'fulfilled') setOrder(orderRes.value.data);
            if (tlRes.status === 'fulfilled') setTimeline(Array.isArray(tlRes.value.data) ? tlRes.value.data : []);
        } catch (err) {
            console.error('Fetch error', err);
        } finally { setLoading(false); }
    };

    const handleRemoveDelivery = async (itemId) => {
        if (!confirm('Remove this delivery? This will reset item status to pending.')) return;
        setActionLoadingId(itemId);
        try {
            const token = getAuthToken();
            await axios.put(`${API_URL}/api/admin/orders/items/${itemId}/remove-delivery`, {}, { headers: { Authorization: `Bearer ${token}` } });
            await fetchOrderDetails();
        } catch { alert('Failed to remove delivery'); }
        finally { setActionLoadingId(null); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-4xl" />
        </div>
    );
    if (!order) return (
        <div className="text-center py-20 text-red-400">Order not found.</div>
    );

    const deliveredCount = order.items?.filter(i => i.delivery_status === 'delivered').length || 0;
    const totalItems = order.items?.length || 0;
    const phone = order.user?.phone_number && typeof order.user.phone_number === 'object'
        ? `${order.user.phone_number.code || ''} ${order.user.phone_number.number || ''}`
        : order.user?.phone_number || '—';

    const tlColors = {
        ORDER_PLACED:    { dot: 'bg-blue-400',   text: 'text-blue-300' },
        ASSIGNED:        { dot: 'bg-indigo-400',  text: 'text-indigo-300' },
        REASSIGNED:      { dot: 'bg-orange-400',  text: 'text-orange-300' },
        PICKED_UP:       { dot: 'bg-amber-400',   text: 'text-amber-300' },
        PROGRESS_UPDATE: { dot: 'bg-cyan-400',    text: 'text-cyan-300' },
        DELIVERED:       { dot: 'bg-purple-400',  text: 'text-purple-300' },
        COMPLETED:       { dot: 'bg-emerald-400', text: 'text-emerald-300' },
    };

    return (
        <>
            <DeliveryModal
                isOpen={isDeliveryModalOpen}
                onClose={() => { setIsDeliveryModalOpen(false); setSelectedItemId(null); }}
                orderId={order.order_id}
                itemId={selectedItemId}
                onSuccess={fetchOrderDetails}
            />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-[#1a1025] border border-[#2d1b4e] flex items-center justify-center text-gray-400 hover:text-[#a78bfa] hover:bg-[#2d1b4e] transition-all">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Order #{order.order_id.slice(0, 8).toUpperCase()}</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Placed on {fmtDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                    {deliveredCount === totalItems && totalItems > 0 ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">✓ Fully Delivered</span>
                    ) : deliveredCount > 0 ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{deliveredCount}/{totalItems} Delivered</span>
                    ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {order.status?.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Items */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] overflow-hidden">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2d1b4e]">
                            <FontAwesomeIcon icon={faBox} className="text-[#a78bfa]" />
                            <h2 className="text-base font-bold text-white">Order Items ({totalItems})</h2>
                            <span className="ml-auto text-xs text-gray-500">₹{order.total_amount?.toLocaleString()} total</span>
                        </div>
                        <div className="divide-y divide-[#2d1b4e]">
                            {order.items?.map((item, idx) => {
                                const cust = item.customization && typeof item.customization === 'object' ? item.customization : null;
                                return (
                                    <div key={idx} className="p-5">
                                        {/* Item header */}
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-[#2d1b4e] rounded-xl border border-[#3b2a5f] overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                                                {item.product?.thumbnail ? (
                                                    <img 
                                                        src={item.product.thumbnail} 
                                                        alt="Product" 
                                                        className="w-full h-full object-cover" 
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} 
                                                    />
                                                ) : null}
                                                <div className={item.product?.thumbnail ? "hidden" : "block"}>
                                                    <FontAwesomeIcon icon={faBox} className="text-gray-500 text-xl" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">{item.product?.title || <span className="text-red-400 italic">Deleted Product / Unknown</span>}</h3>
                                                        <p className="text-xs text-gray-500 mt-0.5">₹{item.price_at_purchase?.toLocaleString()} × {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-bold text-[#a78bfa]">₹{(item.price_at_purchase * item.quantity)?.toLocaleString()}</p>
                                                        <div className="flex items-center gap-1.5 mt-2 justify-end">
                                                            {item.delivery_status === 'delivered' ? (
                                                                <>
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                                        <FontAwesomeIcon icon={faCheckCircle} /> Delivered
                                                                    </span>
                                                                    {canEdit && (
                                                                        <button onClick={() => { setSelectedItemId(item.order_item_id); setIsDeliveryModalOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2d1b4e] text-gray-400 hover:text-[#a78bfa] hover:bg-[#a78bfa]/10 transition-all border border-transparent hover:border-[#a78bfa]/20" title="Edit Delivery">
                                                                            <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                                                        </button>
                                                                    )}
                                                                    {canDelete && (
                                                                        <button onClick={() => handleRemoveDelivery(item.order_item_id)} disabled={actionLoadingId === item.order_item_id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2d1b4e] text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 disabled:opacity-50" title="Remove Delivery">
                                                                            {actionLoadingId === item.order_item_id ? <FontAwesomeIcon icon={faCircleNotch} spin className="text-xs" /> : <FontAwesomeIcon icon={faTrash} className="text-xs" />}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            ) : order.status === 'paid' && canEdit && (
                                                                <button onClick={() => { setSelectedItemId(item.order_item_id); setIsDeliveryModalOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 transition-all shadow-lg shadow-purple-900/20">
                                                                    <FontAwesomeIcon icon={faPaperPlane} /> Deliver Content
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivered file preview */}
                                        <DeliveredContentPanel item={item} />

                                        {/* Customer customization */}
                                        {cust && Object.keys(cust).length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-[#2d1b4e] border-dashed">
                                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Customer Submitted Details</h4>
                                                <div className="space-y-3">
                                                    {Object.entries(cust).map(([groupName, fields]) => (
                                                        typeof fields === 'object' && fields !== null && !Array.isArray(fields) && !fields.url && fields.code === undefined
                                                            ? <CustomizationGroup key={groupName} groupName={groupName} fields={fields} />
                                                            : (
                                                                <div key={groupName} className="bg-[#130C1C] rounded-xl border border-[#2d1b4e] p-3">
                                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">{groupName.replace(/_/g,' ')}</p>
                                                                    <FieldValue label={groupName} value={fields} />
                                                                </div>
                                                            )
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Payment summary */}
                        <div className="px-6 py-4 border-t border-[#2d1b4e] bg-[#130C1C]/50 space-y-1.5">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Subtotal</span>
                                <span>₹{order.items?.reduce((s,i) => s + i.price_at_purchase * i.quantity, 0)?.toLocaleString()}</span>
                            </div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-400">
                                    <span>Discount {order.coupon_code && <span className="text-xs opacity-70">({order.coupon_code})</span>}</span>
                                    <span>−₹{order.discount_amount?.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold text-white border-t border-[#2d1b4e] pt-2 mt-1">
                                <span>Total Paid</span>
                                <span>₹{order.total_amount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Customer + Payment + Timeline */}
                <div className="space-y-5">
                    {/* Customer Info */}
                    <div className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] p-5">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#2d1b4e]">
                            <FontAwesomeIcon icon={faUser} className="text-[#a78bfa]" /> Customer Info
                        </h2>
                        <div className="space-y-3">
                            <InfoRow icon={faUser} label="Name" value={`${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim()} />
                            <InfoRow icon={faEnvelope} label="Email" value={order.user?.email} />
                            <InfoRow icon={faPhone} label="Phone" value={phone} />
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] p-5">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#2d1b4e]">
                            <FontAwesomeIcon icon={faCreditCard} className="text-sky-400" /> Payment
                        </h2>
                        <div className="space-y-3">
                            <InfoRow icon={faHashtag} label="Order ID" value={order.order_id.slice(0,12).toUpperCase()} />
                            <InfoRow icon={faCreditCard} label="Method" value={order.payment?.mode?.toUpperCase() || 'Online'} />
                            <InfoRow icon={faCalendarDays} label="Date" value={fmtDate(order.createdAt)} />
                            {order.payment?.razorpay_payment_id && (
                                <div className="p-2.5 bg-[#130C1C]/50 rounded-xl border border-[#2d1b4e]">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Transaction ID</p>
                                    <p className="text-xs text-gray-300 font-mono break-all">{order.payment.razorpay_payment_id}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Staff Assignment */}
                    <div className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] p-5">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#2d1b4e]">
                            <FontAwesomeIcon icon={faUserShield} className="text-emerald-400" /> Staff Assignment
                        </h2>
                        {order.assignedEmployee ? (
                            <div className="space-y-3">
                                <InfoRow icon={faUserShield} label="Assigned To" value={`${order.assignedEmployee.first_name || ''} ${order.assignedEmployee.last_name || ''}`.trim()} />
                                <InfoRow icon={faCheckCircle} label="Role" value={order.assignedEmployee.role?.replace('_', ' ') || 'Staff'} />
                            </div>
                        ) : (
                            <p className="text-gray-500 text-xs text-center py-2 italic">Unassigned</p>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-[#1a1025] rounded-2xl border border-[#2d1b4e] p-5">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#2d1b4e]">
                            <FontAwesomeIcon icon={faClock} className="text-amber-400" /> Order Timeline
                        </h2>
                        {timeline.length === 0 ? (
                            <p className="text-gray-600 text-xs text-center py-4">No events yet.</p>
                        ) : (
                            <div className="relative pl-5 border-l border-[#2d1b4e] space-y-4">
                                {timeline.map(event => {
                                    const cfg = tlColors[event.action] || { dot: 'bg-gray-400', text: 'text-gray-300' };
                                    return (
                                        <div key={event.timeline_id} className="relative">
                                            <div className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 border-[#1a1025] ${cfg.dot}`} />
                                            <p className={`text-xs font-semibold ${cfg.text}`}>{event.status_label}</p>
                                            {event.actor?.first_name || event.actor_name ? (
                                                <p className="text-gray-400 text-[9px] font-medium mt-0.5">
                                                    By: {event.actor?.first_name || event.actor_name} 
                                                    {event.actor?.role || event.actor_role ? ` (${(event.actor?.role || event.actor_role).replace('_', ' ')})` : ''}
                                                </p>
                                            ) : null}
                                            <p className="text-gray-600 text-[10px] mt-0.5">{fmt(event.event_at)}</p>
                                            {event.notes && <p className="text-gray-500 text-[10px] mt-0.5 italic">{event.notes}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default withPermission(OrderDetails, 'orders');
