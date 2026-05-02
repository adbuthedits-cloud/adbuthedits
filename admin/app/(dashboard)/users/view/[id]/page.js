"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '../../../../../utils/auth';
import withPermission from '../../../../../components/withPermission';
import ActionToolbar from '../../../../../components/ActionToolbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faCalendarAlt, faIdBadge } from '@fortawesome/free-solid-svg-icons';

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
        <div className="max-w-5xl mx-auto pb-12">
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
        </div>
    );
}

export default withPermission(ViewUser, 'users', 'view');
