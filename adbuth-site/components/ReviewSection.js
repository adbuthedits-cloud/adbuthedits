import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faFilter, faChevronDown, faImage, faPlayCircle, faUserCircle, faRobot, faShieldAlt, faTimes, faThumbsUp, faThumbsDown, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ReviewForm from './ReviewForm';
import Loader from './Loader';

export default function ReviewSection({ products_id }) {
    const router = useRouter();
    const { user } = useAuth();
    const [reviewsData, setReviewsData] = useState({
        reviews: [],
        totalPages: 1,
        currentPage: 1,
        starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageRating: 0,
        totalReviews: 0,
        hasPurchased: false
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 1-5, or 'media'
    const [showForm, setShowForm] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // States for expanded texts and voting tracking
    const [expandedReviews, setExpandedReviews] = useState({});
    const [voterGuestId, setVoterGuestId] = useState(null);

    // Initialize Guest ID and load states
    useEffect(() => {
        let storedId = localStorage.getItem('adbuth_guest_id');
        // Check for invalid IDs like "null", "undefined", or empty
        if (!storedId || storedId === 'null' || storedId === 'undefined' || storedId.length < 10) {
            storedId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('adbuth_guest_id', storedId);
        }
        setVoterGuestId(storedId);
        
        // Clean up legacy local storage votes as we now use backend source of truth
        localStorage.removeItem('adbuth_review_votes');
    }, []);
    const [page, setPage] = useState(1);
    const [replyTexts, setReplyTexts] = useState({});
    const [isReplying, setIsReplying] = useState(null);
    const [replyInputVisible, setReplyInputVisible] = useState({});

    const [mediaViewer, setMediaViewer] = useState({ open: false, items: [], currentIndex: 0 });

    const pollLatestReviews = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const limit = page === 1 ? 2 : 10;
            const token = localStorage.getItem('token');
            const gid = localStorage.getItem('adbuth_guest_id');
            const res = await fetch(`${apiUrl}/api/reviews/product/${products_id}?page=1&limit=${limit}&guest_id=${gid || ''}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.success) {
                setReviewsData(prev => {
                    const updatedReviews = prev.reviews.map(oldRev => {
                        const newRev = data.reviews.find(r => r.review_id === oldRev.review_id);
                        if (newRev) {
                            // Mark as read if user is viewing and unread_user is true
                            if (newRev.unread_user && user && newRev.user_id === user.id) {
                                fetch(`${apiUrl}/api/reviews/${newRev.review_id}/read`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                }).catch(() => null);
                                newRev.unread_user = false;
                            }
                            return { ...oldRev, replies: newRev.replies, unread_user: newRev.unread_user };
                        }
                        return oldRev;
                    });
                    return { ...prev, ...data, reviews: updatedReviews };
                });
            }
        } catch (e) { }
    };

    useEffect(() => {
        setPage(1); // Reset page on product change
        fetchReviews(1, true);
    }, [products_id]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (page === 1) pollLatestReviews();
        }, 5000);
        return () => clearInterval(interval);
    }, [page]);

    const fetchReviews = async (pageNum = 1, reset = false) => {
        if (pageNum > 1) setIsLoadingMore(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const limit = pageNum === 1 ? 2 : 10;
            const token = localStorage.getItem('token');
            const gid = localStorage.getItem('adbuth_guest_id');
            const res = await fetch(`${apiUrl}/api/reviews/product/${products_id}?page=${pageNum}&limit=${limit}&guest_id=${gid || ''}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.success) {
                setReviewsData(prev => {
                    if (reset) return data;
                    return {
                        ...data,
                        reviews: [...prev.reviews, ...data.reviews] // Append new reviews
                    };
                });
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    const loadMoreReviews = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchReviews(nextPage);
    };

    const handleReviewSubmitted = (newReview) => {
        setShowForm(false);
        setPage(1);
        fetchReviews(1, true); // Refresh list from start
    };

    const handleCustomerReply = async (review_id) => {
        const text = replyTexts[review_id];
        if (!text?.trim()) return;
        setIsReplying(review_id);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/reviews/${review_id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            if (data.success) {
                setReplyTexts(prev => ({ ...prev, [review_id]: '' }));
                setReplyInputVisible(prev => ({ ...prev, [review_id]: false }));
                setReviewsData(prev => ({
                    ...prev,
                    reviews: prev.reviews.map(r => r.review_id === review_id ? { ...r, replies: data.replies } : r)
                }));
            }
        } catch (err) {
            console.error('Error replying:', err);
        } finally {
            setIsReplying(null);
        }
    };

    const handleVote = async (review_id, type) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const gid = localStorage.getItem('adbuth_guest_id');
            
            const res = await fetch(`${apiUrl}/api/reviews/${review_id}/vote`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ type, guest_id: gid })
            });
            const data = await res.json();

            if (data.success) {
                if (data.my_vote === type || data.my_vote) {
                    toast.success('Thanks for voting!');
                } else if (!data.my_vote) {
                    toast('Your vote is removed.');
                } 

                // Update local counts and status
                setReviewsData(prev => ({
                    ...prev,
                    reviews: prev.reviews.map(r => r.review_id === review_id ? {
                        ...r,
                        helpful_count: data.helpful_count,
                        unhelpful_count: data.unhelpful_count,
                        my_vote: data.my_vote
                    } : r)
                }));
            } else {
                toast.error(data.error || 'Failed to register vote.');
            }
        } catch (err) {
            console.error('Failed to register vote:', err);
            toast.error('Something went wrong. Try again.');
        }
    };

    const filteredReviews = reviewsData?.reviews?.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'media') return r.images?.length > 0 || r.videos?.length > 0;
        return r.rating === filter;
    });

    const starPercentage = (rating) => {
        if (!reviewsData || reviewsData.totalReviews === 0) return 0;
        return (reviewsData.starCounts[rating] / reviewsData.totalReviews) * 100;
    };

    const openMediaViewer = (review, initialIndex) => {
        const items = [];
        // Combine images and videos in order
        if (review.images) review.images.forEach(url => items.push({ type: 'image', url }));
        if (review.videos) review.videos.forEach(url => items.push({ type: 'video', url }));
        setMediaViewer({ open: true, items, currentIndex: initialIndex });
    };

    const nextMedia = (e) => {
        e.stopPropagation();
        setMediaViewer(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.items.length
        }));
    };

    const prevMedia = (e) => {
        e.stopPropagation();
        setMediaViewer(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex - 1 + prev.items.length) % prev.items.length
        }));
    };

    return (
        <section className="py-6 sm:py-12 border-t rounded-3xl border-gray-100 bg-[#FAFBFF]" id="reviews">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-12">

                    {/* Sidebar: Summary & Filters */}
                    <div className="lg:w-1/3">
                        <div className="sticky top-24">
                            <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8">Customer Reviews</h2>

                            {/* Summary Card */}
                            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-100 mb-4 sm:mb-8">
                                <div className="flex items-center gap-3 sm:gap-6 mb-4 sm:mb-8">
                                    <div className="text-4xl sm:text-6xl font-black text-gray-900">{reviewsData?.averageRating ? Number(reviewsData.averageRating).toFixed(1) : '0.0'}</div>
                                    <div>
                                        <div className="flex gap-1 text-yellow-400 mb-1">
                                            {[1, 2, 3, 4, 5].map(star => {
                                                const rating = reviewsData?.averageRating || 0;
                                                if (rating >= star) {
                                                    return <FontAwesomeIcon key={star} icon={faStar} className="text-yellow-400" />;
                                                } else if (rating >= star - 0.5) {
                                                    return <FontAwesomeIcon key={star} icon={faStarHalfAlt} className="text-yellow-400" />;
                                                } else {
                                                    return <FontAwesomeIcon key={star} icon={faStar} className="text-gray-200" />;
                                                }
                                            })}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 font-medium">{reviewsData?.totalReviews} Verified Reviews</p>
                                    </div>
                                </div>

                                {/* Rating Bars */}
                                <div className="space-y-2 sm:space-y-4">
                                    {[5, 4, 3, 2, 1].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setFilter(filter === star ? 'all' : star)}
                                            className={`w-full group flex items-center gap-4 hover:opacity-80 transition-opacity ${filter !== 'all' && filter !== star ? 'opacity-40' : ''}`}
                                        >
                                            <span className="text-sm font-bold w-4">{star}.0</span>
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${starPercentage(star)}%` }}
                                                    className="h-full bg-purple-600 rounded-full"
                                                />
                                            </div>
                                            <span className="text-sm text-gray-400 w-8 text-right font-medium">{reviewsData?.starCounts[star] || 0}</span>
                                        </button>
                                    ))}
                                </div>

                                {user && reviewsData?.hasPurchased && (
                                    <div className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-gray-100">
                                        <button
                                            onClick={() => setShowForm(!showForm)}
                                            className="w-full bg-black text-white py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                        >
                                            {showForm ? 'Cancel Review' : 'Write a Review'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Reviews List */}
                    <div className="lg:w-2/3">
                        <AnimatePresence mode="wait">
                            {showForm && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <ReviewForm products_id={products_id} onReviewSubmitted={handleReviewSubmitted} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Filter Pills */}
                        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-8">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border ${filter === 'all' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                            >
                                All Reviews
                            </button>
                            {[5, 4, 3, 2, 1].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setFilter(star)}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border flex items-center gap-1 sm:gap-1.5 ${filter === star ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                    <span>{star}.0</span>
                                    <FontAwesomeIcon icon={faStar} className={filter === star ? 'text-yellow-400' : 'text-gray-300'} />
                                </button>
                            ))}
                            <button
                                onClick={() => setFilter('media')}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all border flex items-center gap-1 sm:gap-1.5 ${filter === 'media' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                            >
                                <FontAwesomeIcon icon={faImage} />
                                <span>With Media</span>
                            </button>
                        </div>

                        {/* Filter Status Text */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                <FontAwesomeIcon icon={faFilter} className="text-sm" />
                                <span>Showing {filteredReviews?.length} Reviews</span>
                                {filter !== 'all' && (
                                    <button
                                        onClick={() => setFilter('all')}
                                        className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-300 transition-colors"
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Review List */}
                        <div className="space-y-3 sm:space-y-6">
                            {filteredReviews?.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                                    <div className="text-gray-300 mb-4 text-5xl">:(</div>
                                    <p className="text-gray-500 font-medium">No reviews found for this rating.</p>
                                </div>
                            ) : (
                                filteredReviews?.map((review) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={review.review_id}
                                        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="mb-4">
                                            {/* Stars and Title */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex gap-1 text-yellow-400 text-sm sm:text-base">
                                                    {[1, 2, 3, 4, 5].map(star => {
                                                        const rating = review.rating || 0;
                                                        if (rating >= star) return <FontAwesomeIcon key={star} icon={faStar} />;
                                                        if (rating >= star - 0.5) return <FontAwesomeIcon key={star} icon={faStarHalfAlt} />;
                                                        return <FontAwesomeIcon key={star} icon={faStar} className="text-gray-200" />;
                                                    })}
                                                </div>
                                                <span className="text-gray-800 font-bold ml-1">{Number(review.rating).toFixed(1)}</span>
                                                <span className="text-gray-800 font-medium ml-1">
                                                    • {review.rating >= 5 ? 'Excellent' : review.rating >= 4 ? 'Very Good' : review.rating >= 3 ? 'Good' : review.rating >= 2 ? 'Average' : 'Poor'}
                                                </span>
                                            </div>

                                            {/* Review Text with clamping */}
                                            <div className="mb-3">
                                                <p className={`text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap ${!expandedReviews[review.review_id] ? 'line-clamp-2' : ''}`}>
                                                    {review.comment}
                                                </p>
                                                {/* Read more button if comment exists and might break 2 lines (heuristic logic) */}
                                                {review.comment && review.comment.length > 100 && (
                                                    <button
                                                        onClick={() => setExpandedReviews(prev => ({ ...prev, [review.review_id]: !prev[review.review_id] }))}
                                                        className="text-xs font-bold text-gray-500 mt-1 hover:text-black transition-colors uppercase tracking-wider"
                                                    >
                                                        {expandedReviews[review.review_id] ? 'Read less' : 'Read more'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* User Details */}
                                            <div className="text-xs sm:text-sm font-medium text-gray-400 mb-4 uppercase">
                                                {review.user?.first_name} {review.user?.last_name || ''} {review.user?.city ? `, ${review.user.city}` : ''}
                                            </div>

                                            {/* Voting Buttons */}
                                            <div className="flex gap-2 mb-4">
                                                <button
                                                    onClick={() => handleVote(review.review_id, 'helpful')}
                                                    className={`flex items-center gap-2 border rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${review.my_vote === 'helpful' ? 'border-green-600 text-green-600 bg-green-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    <FontAwesomeIcon icon={faThumbsUp} /> Helpful for {review.helpful_count || 0}
                                                </button>
                                                <button
                                                    onClick={() => handleVote(review.review_id, 'unhelpful')}
                                                    className={`flex items-center gap-2 border rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${review.my_vote === 'unhelpful' ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    <FontAwesomeIcon icon={faThumbsDown} /> {review.unhelpful_count || 0}
                                                </button>
                                            </div>

                                            {/* Verified & Date */}
                                            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-black" />
                                                <span>Verified • {new Date(review.updatedAt || review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>

                                        {/* Media Gallery */}
                                        {(review.images?.length > 0 || review.videos?.length > 0) && (
                                            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-6">
                                                {/* Images */}
                                                {review.images?.map((url, i) => (
                                                    <div
                                                        key={`img-${i}`}
                                                        className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
                                                        onClick={() => openMediaViewer(review, i)}
                                                    >
                                                        <Image
                                                            src={url}
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                            alt="Review Image"
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <FontAwesomeIcon icon={faImage} className="text-white text-xl" />
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Videos */}
                                                {review.videos?.map((url, i) => (
                                                    <div
                                                        key={`vid-${i}`}
                                                        className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group bg-black"
                                                        onClick={() => openMediaViewer(review, (review.images?.length || 0) + i)}
                                                    >
                                                        <video src={url} className="w-full h-full object-cover opacity-80" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <FontAwesomeIcon icon={faPlayCircle} className="text-white text-3xl group-hover:scale-125 transition-transform" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* View Replies Toggle (Visible to everyone if there are replies and hidden) */}
                                        {review.replies?.length > 0 && !replyInputVisible[review.review_id] && (
                                            <div className="mt-4">
                                                <button
                                                    onClick={() => setReplyInputVisible(prev => ({ ...prev, [review.review_id]: true }))}
                                                    className="text-xs font-bold text-gray-500 hover:text-black transition-colors flex gap-2 items-center"
                                                >
                                                    <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                                                    View Replies ({review.replies.length})
                                                </button>
                                            </div>
                                        )}

                                        {/* Replies / Total Chat */}
                                        {replyInputVisible[review.review_id] && review.replies?.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
                                                {review.replies.map((reply, idx) => (
                                                    <div key={reply.id || idx} className="flex gap-3 items-start">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 overflow-hidden ${reply.role === 'admin' || reply.role === 'system' ? 'bg-black/5' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {reply.role === 'admin' || reply.role === 'system' ? (
                                                                <div className="relative w-[60%] h-[60%] opacity-80">
                                                                    <Image src="https://assets.adbuthverse.com/website-assets/brand/logo.webp" alt="Adbuth Logo" fill className="object-contain" unoptimized />
                                                                </div>
                                                            ) : (
                                                                <FontAwesomeIcon icon={faUserCircle} className="text-base" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-gray-900">
                                                                    {reply.role === 'admin' || reply.role === 'system' ? 'Adbuth Professional' : reply.userName}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {new Date(reply.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Customer Reply Input */}
                                        {user && user.id === review.user_id && (
                                            <div className="mt-4">
                                                {!review.replies?.length && !replyInputVisible[review.review_id] ? (
                                                    <button
                                                        onClick={() => setReplyInputVisible(prev => ({ ...prev, [review.review_id]: true }))}
                                                        className="text-xs font-bold text-gray-500 hover:text-black transition-colors"
                                                    >
                                                        Reply
                                                    </button>
                                                ) : replyInputVisible[review.review_id] ? (
                                                    <div className="flex flex-row gap-2 sm:items-center">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Reply to this thread..."
                                                            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-xs md:text-sm focus:outline-none focus:border-purple-500 md:w-full w-3/4"
                                                            value={replyTexts[review.review_id] || ''}
                                                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [review.review_id]: e.target.value }))}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleCustomerReply(review.review_id)}
                                                        />
                                                        <div className="flex gap-2 items-center justify-end sm:justify-start">
                                                            <button
                                                                onClick={() => handleCustomerReply(review.review_id)}
                                                                disabled={isReplying === review.review_id || !replyTexts[review.review_id]?.trim()}
                                                                className="bg-black text-white px-5 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-all min-w-[70px]"
                                                            >
                                                                {isReplying === review.review_id ? '...' : 'Send'}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setReplyInputVisible(prev => ({ ...prev, [review.review_id]: false }));
                                                                    setReplyTexts(prev => ({ ...prev, [review.review_id]: '' }));
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600 px-2 h-9 w-9 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* View More Button */}
                        {filter === 'all' && reviewsData?.currentPage < reviewsData?.totalPages && (
                            <div className="mt-8 text-center bg-gradient-to-t from-white via-white to-transparent pt-8 -mt-20 relative z-10 w-full mb-8">
                                <button
                                    onClick={loadMoreReviews}
                                    disabled={isLoadingMore}
                                    className="bg-white border-2 border-gray-100 text-gray-800 px-5 py-2 rounded-full font-bold hover:border-gray-300 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-sm"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            SHOW ALL
                                            <FontAwesomeIcon icon={faChevronDown} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Media Carousel Modal */}
            <AnimatePresence>
                {mediaViewer.open && mediaViewer.items.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md"
                        onClick={() => setMediaViewer({ ...mediaViewer, open: false })}
                    >
                        {/* Close Button */}
                        <motion.button
                            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-4 z-[110]"
                            onClick={() => setMediaViewer({ ...mediaViewer, open: false })}
                            whileHover={{ scale: 1.1 }}
                        >
                            <span className="text-4xl leading-none">&times;</span>
                        </motion.button>

                        {/* Prev Button */}
                        {mediaViewer.items.length > 1 && (
                            <button
                                onClick={prevMedia}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-all hover:bg-white/10 rounded-full z-[110]"
                            >
                                <FontAwesomeIcon icon={faChevronDown} className="text-2xl rotate-90" />
                            </button>
                        )}

                        {/* Next Button */}
                        {mediaViewer.items.length > 1 && (
                            <button
                                onClick={nextMedia}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-all hover:bg-white/10 rounded-full z-[110]"
                            >
                                <FontAwesomeIcon icon={faChevronDown} className="text-2xl -rotate-90" />
                            </button>
                        )}

                        {/* Content */}
                        <div
                            className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mediaViewer.currentIndex}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.2 }}
                                    className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
                                >
                                    {mediaViewer.items[mediaViewer.currentIndex].type === 'image' ? (
                                        <Image
                                            src={mediaViewer.items[mediaViewer.currentIndex].url}
                                            className="max-w-full max-h-[80vh] md:max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                            alt="Review Media"
                                            width={1200}
                                            height={800}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <video
                                                src={mediaViewer.items[mediaViewer.currentIndex].url}
                                                controls
                                                autoPlay
                                                className="max-h-[85vh] max-w-full rounded-lg shadow-2xl"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Counter/Index Indicator */}
                            {mediaViewer.items.length > 1 && (
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 font-medium px-4 py-1 bg-black/50 rounded-full text-sm">
                                    {mediaViewer.currentIndex + 1} / {mediaViewer.items.length}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
