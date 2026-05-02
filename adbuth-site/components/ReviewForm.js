import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCamera, faVideo, faTimes, faCloudUploadAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function ReviewForm({ products_id, onReviewSubmitted }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }

        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const handleVideoChange = (e) => {
        const files = Array.from(e.target.files);
        if (videos.length + files.length > 2) {
            alert('Maximum 2 videos allowed');
            return;
        }

        const newVideos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setVideos(prev => [...prev, ...newVideos]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeVideo = (index) => {
        setVideos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('products_id', products_id);
        formData.append('rating', rating);
        formData.append('comment', comment);

        images.forEach(img => formData.append('images', img.file));
        videos.forEach(vid => formData.append('videos', vid.file));

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiUrl}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                // Reset form
                setRating(0);
                setComment('');
                setImages([]);
                setVideos([]);
                if (onReviewSubmitted) onReviewSubmitted(data.review);
            } else {
                setError(data.error || 'Failed to submit review');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-12">
            <h3 className="text-xl font-bold mb-6">Write a Review</h3>

            {/* Star Rating */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-transform active:scale-90"
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(star)}
                        >
                            <FontAwesomeIcon
                                icon={faStar}
                                className={`text-2xl transition-colors ${star <= (hover || rating) ? 'text-yellow-400' : 'text-gray-200'
                                    }`}
                            />
                        </button>
                    ))}
                    {rating > 0 && <span className="ml-2 text-sm font-bold text-gray-500">{rating}/5</span>}
                </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike?"
                    className="w-full h-32 p-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none"
                    required
                />
            </div>

            {/* Media Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Images */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Add Images (Max 5)</label>
                    <div className="flex flex-wrap gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={img.preview} className="w-full h-full object-cover" alt="Preview" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        ))}
                        {images.length < 5 && (
                            <button
                                type="button"
                                onClick={() => imageInputRef.current.click()}
                                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all"
                            >
                                <FontAwesomeIcon icon={faCamera} className="text-xl mb-1" />
                                <span className="text-[10px] font-bold">Image</span>
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={imageInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />
                </div>

                {/* Videos */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Add Videos (Max 2)</label>
                    <div className="flex flex-wrap gap-3">
                        {videos.map((vid, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                <video src={vid.preview} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeVideo(i)}
                                    className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        ))}
                        {videos.length < 2 && (
                            <button
                                type="button"
                                onClick={() => videoInputRef.current.click()}
                                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-all"
                            >
                                <FontAwesomeIcon icon={faVideo} className="text-xl mb-1" />
                                <span className="text-[10px] font-bold">Video</span>
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoChange}
                        accept="video/*"
                        multiple
                        className="hidden"
                    />
                </div>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 rounded-xl font-bold  transition-all shadow-lg shadow-gray-500 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
                {isSubmitting ? (
                    <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Submitting...
                    </>
                ) : (
                    <>
                        <FontAwesomeIcon icon={faCloudUploadAlt} className="group-hover:-translate-y-0.5 transition-transform" />
                        Submit Review
                    </>
                )}
            </button>
        </form>
    );
}
