import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faCheck, faInfoCircle, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const AvailableOffers = ({ productId }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        if (!productId) return;
        fetchOffers();
    }, [productId]);

    const fetchOffers = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${apiUrl}/api/coupons/product/${productId}/offers`);
            setOffers(res.data || []);
        } catch (error) {
            console.error('Failed to fetch available offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (e, code) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading || offers.length === 0) return null;

    return (
        <div className="my-6 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/30">
            <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faTag} className="text-purple-600 text-xs" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">
                    Applicable Offers
                </h3>
            </div>

            <div className="space-y-3">
                {offers.slice(0, 3).map((offer, idx) => (
                    <div 
                        key={idx}
                        className="flex items-start justify-between gap-4 group cursor-pointer"
                        onClick={(e) => handleCopy(e, offer.code)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600/30 group-hover:bg-purple-600 transition-colors" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-800 flex items-center gap-2">
                                    {offer.discount_type === 'percentage' ? `${offer.value}% OFF` : `₹${offer.value} OFF`}
                                    <span className="font-mono text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-purple-600">
                                        {offer.code}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                    {offer.min_order_value ? `On orders above ₹${offer.min_order_value}. ` : 'No minimum spend. '}
                                    {offer.max_discount_amount && `Max discount ₹${offer.max_discount_amount}.`}
                                </div>
                            </div>
                        </div>

                        <button 
                            className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest transition-all ${
                                copiedCode === offer.code 
                                ? 'text-green-500' 
                                : 'text-purple-600 hover:text-purple-800'
                            }`}
                        >
                            {copiedCode === offer.code ? (
                                <><FontAwesomeIcon icon={faCheck} className="mr-1" /> Copied</>
                            ) : (
                                'Copy'
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {offers.length > 3 && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                    <button className="text-[10px] font-bold text-gray-400 hover:text-purple-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
                        View {offers.length - 3} More Offers
                        <FontAwesomeIcon icon={faChevronRight} className="text-[8px]" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AvailableOffers;
