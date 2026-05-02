import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShieldAlt, faCheckCircle, faArrowLeft, faTags, faTimes, faTag } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Checkout() {
    const { seoData } = useSeo('checkout');
    const { user, loading: authLoading } = useAuth();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const router = useRouter();

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

    // Available Coupons State
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [showCouponModal, setShowCouponModal] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            localStorage.setItem('intendedDestination', '/checkout');
            router.push('/login');
            return;
        }
        fetchCart();
        fetchAvailableCoupons();
    }, [user, authLoading]);

    const fetchAvailableCoupons = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/coupons/available`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableCoupons(data);
            }
        } catch (error) {
            console.error('Failed to fetch available coupons', error);
        }
    };

    const fetchCart = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (!data.items || data.items.length === 0) {
                    router.push('/cart');
                    return;
                }
                setCart(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getSubtotal = () => {
        if (!cart?.items) return 0;
        return cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1), 0);
    };

    const calculateTotal = () => {
        const subtotal = getSubtotal();
        return Math.max(0, subtotal - discount);
    };

    const handleApplySpecificCoupon = (code) => {
        setCouponCode(code);
        setShowCouponModal(false);
        // We use setTimeout to let the state update before triggering the apply function
        setTimeout(() => handleApplyCoupon(code), 50);
    };

    const handleApplyCoupon = async (codeToApply = couponCode) => {
        const targetingCode = typeof codeToApply === 'string' ? codeToApply : couponCode;
        if (!targetingCode.trim()) return;
        setCouponMessage({ type: '', text: '' });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const subtotal = getSubtotal();

            // Map cart items for category/product validation
            const cartContext = cart?.items?.map(item => ({
                product_id: item.product?.products_id,
                parent_category_id: item.product?.parent_category_id
            })) || [];

            const res = await fetch(`${apiUrl}/api/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    code: targetingCode, 
                    totalAmount: subtotal,
                    cartItems: cartContext
                })
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setDiscount(data.discount);
                setAppliedCoupon(data.code); // Only one coupon at a time
                setCouponMessage({ type: 'success', text: `Coupon applied: ₹${data.discount} saved!` });
                if (data.max_cap_applied) {
                    setCouponMessage(prev => ({ ...prev, text: prev.text + " (Max discount limit reached)" }));
                }
                // Trigger Confetti Pop
                if (window.confetti) {
                    window.confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            } else {
                setDiscount(0);
                setAppliedCoupon(null);
                setCouponMessage({ 
                    type: 'error', 
                    text: data.message || data.error || 'Invalid Coupon' 
                });
            }
        } catch (err) {
            setDiscount(0);
            setAppliedCoupon(null);
            setCouponMessage({ type: 'error', text: 'Failed to validate coupon' });
        }
    };

    const handleRemoveCoupon = () => {
        setCouponCode('');
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponMessage({ type: '', text: '' });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        setProcessing(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');

            // 1. Create Payment Order
            const res = await fetch(`${apiUrl}/api/orders/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    couponCode: appliedCoupon // Send the applied coupon
                })
            });

            if (!res.ok) throw new Error('Failed to initiate payment');

            const orderData = await res.json();

            // 2. Open Razorpay
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Adbuth Edits",
                description: "Digital Order",
                order_id: orderData.id,
                prefill: {
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email,
                    contact: user.phone || ''
                },
                modal: {
                    ondismiss: function () {
                        showToast('Payment Cancelled', 'error');
                        setProcessing(false);
                    }
                },
                handler: async function (response) {
                    try {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                        const verifyRes = await fetch(`${apiUrl}/api/orders/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                couponCode: appliedCoupon // Pass coupon code to record usage
                            })
                        });

                        if (verifyRes.ok) {
                            showToast('Order Placed Successfully!', 'success');
                            setTimeout(() => {
                                router.push('/orders');
                            }, 1500);
                        } else {
                            showToast('Payment Verification Failed', 'error');
                            setProcessing(false);
                        }
                    } catch (err) {
                        console.error(err);
                        setProcessing(false);
                    }
                },
                theme: { color: "#9333ea" }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                showToast(`Payment Failed: ${response.error.description}`, 'error');
            });
            rzp1.open();

        } catch (error) {
            console.error('Checkout Error:', error);
            showToast('Something went wrong. Please try again.', 'error');
            setProcessing(false);
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="relative">
                {/* Main Spinning Ring */}
                <div className="w-16 h-16 rounded-full border-4 border-purple-600/20 border-t-purple-600 animate-spin"></div>
                {/* Inner Pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                </div>
            </div>
            <p className="mt-4 text-gray-600 font-bold tracking-tight animate-pulse">SETTING UP CHECKOUT...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Checkout | Adbuth Edits"}
                description={seoData?.meta_description || seoData?.description || "Complete your purchase securely."}
                data={seoData}
            />
            <Navbar isdark={false} />
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <Script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js" />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/cart" className="text-gray-500 hover:text-purple-600 flex items-center gap-2 text-sm font-medium w-max">
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Cart
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mt-4">Secure Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Contact info & Items */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Contact Info Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                                <FontAwesomeIcon icon={faLock} className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">Contact Information</h3>
                                <p className="text-gray-600 font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-gray-500 text-sm">{user.email}</p>
                                {user.phone && (
                                    <p className="text-gray-500 text-sm">
                                        {typeof user.phone === 'object'
                                            ? `${user.phone.code} ${user.phone.number}`
                                            : user.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Order Items Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-6 text-lg">Order Items ({cart?.items.length})</h3>
                            <div className="space-y-4">
                                {cart?.items.map(item => (
                                    <div key={item.cart_item_id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
                                        <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                            {item.product?.images && (
                                                <img src={item.product.images[0]} className="w-full h-full object-cover" alt={item.product?.title} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="font-bold text-gray-800 text-lg sm:text-base line-clamp-2 leading-snug mb-1">{item.product?.title}</h4>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>

                                            {item.customization && Object.keys(item.customization).length > 0 && (
                                                <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-3">
                                                    {Object.entries(item.customization).map(([groupName, fields]) => (
                                                        <div key={groupName} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                                            <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">{groupName}</h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                                                {Object.entries(fields).map(([label, value]) => (
                                                                    <div key={label} className="text-xs flex gap-1">
                                                                        <span className="font-medium text-gray-400">{label}:</span>
                                                                        <span className="text-gray-700 font-medium flex items-center">
                                                                            {typeof value === 'object' && value !== null && value.url ? (
                                                                                value.url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                                                                                    <a href={value.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1" onClick={(e) => e.stopPropagation()}>
                                                                                        <img src={value.url} alt={value.name || 'Uploaded File'} className="h-10 w-10 object-cover rounded shadow-sm border border-gray-200 hover:opacity-80 transition-opacity" />
                                                                                    </a>
                                                                                ) : (
                                                                                    <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                                                                                        {value.name || 'View File'}
                                                                                    </a>
                                                                                )
                                                                            ) : (typeof value === 'object' ? 'File Attached' : value)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col justify-center shrink-0">
                                            <p className="font-bold text-gray-900 text-lg">₹{(item.product?.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary, Coupons, and Pay (Sticky) */}
                    <div className="lg:col-span-5 relative">
                        <div className="bg-white rounded-2xl shadow-xl shadow-purple-500/5 border border-purple-100 overflow-hidden sticky top-28">

                            {/* Summary Header */}
                            <div className="bg-gradient-to-r from-[#2d1b4e] to-[#1a0b2e] p-6 text-white text-center">
                                <h3 className="font-bold text-xl drop-shadow-md">Order Summary</h3>
                            </div>

                            <div className="p-6">
                                {/* Coupon Logic */}
                                <div className="mb-8 pb-8 border-b border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-gray-800">Promo Code</label>
                                        {availableCoupons.length > 0 && (
                                            <button
                                                onClick={() => setShowCouponModal(true)}
                                                className="text-sm text-[#7D287E] font-bold flex items-center gap-1 hover:text-purple-800 transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faTags} /> View Offers
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            disabled={!!appliedCoupon}
                                            className="flex-1 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#7D287E] disabled:opacity-50 uppercase font-medium placeholder:normal-case shadow-inner"
                                        />
                                        {appliedCoupon ? (
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors shrink-0"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApplyCoupon()}
                                                disabled={!couponCode}
                                                className="bg-[#2d1b4e] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#1a0b2e] transition-colors disabled:opacity-50 shrink-0"
                                            >
                                                Apply
                                            </button>
                                        )}
                                    </div>
                                    {couponMessage.text && (
                                        <div className={`text-sm mt-3 p-3 rounded-lg flex items-center gap-2 ${couponMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                            {couponMessage.type === 'success' ? <FontAwesomeIcon icon={faCheckCircle} /> : <FontAwesomeIcon icon={faTimes} />}
                                            <span className="font-semibold">{couponMessage.text}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Totals Breakdown */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-gray-600 text-[15px]">
                                        <span>Subtotal</span>
                                        <span className="font-semibold">₹{getSubtotal().toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[15px]">
                                        <span className="text-gray-600">Total Discount</span>
                                        {discount > 0 ? (
                                            <span className="font-semibold text-green-600 bg-green-50 px-2 rounded">-₹{discount.toLocaleString()}</span>
                                        ) : (
                                            <span className="font-medium text-gray-400">-</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center text-2xl font-black pt-5 border-t border-gray-100 mt-2">
                                        <span className="text-gray-900">Total</span>
                                        <span className="text-[#2d1b4e]">₹{calculateTotal().toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <p className="text-right text-xs text-green-600 font-bold mt-1">
                                            You will save ₹{discount.toLocaleString()} on this order!
                                        </p>
                                    )}
                                </div>

                                {/* Trust Badges & Pay Button */}
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium mb-4">
                                        <FontAwesomeIcon icon={faShieldAlt} className="text-purple-600" />
                                        <span>256-bit Secure Encryption</span>
                                    </div>

                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={processing}
                                        className="w-full relative overflow-hidden group bg-[#7D287E] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#5a1c5b] shadow-lg shadow-purple-600/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            {processing ? (
                                                <>
                                                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                                    <span>Processing Securely...</span>
                                                </>
                                            ) : (
                                                `Pay ₹${calculateTotal().toLocaleString()}`
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                                    </button>

                                    <p className="text-center text-[11px] text-gray-400 mt-4 leading-relaxed">
                                        By placing your order, you agree to our Terms of Service and Privacy Policy. Payments are processed securely via Razorpay.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {toast.show && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl text-white z-50 animate-slideUp ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && <FontAwesomeIcon icon={faCheckCircle} />}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Coupons Modal (Myntra Style) */}
            {showCouponModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white w-full sm:w-[450px] max-h-[85vh] sm:max-h-[80vh] rounded-2xl sm:rounded-2xl flex flex-col shadow-2xl animate-slideUp sm:animate-fadeIn overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-2xl">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FontAwesomeIcon icon={faTags} className="text-purple-600" /> Available Offers
                            </h3>
                            <button
                                onClick={() => setShowCouponModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                            {availableCoupons.map((coupon) => {
                                const minOrderValue = coupon.min_order_value || 0;
                                const subtotal = getSubtotal();
                                const isEligible = subtotal >= minOrderValue;
                                const shortfall = minOrderValue - subtotal;

                                return (
                                    <div
                                        key={coupon.code}
                                        className={`bg-white border rounded-xl overflow-hidden transition-all ${isEligible ? 'border-purple-200 shadow-sm' : 'border-gray-200 opacity-75'
                                            }`}
                                    >
                                        <div className="p-4 flex gap-4">
                                            {/* Left Marker */}
                                            <div className="w-12 h-12 shrink-0 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 text-purple-600">
                                                <FontAwesomeIcon icon={faTag} className="text-xl" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="inline-block border border-purple-200 bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-md text-sm uppercase tracking-wide">
                                                        {coupon.code}
                                                    </div>

                                                    {isEligible ? (
                                                        <button
                                                            onClick={() => handleApplySpecificCoupon(coupon.code)}
                                                            className="text-sm font-bold text-purple-600 hover:text-purple-800 hover:underline"
                                                        >
                                                            APPLY
                                                        </button>
                                                    ) : null}
                                                </div>

                                                <p className="text-gray-800 font-bold text-[15px] mt-1">
                                                    Save {coupon.discount_type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                                </p>

                                                {minOrderValue > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        On minimum purchase of ₹{minOrderValue}
                                                    </p>
                                                )}

                                                {/* Ineligibility Warning */}
                                                {!isEligible && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs font-semibold text-red-500 bg-red-50 p-2 rounded-lg">
                                                        Add items worth ₹{shortfall.toLocaleString()} more to unlock
                                                    </div>
                                                )}

                                                {/* Expiry Warning */}
                                                {coupon.expiration_date && isEligible && (
                                                    <p className="text-[11px] text-orange-500 mt-2 font-medium">
                                                        Valid till {new Date(coupon.expiration_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
