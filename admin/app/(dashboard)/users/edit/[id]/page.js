"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { getAuthToken } from '../../../../../utils/auth';

import withPermission from '../../../../../components/withPermission';

function EditUser() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_code: '+91',
        phone_number: '',
        role: 'customer'
    });

    useEffect(() => {
        if (id) fetchUser();
    }, [id]);

    const fetchUser = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }
            const res = await axios.get(`${apiUrl}/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = res.data;

            // Handle Phone Number Parsing
            let pCode = '+91';
            let pNum = '';

            if (user.phone_number) {
                if (typeof user.phone_number === 'object') {
                    pCode = user.phone_number.code || '+91';
                    pNum = user.phone_number.number || '';
                } else {
                    pNum = user.phone_number;
                }
            }

            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_code: pCode,
                phone_number: pNum,
                role: user.role || 'customer'
            });
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch user', error);
            alert('Error loading user data');
            router.push('/users');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                role: formData.role,
                phone_number: {
                    code: formData.phone_code,
                    number: formData.phone_number
                }
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await axios.put(`${apiUrl}/api/admin/users/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.push('/users');
        } catch (error) {
            console.error('Failed to update user', error);
            alert('Failed to update user');
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">Edit Customer</h1>
                    <p className="text-gray-400 text-sm mt-1">Update customer details</p>
                </div>
                <Link href="/users" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1E1628] border border-[#2d1b4e] text-gray-400 hover:bg-[#2d1b4e] hover:text-[#a78bfa] transition-colors shadow-lg shadow-purple-900/10">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
            </div>

            <div className="bg-[#1E1628] p-8 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                            <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa] transition-all placeholder-gray-600"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                            <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa] transition-all placeholder-gray-600"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa] transition-all placeholder-gray-600"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                        <div className="flex gap-3">
                            <select
                                name="phone_code"
                                value={formData.phone_code}
                                onChange={handleChange}
                                className="p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa] w-24"
                            >
                                <option value="+91">+91</option>
                                <option value="+1">+1</option>
                                <option value="+44">+44</option>
                            </select>
                            <input
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                type="tel"
                                placeholder="9876543210"
                                className="flex-1 p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa] placeholder-gray-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none focus:border-[#a78bfa]"
                        >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="pt-6 border-t border-[#2d1b4e] flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#7C3AED] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#6D28D9] transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
                        >
                            {saving ? 'Saving...' : <><FontAwesomeIcon icon={faSave} /> Update Customer</>}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default withPermission(EditUser, 'users');
