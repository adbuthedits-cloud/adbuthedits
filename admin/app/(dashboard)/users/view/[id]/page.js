"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken } from '../../../../../utils/auth';
import withPermission from '../../../../../components/withPermission';
import ActionToolbar from '../../../../../components/ActionToolbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faCalendarAlt, faIdBadge, faShoppingBag, faEye } from '@fortawesome/free-solid-svg-icons';

function ViewUser({ user: authUser }) {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const token = getAuthToken();
                if (!token) {
                    router.push('/login');
                    return;
                }
                // we can just use the same single GET if it exists, or fetch all and filter
                // usually there is a GET /api/admin/users/:id
                const res = await axios.get(`${apiUrl}/api/admin/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data);
            } catch (error) {
                console.error("Failed to fetch user", error);
                alert("Failed to load user details. They might have been deleted.");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUser();
        }
    }, [id, router]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            await axios.delete(`${apiUrl}/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            router.push('/users');
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete user");
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

    if (!user) return null;

    return (
        <div className="w-full pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Customer Details</h1>
                <p className="text-gray-400">Viewing read-only details for "{user.first_name} {user.last_name}"</p>
            </div>

            <ActionToolbar 
                user={authUser}
                module="users"
                onEdit={() => router.push(`/users/edit/${id}`)}
                onDelete={handleDelete}
                backUrl="/users"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Profile Information */}
                <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                        <FontAwesomeIcon icon={faIdBadge} className="text-[#a78bfa] text-xl" />
                        <h2 className="text-xl font-bold text-white">Profile Information</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">First Name</label>
                            <div className="text-white bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                {user.first_name || <span className="italic opacity-50">Not specified</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Last Name</label>
                            <div className="text-white bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                {user.last_name || <span className="italic opacity-50">Not specified</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Role</label>
                            <span className={`px-4 py-2 mt-1 inline-block rounded-lg text-sm font-bold tracking-wide border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                                {(user.role || 'user').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                        <FontAwesomeIcon icon={faEnvelope} className="text-emerald-400 text-xl" />
                        <h2 className="text-xl font-bold text-white">Contact & Activity</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Email</label>
                            <div className="text-gray-300 flex items-center gap-3 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                <FontAwesomeIcon icon={faEnvelope} className="text-gray-500" />
                                {user.email || <span className="italic opacity-50">Not specified</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Phone Number</label>
                            <div className="text-gray-300 flex items-center gap-3 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                <FontAwesomeIcon icon={faPhone} className="text-gray-500" />
                                {user.phone_number ? (typeof user.phone_number === 'object' ? `${user.phone_number.code || ''} ${user.phone_number.number || ''}` : user.phone_number) : <span className="italic opacity-50">Not specified</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Account Created At</label>
                            <div className="text-gray-300 flex items-center gap-3 bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-500" />
                                {new Date(user.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Order History Section */}
            <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg mt-8">
                <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                    <FontAwesomeIcon icon={faShoppingBag} className="text-[#a78bfa] text-xl" />
                    <h2 className="text-xl font-bold text-white">Order History</h2>
                    <span className="ml-auto bg-[#2d1b4e] text-gray-300 text-xs px-2.5 py-1 rounded-full font-bold">
                        {user.orders?.length || 0} Order{(user.orders?.length || 0) !== 1 ? 's' : ''}
                    </span>
                </div>

                {!user.orders || user.orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FontAwesomeIcon icon={faShoppingBag} className="text-4xl opacity-20 mb-3 block mx-auto" />
                        <p className="font-medium">No orders found for this customer</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#2d1b4e]/60 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="pb-4">Order ID</th>
                                    <th className="pb-4">Date</th>
                                    <th className="pb-4">Amount</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2d1b4e]/40">
                                {user.orders.map((order) => (
                                    <tr key={order.order_id} className="hover:bg-[#2d1b4e]/10 group transition-colors">
                                        <td className="py-4 font-mono text-sm text-white font-semibold">
                                            #{order.order_id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="py-4 text-gray-300 text-sm">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="py-4 text-white text-sm font-bold">
                                            ₹{order.total_amount?.toLocaleString()}
                                        </td>
                                        <td className="py-4">
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                        <td className="py-4 text-right">
                                            <Link
                                                href={`/orders/${order.order_id}`}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 rounded-lg text-xs font-semibold hover:bg-[#a78bfa]/20 transition-all"
                                            >
                                                <FontAwesomeIcon icon={faEye} /> View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderStatusBadge({ status }) {
    const s = (status || '').toLowerCase();
    if (s === 'paid') {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Order Placed</span>;
    }
    if (s === 'pending') {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">Pending Payment</span>;
    }
    if (s === 'delivered' || s === 'completed') {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Delivered</span>;
    }
    if (s === 'inprocessing' || s === 'in_progress') {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">In Progress</span>;
    }
    if (s === 'failed' || s === 'cancelled') {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">{status.toUpperCase()}</span>;
}

export default withPermission(ViewUser, 'users', 'view');
