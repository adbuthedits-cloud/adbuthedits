import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

import Image from 'next/image';
import Script from 'next/script';
import CustomizationForm from '../components/CustomizationForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes, faShoppingBag, faPen, faHeart, faPlus, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';
import { cdnImage } from '../utils/cdn';

export default function Cart() {
    const { seoData } = useSeo('cart');
    const { user, loading: authLoading, isProfileComplete, openProfileModal } = useAuth();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subtotal, setSubtotal] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const router = useRouter();

    // Edit Mode State
    const [editingItem, setEditingItem] = useState(null);
    const [editData, setEditData] = useState({});
    
    // Delete/Wishlist Modal State
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    const { toggleWishlist } = useWishlist();

    useEffect(() => {
        if (authLoading) return;
        if (user) {
            fetchCart();
        } else {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchCart = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/cart`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.setItem('intendedDestination', router.asPath);
                router.push('/login');
                return;
            }

            const data = await res.json();
            setCart(data);
            calculateTotal(data.items || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch cart', error);
            setLoading(false);
        }
    };

    const calculateTotal = (items) => {
        const total = items.reduce((sum, item) => {
            return sum + (item.product?.price || 0) * (item.quantity || 1);
        }, 0);
        setSubtotal(total);
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditData(item.customization || {});
    };

    const buildProductUrl = (product) => {
        if (!product) return '#';
        const pSlug = product.parentCategory?.slug || 'all';
        const cSlug = product.assetCategory?.slug || 'templates';
        const sSlug = product.assetSubCategory?.slug || 'general';
        return `/shop/${pSlug}/${cSlug}/${sSlug}/${product.slug}`;
    };

    const handleEditChange = (group, label, value) => {
        setEditData(prev => ({
            ...prev,
            [group]: {
                ...prev[group],
                [label]: value
            }
        }));
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/cart/${editingItem.cart_item_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ customization: editData })
            });

            if (res.ok) {
                showToast('Item updated successfully', 'success');
                setEditingItem(null); // Close modal
                fetchCart(); // Refresh data
            } else {
                showToast('Failed to update item', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showToast('Something went wrong', 'error');
        }
    };

    const removeItem = async (itemId) => {
        setIsProcessingAction(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/cart/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const updatedItems = cart.items.filter(item => item.cart_item_id !== itemId);
                setCart({ ...cart, items: updatedItems });
                calculateTotal(updatedItems);
                showToast('Item removed permanently', 'success');
                setItemToDelete(null);
            } else {
                showToast('Failed to remove item', 'error');
            }
        } catch (error) {
            console.error('Remove error:', error);
            showToast('Something went wrong', 'error');
        } finally {
            setIsProcessingAction(false);
        }
    };

    const moveToWishlist = async (itemId) => {
        setIsProcessingAction(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/wishlist/from-cart/${itemId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const updatedItems = cart.items.filter(item => item.cart_item_id !== itemId);
                setCart({ ...cart, items: updatedItems });
                calculateTotal(updatedItems);
                showToast('Item moved to wishlist!', 'success');
                setItemToDelete(null);
                
                // Refresh wishlist context if we had a programmatic way, otherwise local state update is enough
                // as the wishlist page will re-fetch anyway.
            } else {
                showToast('Failed to move to wishlist', 'error');
            }
        } catch (error) {
            console.error('Wishlist move error:', error);
            showToast('Something went wrong', 'error');
        } finally {
            setIsProcessingAction(false);
        }
    };

    const showToast = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
    };

    const validateCart = () => {
        if (!cart || !cart.items) return null;

        for (const item of cart.items) {
            // Check if product has customization schema
            if (!item.product?.customization) continue;

            const schema = typeof item.product.customization === 'string'
                ? JSON.parse(item.product.customization)
                : item.product.customization;

            // If schema is empty or not array, skip
            if (!Array.isArray(schema) || schema.length === 0) continue;

            const userData = item.customization || {};

            let isInvalid = false;

            // Check each group and field
            for (const groupObj of schema) {
                const groupName = Object.keys(groupObj)[0];
                const fields = groupObj[groupName]; // Array of [label, type, options...]

                const userGroup = userData[groupName] || {};

                for (const field of fields) {
                    const label = field[0];
                    // Simple check: Value must exist and not be empty string
                    if (!userGroup[label] || (typeof userGroup[label] === 'string' && userGroup[label].trim() === '')) {
                        isInvalid = true;
                        break;
                    }
                }
                if (isInvalid) break;
            }

            if (isInvalid) return item;
        }
        return null; // All valid
    };

    const handleCheckout = () => {
        // 1. Check Profile Completion
        if (!isProfileComplete(user)) {
            openProfileModal({});
            return;
        }

        // 2. Validate Customization
        const invalidItem = validateCart();
        if (invalidItem) {
            setEditingItem(invalidItem);
            setEditData(invalidItem.customization || {});
            showToast(`Please complete customization for ${invalidItem.product?.title}`, 'error');
            return;
        }

        // 3. Redirect to Checkout Page
        router.push('/checkout');
    };

    // ... (previous logic remains)

    const renderContent = () => {
        if (authLoading || loading) {
            return (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            );
        }

        if (!user) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your cart</h1>
                    <Link href="/login" className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all">
                        Login Now
                    </Link>
                </div>
            );
        }

        if (!cart || !cart.items || cart.items.length === 0) {
            return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-3xl shadow-sm border border-white">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <FontAwesomeIcon icon={faShoppingBag} className="text-3xl text-gray-300" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
                        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                        <Link href="/shop" className="px-8 py-3 bg-black text-white rounded-full font-medium hover:scale-105 transition-transform">
                            Start Shopping
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map((item) => (
                            <div key={item.cart_item_id} className="bg-white p-4 rounded-2xl shadow-sm border border-white flex gap-6 hover:shadow-md transition-shadow">
                                {/* Product Image */}
                                <Link href={buildProductUrl(item.product)} className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100 shrink-0 hover:opacity-90 transition-opacity flex items-center justify-center">
                                    {item.product?.thumbnail || item.product?.images?.[0] ? (
                                        <img
                                            src={cdnImage(item.product.thumbnail || item.product.images[0])}
                                            alt={item.product.title || 'Product'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-300 text-[10px]">No Preview</span>
                                        </div>
                                    )}
                                </Link>

                                {/* Details */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <Link href={buildProductUrl(item.product)} className="hover:text-purple-600 transition-colors">
                                                <h3 className="font-bold text-gray-900 text-lg">{item.product?.title}</h3>
                                            </Link>
                                            <p className="text-sm text-gray-500">₹{item.product?.price}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                                            >
                                                <FontAwesomeIcon icon={faPen} />
                                            </button>
                                            <button
                                                onClick={() => setItemToDelete(item)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </div>

                                    {item.customization && Object.keys(item.customization).length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-3">
                                            {Object.entries(item.customization).map(([groupName, fields]) => (
                                                <div key={groupName} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                                    <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">{groupName}</h4>
                                                    <div className="flex flex-col gap-y-1.5">
                                                        {Object.entries(fields).map(([label, value]) => (
                                                            <div key={label} className="text-xs flex gap-1">
                                                                <span className="font-medium text-gray-400">{label}:</span>
                                                                <span className="text-gray-700 font-medium flex items-center">
                                                                    {typeof value === 'object' && value !== null && value.url ? (
                                                                        value.url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                                                                            <a href={value.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1">
                                                                                <img src={value.url} alt={value.name || 'Uploaded File'} className="h-10 w-10 object-cover rounded shadow-sm border border-gray-200 hover:opacity-80 transition-opacity" />
                                                                            </a>
                                                                        ) : (
                                                                            <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-medium">
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
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-white sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax (Integrated)</span>
                                    <span className="text-green-600 font-medium">₹0</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                    <span className="font-bold text-gray-900 text-lg">Total</span>
                                    <span className="font-bold text-purple-600 text-2xl">₹{subtotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Profile Incomplete Warning */}
                            {user && !isProfileComplete(user) && (
                                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                    <p className="text-amber-800 font-bold text-sm mb-1">⚠ Complete Your Profile</p>
                                    <p className="text-amber-700 text-xs mb-2 leading-relaxed">
                                        To place orders, you need:
                                        {!user.first_name && <span className="block">• Your name</span>}
                                        {!user.email && <span className="block">• Email address</span>}
                                        {!user.phone_number && <span className="block">• Phone number</span>}
                                    </p>
                                    <button
                                        onClick={() => openProfileModal({})}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                                    >
                                        Complete Profile
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    user && !isProfileComplete(user)
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-black text-white hover:bg-gray-900 hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                            >
                                {loading ? 'Processing...' : user && !isProfileComplete(user) ? '⚠ Profile Incomplete' : 'Checkout'}
                            </button>

                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                                <FontAwesomeIcon icon={faShoppingBag} />
                                <span>Secure Checkout via Stripe / Razorpay</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Shopping Cart | Adbuth Edits"}
                description={seoData?.meta_description || seoData?.description || "Review your cart items."}
                data={seoData}
            />
            <main className="flex-grow pt-32 pb-12">
                {renderContent()}
            </main>

            {/* EDIT CUSTOMIZATION MODAL */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Edit Customization</h3>
                                <p className="text-sm text-gray-500">Update details for {editingItem.product?.title}</p>
                            </div>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                            >
                                <FontAwesomeIcon icon={faTimes /* Using trash icon as close x for now or import faTimes */} className="" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <CustomizationForm
                                schema={typeof editingItem.product?.customization === 'string' ? JSON.parse(editingItem.product?.customization) : editingItem.product?.customization}
                                data={editData}
                                onChange={handleEditChange}
                                isEditMode={true}
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateItem}
                                className="px-8 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE / WISHLIST CONFIRMATION MODAL */}
            <AnimatePresence>
                {itemToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isProcessingAction && setItemToDelete(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FontAwesomeIcon icon={faTrash} className="text-2xl text-red-500" />
                            </div>
                            
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Remove from Cart?</h3>
                            <p className="text-gray-500 text-sm mb-8 px-4">
                                You can save this customized item to your wishlist for later, or remove it permanently.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    disabled={isProcessingAction}
                                    onClick={() => moveToWishlist(itemToDelete.cart_item_id)}
                                    className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    <FontAwesomeIcon icon={faHeart} className="group-hover:scale-110 transition-transform" />
                                    {isProcessingAction ? 'Moving...' : 'Save for Later (Wishlist)'}
                                </button>
                                
                                <button
                                    disabled={isProcessingAction}
                                    onClick={() => removeItem(itemToDelete.cart_item_id)}
                                    className="w-full bg-gray-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-50 hover:text-red-700 transition-all border border-red-100/50"
                                >
                                    {isProcessingAction ? 'Removing...' : 'Remove Permanently'}
                                </button>

                                <button
                                    disabled={isProcessingAction}
                                    onClick={() => setItemToDelete(null)}
                                    className="w-full py-3 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm mt-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl text-white transform transition-all duration-300 z-50 flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            <Footer />
        </div>
    );
}
