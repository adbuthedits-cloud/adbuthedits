import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen, faCheckCircle, faClock, faDownload, faShoppingBag,
    faChevronRight, faSpinner, faCircleExclamation, faTimes, faStar
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewForm from '../components/ReviewForm';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';
import { cdnImage } from '../utils/cdn';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function formatDate(d) {
    if (!d) return '';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
}

function DeliveryBadge({ item }) {
    if (item.delivery_status !== 'delivered') return null;
    const expired = item.download_expires_at && new Date(item.download_expires_at) < new Date();
    const nearExpiry = !expired && item.download_expires_at &&
        (new Date(item.download_expires_at) - new Date()) < 7 * 24 * 60 * 60 * 1000;

    return (
        <div className="mt-1 flex flex-wrap items-center gap-2">
            {expired ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                    <FontAwesomeIcon icon={faCircleExclamation} className="text-[9px]" /> Link Expired
                </span>
            ) : (
                <button
                    onClick={async (e) => {
                        e.preventDefault();
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_URL}/api/orders/items/${item.order_item_id}/download`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const d = await res.json();
                            if (d.url) window.open(d.url, '_blank');
                            else alert(d.msg || 'Could not generate download link');
                        } catch { alert('Error downloading file'); }
                    }}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors font-bold"
                >
                    <FontAwesomeIcon icon={faDownload} className="text-[9px]" /> Download
                </button>
            )}
            {item.download_expires_at && !expired && (
                <span className={`text-[10px] ${nearExpiry ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
                    Exp: {formatDate(item.download_expires_at)}
                </span>
            )}
        </div>
    );
}

export default function Orders() {
    const { seoData } = useSeo('orders');
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
    const [activeProductForReview, setActiveProductForReview] = useState(null);

    // Trigger review modal when new_order_id query param is present
    useEffect(() => {
        if (router.query.new_order_id && orders.length > 0) {
            const foundOrder = orders.find(o => o.order_id === router.query.new_order_id);
            if (foundOrder) {
                setSelectedOrderForReview(foundOrder);
                // If there's only 1 item in the order, auto-select it for review
                if (foundOrder.items && foundOrder.items.length === 1) {
                    setActiveProductForReview(foundOrder.items[0].product);
                }
            }
        }
    }, [router.query.new_order_id, orders]);

    const handleCloseReviewModal = () => {
        setSelectedOrderForReview(null);
        setActiveProductForReview(null);
        // Clean URL query params cleanly
        const { new_order_id, ...restQuery } = router.query;
        router.replace({
            pathname: router.pathname,
            query: restQuery
        }, undefined, { shallow: true });
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setLoading(false); return; }
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.status === 401) { router.push('/login'); return; }
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            } catch { setOrders([]); }
            finally { setLoading(false); }
        })();
    }, [user, authLoading, router]);

    const getStatusInfo = (order) => {
        const total = order.items?.length || 0;
        const delivered = order.items?.filter(i => i.delivery_status === 'delivered').length || 0;
        if ((total > 0 && delivered === total) || ['delivered', 'completed'].includes(order.status)) return { label: 'Delivered', cls: 'bg-purple-600 text-white', icon: faCheckCircle };
        if (delivered > 0) return { label: `${delivered}/${total} Delivered`, cls: 'bg-purple-100 text-purple-700', icon: faCheckCircle };
        if (['inprocessing', 'in_progress'].includes(order.status)) return { label: 'In Progress', cls: 'bg-amber-100 text-amber-700', icon: faClock };
        if (order.status === 'pending') return { label: 'Pending Payment', cls: 'bg-amber-100 text-amber-700', icon: faClock };
        if (['failed', 'cancelled'].includes(order.status)) return { label: 'Cancelled', cls: 'bg-red-100 text-red-700', icon: faCircleExclamation };
        return { label: 'Order Placed', cls: 'bg-blue-100 text-blue-700', icon: faCheckCircle };
    };

    const renderContent = () => {
        if (authLoading || loading) return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-purple-600 text-4xl" />
            </div>
        );

        if (!user) return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your orders</h1>
                <Link href="/login" className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all">Login Now</Link>
            </div>
        );

        if (orders.length === 0) return (
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FontAwesomeIcon icon={faBoxOpen} className="text-3xl text-gray-300" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h1>
                    <p className="text-gray-500 mb-8">You haven't placed any orders yet.</p>
                    <Link href="/shop" className="px-8 py-3 bg-black text-white rounded-full font-medium hover:scale-105 transition-transform">Start Shopping</Link>
                </div>
            </div>
        );

        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-8">
                    <FontAwesomeIcon icon={faShoppingBag} className="text-purple-600 text-2xl" />
                    <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                    <span className="ml-auto text-sm text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                </div>


                <div className="space-y-4">
                    {orders.map(order => {
                        const status = getStatusInfo(order);
                        const orderRef = order.order_id.slice(0, 8).toUpperCase();
                        // Quick-access delivered items for this order
                        const deliveredItems = order.items?.filter(i => i.delivery_status === 'delivered') || [];

                        return (
                            <div key={order.order_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
                                {/* Header row */}
                                <Link href={`/order/${order.order_id}`} className="block">
                                    <div className="flex flex-wrap gap-4 justify-between items-center px-6 py-4 border-b border-gray-50">
                                        <div className="flex flex-wrap gap-5 text-sm">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-0.5">Order ID</p>
                                                <p className="font-bold text-gray-900 font-mono">#{orderRef}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-0.5">Date</p>
                                                <p className="font-medium text-gray-700">{formatDate(order.createdAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-0.5">Total</p>
                                                <p className="font-bold text-gray-900">₹{order.total_amount?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-0.5">Items</p>
                                                <p className="font-medium text-gray-700">{order.items?.length || 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${status.cls}`}>
                                                <FontAwesomeIcon icon={status.icon} className="text-[10px]" />
                                                {status.label}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-purple-600 font-semibold">
                                                View Details <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Items list — compact */}
                                <div className="px-6 py-4">
                                    <div className="space-y-3">
                                        {order.items?.map(item => (
                                            <div key={item.order_item_id} className="flex items-center gap-3">
                                                {/* Thumbnail */}
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                    {(item.product?.thumbnail || item.product?.images?.[0]) && (
                                                        <img src={cdnImage(item.product.thumbnail || item.product.images[0])} alt={item.product.title} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                                {/* Name + status */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                        {item.delivery_status === 'delivered' && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700">
                                                                ✓ Delivered
                                                            </span>
                                                        )}
                                                        {/* Quick download badge */}
                                                        <DeliveryBadge item={item} />
                                                    </div>
                                                </div>
                                                {/* Price */}
                                                <p className="text-sm font-bold text-gray-900 flex-shrink-0">₹{item.price_at_purchase?.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <SeoHead
                title={seoData?.meta_title || 'My Orders | Adbuth Edits'}
                description={seoData?.meta_description || 'Track your orders and download your files.'}
                data={seoData}
            />
            <Navbar isdark={false} />
            <main className="flex-grow pt-32 pb-12">{renderContent()}</main>
            <Footer />

            {/* Review Prompt Modal */}
            <AnimatePresence>
                {selectedOrderForReview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={handleCloseReviewModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl flex flex-col no-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleCloseReviewModal}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-50"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>

                            {/* Header (only on selection screen) */}
                            {!activeProductForReview && (
                                <div className="text-center mb-6">
                                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Share Your Thoughts!</h3>
                                    <p className="text-sm text-gray-500">Thank you for your purchase. We would love to hear your feedback on the product.</p>
                                </div>
                            )}

                            {/* Product Selection (if multiple) */}
                            {!activeProductForReview && selectedOrderForReview.items && selectedOrderForReview.items.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select a product to review</p>
                                    {selectedOrderForReview.items.map(item => (
                                        <button
                                            key={item.order_item_id}
                                            onClick={() => setActiveProductForReview(item.product)}
                                            className="w-full flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50/20 text-left transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                                                {(item.product?.thumbnail || item.product?.images?.[0]) && (
                                                    <img src={cdnImage(item.product.thumbnail || item.product.images[0])} alt={item.product.title} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-700 transition-colors">{item.product?.title}</p>
                                                <p className="text-xs text-purple-600 font-semibold flex items-center gap-1 mt-0.5">
                                                    Write Review <FontAwesomeIcon icon={faChevronRight} className="text-[8px] transform group-hover:translate-x-0.5 transition-transform" />
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Review Form */}
                            {activeProductForReview && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    {/* Back to selection button if multiple items */}
                                    {selectedOrderForReview.items && selectedOrderForReview.items.length > 1 && (
                                        <button
                                            onClick={() => setActiveProductForReview(null)}
                                            className="text-xs font-bold text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-1 hover:underline self-start"
                                        >
                                            &larr; Back to items
                                        </button>
                                    )}

                                    {/* Product Details Header */}
                                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                                            {(activeProductForReview.thumbnail || activeProductForReview.images?.[0]) && (
                                                <img src={cdnImage(activeProductForReview.thumbnail || activeProductForReview.images[0])} alt={activeProductForReview.title} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-400 font-medium">Reviewing</p>
                                            <p className="text-sm font-bold text-gray-800 truncate">{activeProductForReview.title}</p>
                                        </div>
                                    </div>

                                    {/* Review form component */}
                                    <div className="flex-1 min-h-0">
                                        <ReviewForm
                                            products_id={activeProductForReview.products_id}
                                            onReviewSubmitted={() => {
                                                handleCloseReviewModal();
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
