import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Fetch wishlist when user logs in
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setWishlistItems([]);
            setLoading(false);
            return;
        }

        const fetchWishlist = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${apiUrl}/api/wishlist`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setWishlistItems(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Error fetching wishlist:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [user, authLoading, apiUrl]);

    const toggleWishlist = async (productId) => {
        if (!user) {
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem('intendedDestination', currentPath);
            router.push('/login');
            toast.error('Please login to add items to your wishlist', {
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                    textAlign: 'center',
                },
            });
            return;
        }

        const isWishlisted = wishlistItems.some(item => item.products_id === productId);
        const token = localStorage.getItem('token');

        try {
            if (isWishlisted) {
                const res = await fetch(`${apiUrl}/api/wishlist/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    setWishlistItems(prev => prev.filter(item => item.products_id !== productId));
                    toast.success('Item removed from wishlist', {
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
                }
            } else {
                const res = await fetch(`${apiUrl}/api/wishlist`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ product_id: productId })
                });

                if (res.ok) {
                    const refreshRes = await fetch(`${apiUrl}/api/wishlist`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        setWishlistItems(Array.isArray(data) ? data : []);
                        toast.success('Item added to wishlist!', {
                            style: {
                                borderRadius: '10px',
                                background: '#333',
                                color: '#fff',
                            },
                            iconTheme: {
                                primary: '#9333EA', // Purple match
                                secondary: '#fff',
                            },
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error toggling wishlist:', err);
            toast.error('Failed to update wishlist');
        }
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.products_id === productId);
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            loading,
            toggleWishlist,
            isInWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
