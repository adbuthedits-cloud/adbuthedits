"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '../../../../../utils/auth';
import withPermission from '../../../../../components/withPermission';
import ActionToolbar from '../../../../../components/ActionToolbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faCalendarAlt, faInfoCircle, faTags, faListUl } from '@fortawesome/free-solid-svg-icons';

function ViewCoupon({ user }) {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [coupon, setCoupon] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoupon = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const token = getAuthToken();
                if (!token) {
                    router.push('/login');
                    return;
                }
                const res = await axios.get(`${apiUrl}/api/admin/coupons/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCoupon(res.data);
            } catch (error) {
                console.error("Failed to fetch coupon", error);
                alert("Failed to load coupon details.");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCoupon();
        }
    }, [id, router]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            await axios.delete(`${apiUrl}/api/admin/coupons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            router.push('/coupons');
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete coupon");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a78bfa]"></div>
                <div className="text-gray-400 font-medium text-sm animate-pulse">Loading details...</div>
            </div>
        );
    }

    if (!coupon) return null;

    const parseList = (data) => {
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return []; }
        }
        return [];
    };

    const isExpired = new Date(coupon.expiration_date) < new Date();

    return (
        <div className="w-full pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Coupon Details</h1>
                <p className="text-gray-400">Viewing read-only details for {coupon.code}</p>
            </div>

            <ActionToolbar 
                user={user}
                module="marketing"
                // No edit view implemented via route yet, it's a modal, so for coupons we fallback to no edit link or we can trigger it differently
                // Actually coupons page uses modal for edit, so I will omit onEdit for now or provide instructions. Super admin might be okay without it on this page if they can access it on list page
                onDelete={handleDelete}
                backUrl="/coupons"
            />

            <div className="space-y-6">
                
                {/* Core Info */}
                <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                        <FontAwesomeIcon icon={faTicketAlt} className="text-[#a78bfa] text-xl" />
                        <h2 className="text-xl font-bold text-white">Basic Information</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Coupon Code</label>
                            <div className="text-[#a78bfa] font-mono text-xl font-bold bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                {coupon.code}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Status</label>
                            <div className="flex items-center h-[52px] px-4 py-3 bg-[#130C1C] rounded-xl border border-[#2d1b4e]">
                                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${isExpired ? "bg-red-500/5 text-red-400 border-red-500/20" : "bg-green-500/5 text-green-400 border-green-500/20"}`}>
                                    {isExpired ? "Expired" : "Active"}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Discount Type</label>
                            <div className="text-white capitalize bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.discount_type}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Discount Value</label>
                            <div className="text-white font-bold bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                {coupon.discount_type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configurations & Limits */}
                <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 text-xl" />
                        <h2 className="text-xl font-bold text-white">Rules & Limits</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Min. Order Value</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.min_order_value ? `₹${coupon.min_order_value}` : 'No limit'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Min. Items Count</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.min_items_count || 'No limit'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Max. Discount</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.max_discount_amount ? `₹${coupon.max_discount_amount}` : 'No limit'}</div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Usage Limit</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.usage_limit || 'Unlimited'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Per User Limit</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.per_user_limit !== null ? coupon.per_user_limit : 'Unlimited'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Target Audience</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.new_user_only ? 'New Users Only' : 'All Users'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Allow Stacking</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.allow_stacking ? 'Yes' : 'No'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Times Used</label>
                            <div className="text-sky-400 font-bold bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.used_count || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Granular Targeting & Category Allow/Block lists */}
                <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                        <FontAwesomeIcon icon={faTags} className="text-[#a78bfa] text-xl" />
                        <h2 className="text-xl font-bold text-white">Targeting Restrictions (JSON)</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['included_categories', 'excluded_categories', 'included_asset_categories', 'excluded_asset_categories', 'included_asset_sub_categories', 'excluded_asset_sub_categories', 'included_products', 'excluded_products'].map(field => {
                            const data = parseList(coupon[field]);
                            if (!data || data.length === 0) return null;
                            
                            return (
                                <div key={field} className="bg-[#130C1C] p-4 rounded-xl border border-[#2d1b4e]">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">
                                        {field.replace(/_/g, ' ')}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {data.map((item, idx) => (
                                            <span key={idx} className="bg-[#2d1b4e] text-gray-300 px-3 py-1 rounded-lg text-xs font-medium border border-[#3b2a5f]">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Add a tiny fallback info if all restrictions are null */}
                    {['included_categories', 'excluded_categories', 'included_asset_categories', 'excluded_asset_categories', 'included_asset_sub_categories', 'excluded_asset_sub_categories', 'included_products', 'excluded_products'].every(field => parseList(coupon[field]).length === 0) && (
                        <div className="text-gray-500 text-sm italic bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                            Universal Coupon: Applies everywhere without granular item targeting conditions.
                        </div>
                    )}
                </div>

                {/* Validity */}
                <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-amber-500 text-xl" />
                        <h2 className="text-xl font-bold text-white">Validity Dates</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Start Date</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.start_date ? new Date(coupon.start_date).toLocaleDateString() : 'Immediate'}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Expiry Date</label>
                            <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : 'Never expires'}</div>
                        </div>
                    </div>
                </div>

                {/* Popup Settings */}
                {coupon.show_on_popup && (
                    <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                            <span className="text-green-400 text-xl font-black">POPUP</span>
                            <h2 className="text-xl font-bold text-white">Popup Configuration</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Popup Title</label>
                                <div className="text-white font-bold bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.popup_title || '-'}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Popup Message</label>
                                <div className="text-gray-300 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">{coupon.popup_message || '-'}</div>
                            </div>
                        </div>
                        
                        {coupon.media_url && (
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Popup Media</label>
                                <div className="w-full sm:w-1/2 aspect-video bg-[#130C1C] rounded-xl border border-[#2d1b4e] overflow-hidden flex items-center justify-center p-2">
                                    {coupon.media_type === 'video' ? (
                                        <video src={coupon.media_url} controls className="max-h-full max-w-full rounded" />
                                    ) : (
                                        <img src={coupon.media_url} alt="Popup Media" className="max-h-full max-w-full object-contain rounded" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Coupons module uses "marketing" permissions generically as per the backend admin route checks
export default withPermission(ViewCoupon, 'marketing', 'view');
