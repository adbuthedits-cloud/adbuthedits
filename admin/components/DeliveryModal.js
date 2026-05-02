"use client";
import { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faLink, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeliveryModal({ isOpen, onClose, orderId, itemId, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !itemId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('file', file);

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await axios.post(`${apiUrl}/api/admin/orders/items/${itemId}/deliver`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setFile(null);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to deliver order', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-colors"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Upload Digital Content</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Order #{orderId?.slice(0, 8)}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Select File to Send
                                    </label>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-gray-50">
                                        <input
                                            type="file"
                                            required
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="text-gray-500">
                                            {file ? (
                                                <div className="flex flex-col items-center text-blue-600">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-2xl mb-2" />
                                                    <span className="font-semibold text-sm">{file.name}</span>
                                                    <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <FontAwesomeIcon icon={faLink} className="text-2xl mb-2 text-gray-300" />
                                                    <span className="text-sm font-medium">Click to Browse or Drag File</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-2 ml-1">
                                        This file will be uploaded and the link emailed to the customer.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading || !file}
                                        className="w-full bg-[#4880FF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faPaperPlane} />
                                                Upload & Send
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
