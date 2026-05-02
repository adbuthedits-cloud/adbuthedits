"use client";
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faStar, faUser, faBox, faEnvelope, faPhone, faCalendar, faCheck, faTrash, faQuoteLeft, faPlayCircle, faPaperPlane, faRobot, faShieldAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

export default function ReviewDetailsModal({ review, onClose, onUpdateStatus, onDelete }) {
    if (!review) return null;

    const [activeMedia, setActiveMedia] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [localReplies, setLocalReplies] = useState(review.replies || []);


    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = getAuthToken();
        
        // Mark as read upon opening
        if (review.unread_admin) {
            axios.post(`${apiUrl}/api/admin/reviews/${review.review_id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => null);
        }

        const fetchReview = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/admin/reviews/${review.review_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.replies) {
                    setLocalReplies(res.data.replies);
                }
            } catch (e) {}
        };

        const interval = setInterval(fetchReview, 5000);
        return () => clearInterval(interval);
    }, [review.review_id]);

    // Combine images and videos for gallery
    const media = [
        ...(review.images || []).map(url => ({ type: 'image', url })),
        ...(review.videos || []).map(url => ({ type: 'video', url }))
    ];

    const handleSendReply = async () => {
        if (!replyMessage.trim()) return;
        try {
            setIsSending(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            const res = await axios.post(`${apiUrl}/api/admin/reviews/${review.review_id}/reply`, 
                { message: replyMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLocalReplies(res.data.replies);
            setReplyMessage('');
        } catch (error) {
            console.error('Failed to send reply', error);
            alert('Failed to send reply');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#1a1025] w-full max-w-5xl max-h-[90vh] rounded-3xl border border-[#2d1b4e] shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                {/* Left: Media Area (or Placeholder) */}
                <div className="w-full md:w-1/2 bg-black flex flex-col">
                    <div className="flex-1 relative flex items-center justify-center bg-[#0f0916] overflow-hidden min-h-[300px]">
                        {activeMedia ? (
                            activeMedia.type === 'image' ? (
                                <Image src={activeMedia.url} fill className="object-contain" alt="Review Media" sizes="(max-width: 768px) 100vw, 500px" />
                            ) : (
                                <video src={activeMedia.url} controls autoPlay className="max-w-full max-h-full" />
                            )
                        ) : media.length > 0 ? (
                            media[0].type === 'image' ? (
                                <Image src={media[0].url} fill className="object-contain" alt="Review Media" sizes="(max-width: 768px) 100vw, 500px" />
                            ) : (
                                <video src={media[0].url} controls className="max-w-full max-h-full" />
                            )
                        ) : (
                            <div className="text-gray-600 flex flex-col items-center">
                                <FontAwesomeIcon icon={faBox} className="text-6xl mb-4 opacity-20" />
                                <span className="text-sm">No media attached</span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {media.length > 1 && (
                        <div className="h-24 bg-[#130C1C] border-t border-[#2d1b4e] p-4 flex gap-3 overflow-x-auto">
                            {media.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveMedia(item)}
                                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${activeMedia === item ? 'border-[#a78bfa]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    {item.type === 'image' ? (
                                        <Image src={item.url} fill className="object-cover" alt="Thumbnail" sizes="64px" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                            <FontAwesomeIcon icon={faPlayCircle} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details & Content */}
                <div className="w-full md:w-1/2 flex flex-col max-h-[90vh]">
                    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">

                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-8">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${review.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                review.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {review.status}
                            </span>
                            <span className="text-gray-500 text-sm flex items-center gap-2">
                                <FontAwesomeIcon icon={faCalendar} />
                                {new Date(review.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </span>
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center gap-4 mb-8 p-4 bg-[#2d1b4e]/30 rounded-2xl border border-[#2d1b4e]">
                            <div className="w-14 h-14 rounded-full bg-[#1a1025] flex items-center justify-center text-gray-400 text-2xl border border-[#2d1b4e]">
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{review.user?.first_name} {review.user?.last_name}</h3>
                                <div className="flex flex-col text-xs text-gray-400 mt-1 gap-0.5">
                                    {review.user?.email && <span className="flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} className="w-3" /> {review.user.email}</span>}
                                    {review.user?.phone_number && (
                                        <span className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faPhone} className="w-3" />
                                            {typeof review.user.phone_number === 'object' && review.user.phone_number !== null
                                                ? `${review.user.phone_number.code || ''} ${review.user.phone_number.number || ''}`
                                                : review.user.phone_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Review Content */}
                        <div className="mb-8">
                            <div className="flex gap-1 text-yellow-400 text-lg mb-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <FontAwesomeIcon key={i} icon={faStar} className={i <= review.rating ? '' : 'text-gray-700'} />
                                ))}
                                <span className="text-gray-400 text-sm font-medium ml-2">({review.rating}.0)</span>
                            </div>
                            <div className="relative">
                                <FontAwesomeIcon icon={faQuoteLeft} className="absolute -top-3 -left-4 text-3xl text-[#2d1b4e] opacity-50" />
                                <p className="text-gray-300 leading-relaxed text-lg italic pl-2 relative z-10">
                                    "{review.comment}"
                                </p>
                            </div>
                        </div>

                        {/* Product Card */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Reviewed Product</p>
                            <div className="flex gap-4 items-center bg-[#130C1C] p-3 rounded-xl border border-[#2d1b4e]">
                                <div className="w-16 h-16 bg-white rounded-lg p-1 relative overflow-hidden">
                                    <Image src={review.product?.thumbnail} alt={review.product?.title} fill className="object-contain" sizes="64px" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-200 line-clamp-1">{review.product?.title}</h4>
                                    <div className="text-[#a78bfa] font-bold mt-1">₹{review.product?.price}</div>
                                </div>
                            </div>
                        </div>

                        {/* Conversation Thread / Total Chat */}
                        <div className="mb-8">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                Total Chat / Thread {localReplies.length > 0 && <span className="bg-[#2d1b4e] px-2 py-0.5 rounded text-[10px]">{localReplies.length} Replies</span>}
                            </h4>
                            <div className="space-y-4">
                                {/* Original Review */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#2d1b4e] flex items-center justify-center text-gray-400 text-xs shrink-0 border border-[#3d2b5e]">
                                        <FontAwesomeIcon icon={faUser} />
                                    </div>
                                    <div className="flex-1 bg-[#2d1b4e]/20 border border-[#2d1b4e] p-3 rounded-2xl rounded-tl-none">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-gray-200">{review.user?.first_name} (Customer)</span>
                                            <span className="text-[10px] text-gray-500">{new Date(review.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm text-gray-300">{review.comment}</p>
                                    </div>
                                </div>

                                {localReplies.map((reply, idx) => (
                                    <div key={reply.id || idx} className={`flex gap-3 ${reply.role === 'admin' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                                            reply.role === 'admin' ? 'bg-[#a78bfa] text-white border-[#8b5cf6]' : 
                                            reply.role === 'system' ? 'bg-[#1a1025] text-[#a78bfa] border-[#2d1b4e]' : 
                                            'bg-[#2d1b4e] text-gray-400 border-[#3d2b5e]'
                                        }`}>
                                            <FontAwesomeIcon icon={reply.role === 'admin' ? faShieldAlt : reply.role === 'system' ? faRobot : faUser} />
                                        </div>
                                        <div className={`flex-1 p-3 rounded-2xl ${
                                            reply.role === 'admin' ? 'bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-tr-none' : 
                                            'bg-[#2d1b4e]/20 border border-[#2d1b4e] rounded-tl-none'
                                        }`}>
                                            <div className="flex justify-between items-center mb-1 gap-4">
                                                <span className={`text-xs font-bold ${reply.role === 'admin' ? 'text-[#a78bfa]' : 'text-gray-200'}`}>
                                                    {reply.userName} {reply.role === 'admin' && '(Admin)'} {reply.role === 'system' && '(Auto-reply)'}
                                                </span>
                                                <span className="text-[10px] text-gray-500">{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Reply Box */}
                        <div className="bg-[#130C1C] p-4 rounded-2xl border border-[#2d1b4e] shadow-inner mb-4">
                            <div className="flex gap-3">
                                <textarea 
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Type your professional reply here..."
                                    className="flex-1 bg-transparent border-none text-sm text-gray-300 focus:outline-none resize-none pt-1"
                                    rows="2"
                                />
                                <button 
                                    onClick={handleSendReply}
                                    disabled={isSending || !replyMessage.trim()}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSending || !replyMessage.trim() ? 'bg-gray-800 text-gray-600' : 'bg-[#a78bfa] text-white hover:bg-[#8b5cf6] shadow-lg shadow-[#a78bfa]/20'}`}
                                >
                                    <FontAwesomeIcon icon={isSending ? faSpinner : faPaperPlane} spin={isSending} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-[#2d1b4e] bg-[#130C1C] flex gap-3">
                        {review.status !== 'approved' && (
                            <button
                                onClick={() => onUpdateStatus(review.review_id, 'approved')}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <FontAwesomeIcon icon={faCheck} /> Approve
                            </button>
                        )}
                        {review.status !== 'rejected' && (
                            <button
                                onClick={() => onUpdateStatus(review.review_id, 'rejected')}
                                className="flex-1 bg-gray-700 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <FontAwesomeIcon icon={faTimes} /> Reject
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(review.review_id)}
                            className="w-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl transition-colors flex items-center justify-center"
                            title="Delete Permanently"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
