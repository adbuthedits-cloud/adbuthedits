import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTrash, faShoppingCart, faArrowRight, faHeartBroken } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/shop/ProductCard';
import { useAuth } from '../context/AuthContext';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';
import toast from 'react-hot-toast';

// Skeleton loader — isolated inside main, below navbar
function WishlistSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <div className="h-9 bg-gray-200 rounded-lg w-48 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-5 bg-gray-100 rounded w-36" />
            </div>
            {/* Cards skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                        <div className="aspect-[2/3] bg-gray-200 rounded-xl mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Wishlist() {
    const { seoData } = useSeo('wishlist');
    const { user, loading: authLoading } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchWishlist = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/wishlist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.setItem('intendedDestination', router.asPath);
                    router.push('/login');
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    setWishlistItems(Array.isArray(data) ? data : []);
                } else {
                    setWishlistItems([]);
                }
            } catch (err) {
                console.error('Error fetching wishlist:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [authLoading, user]);

    const removeFromWishlist = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/wishlist/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setWishlistItems(prev => prev.filter(item => item.products_id !== id));
            }
        } catch (err) {
            console.error('Error removing from wishlist:', err);
        }
    };

    const handleAddToCart = async (product) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            // Use the specialized "Move from Wishlist" endpoint to preserve customization
            const res = await fetch(`${apiUrl}/api/cart/from-wishlist/${product.wishlist_id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                toast.success('Added to cart!', {
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
                
                // Remove from local wishlist state
                setWishlistItems(prev => prev.filter(item => item.wishlist_id !== product.wishlist_id));
            } else {
                const data = await res.json();
                toast.error(data.msg || 'Failed to add to cart');
            }
        } catch (err) {
            console.error('Error moving to cart:', err);
            toast.error('Something went wrong');
        }
    };

    const isLoading = authLoading || loading;

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "My Wishlist | Adbuth Edits"}
                description={seoData?.meta_description || seoData?.description || "Your saved items."}
                data={seoData}
            />

            <Navbar highlight="shop" isdark={false} />

            {isLoading ? (
                <WishlistSkeleton />
            ) : (
                <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16">

                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My Wishlist</h1>
                            <p className="text-gray-500 mt-1 text-sm">
                                You have {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} in your wishlist
                            </p>
                        </div>
                        <Link
                            href="/shop"
                            className="flex items-center gap-2 text-purple-700 font-semibold text-sm hover:underline group"
                        >
                            Continue Shopping
                            <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform text-xs" />
                        </Link>
                    </div>

                    {/* Not logged in */}
                    {!user ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FontAwesomeIcon icon={faHeart} className="text-3xl text-purple-700" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-gray-900">Please log in to see your wishlist</h2>
                            <p className="text-gray-500 mb-8 max-w-sm text-base">Save your favourite items and come back to them anytime.</p>
                            <Link
                                href="/login"
                                className="inline-block bg-purple-700 hover:bg-purple-800 text-white px-10 py-3.5 rounded-full font-bold text-base shadow-lg transition-all active:scale-95"
                            >
                                Log In / Sign Up
                            </Link>
                        </div>

                        /* Empty wishlist */
                    ) : wishlistItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <FontAwesomeIcon icon={faHeartBroken} className="text-4xl text-gray-300" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">Your wishlist is empty</h2>
                            <p className="text-gray-500 mb-10 max-w-md text-base leading-relaxed">
                                Browse our shop and add your favourite items to keep track of them.
                            </p>
                            <Link
                                href="/shop"
                                className="inline-block bg-purple-700 hover:bg-purple-800 text-white px-12 py-3.5 rounded-full font-bold text-base shadow-lg transition-all active:scale-95"
                            >
                                Start Shopping
                            </Link>
                        </div>

                        /* Wishlist items */
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                            <AnimatePresence>
                                {wishlistItems.map((product) => (
                                    <motion.div
                                        key={product.products_id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.92 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.92 }}
                                        transition={{ duration: 0.2 }}
                                        className="relative group"
                                    >
                                        {/* Remove button — appears on hover */}
                                        <button
                                            onClick={() => removeFromWishlist(product.products_id)}
                                            className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100"
                                            title="Remove from wishlist"
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                        </button>

                                        <ProductCard product={product} />

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="w-full mt-3 bg-purple-700 hover:bg-purple-800 text-white px-5 py-3 rounded-full text-sm font-medium shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faShoppingCart} className="text-xs" />
                                            Add to Cart
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </main>
            )}

            <Footer />
        </div>
    );
}
