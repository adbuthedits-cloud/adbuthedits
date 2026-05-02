"use client";
import withPermission from '../../../components/withPermission';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faUser, faSearch, faPen, faTrash, faSort, faCircleNotch, faEye } from '@fortawesome/free-solid-svg-icons';
import { useSortableData } from '../../../hooks/useSortableData';
import Button from '../../../components/Button';

function Users() {
    const authUser = getAuthUser() || {};
    const canEdit = authUser.is_super_admin || (authUser.permissions?.users && authUser.permissions.users.includes('edit'));
    const canDelete = authUser.is_super_admin || (authUser.permissions?.users && authUser.permissions.users.includes('delete'));

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const token = getAuthToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const res = await axios.get(`${apiUrl}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch users', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const token = getAuthToken();
        setDeletingId(id);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            await axios.delete(`${apiUrl}/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUsers();
        } catch (err) {
            console.error('Failed to delete user', err);
            alert('Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const { items: sortedUsers, requestSort, sortConfig } = useSortableData(filteredUsers);

    // Pagination State
    const [visibleCount, setVisibleCount] = useState(20);
    const visibleUsers = sortedUsers.slice(0, visibleCount);

    const loadMore = async () => {
        setLoadingMore(true);
        // Simulate a small delay for better UX feel
        await new Promise(resolve => setTimeout(resolve, 600));
        setVisibleCount(prev => prev + 20);
        setLoadingMore(false);
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-[26px] font-bold text-white tracking-tight">Customers</h1>
                <p className="text-gray-400 text-sm mt-1">View and manage registered customers</p>
            </div>

            {/* Search Bar */}
            <div className="bg-[#1E1628] p-2.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-[#2d1b4e] mb-6">
                <div className="relative w-full md:w-[400px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-sm" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-11 pr-4 py-2.5 bg-[#2d1b4e] text-sm text-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#a78bfa]/50 transition-all placeholder-gray-500 border border-transparent focus:border-[#a78bfa]/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[#1E1628] rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] overflow-hidden">
                <div className="overflow-x-auto custom-scroll">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#2d1b4e] border-b border-[#3b2a5f]">
                            <tr>
                                <th onClick={() => requestSort('first_name')} className="cursor-pointer hover:text-[#a78bfa] px-6 py-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Name <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort('email')} className="cursor-pointer hover:text-[#a78bfa] px-6 py-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Contact <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort('role')} className="cursor-pointer hover:text-[#a78bfa] px-6 py-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Role <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th onClick={() => requestSort('createdAt')} className="cursor-pointer hover:text-[#a78bfa] px-6 py-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Joined <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" /></th>
                                <th className="px-6 py-5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d1b4e]">
                            {visibleUsers.map(user => (
                                <tr key={user.user_id} className="hover:bg-[#2d1b4e]/30 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold text-sm shadow-sm border border-sky-500/20">
                                                {user.first_name?.[0]?.toUpperCase() || <FontAwesomeIcon icon={faUser} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{user.first_name} {user.last_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 text-xs" />
                                            <span className="text-sm font-medium text-gray-300">{user.email}</span>
                                        </div>
                                        {user.phone_number && (
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faPhone} className="text-gray-500 text-xs" />
                                                <span className="text-xs text-gray-500">
                                                    {typeof user.phone_number === 'object'
                                                        ? `${user.phone_number.code || ''} ${user.phone_number.number || ''}`
                                                        : user.phone_number}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide border ${user.role === 'admin' ? 'bg-purple-500/10 text-[#a78bfa] border-purple-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                            }`}>
                                            {user.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/users/view/${user.user_id}`} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-colors">
                                                <FontAwesomeIcon icon={faEye} className="text-sm" />
                                            </Link>
                                            {canEdit && (
                                                <Link href={`/users/edit/${user.user_id}`} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#2d1b4e] text-gray-400 hover:text-[#a78bfa] transition-colors">
                                                    <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                </Link>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(user.user_id)}
                                                    disabled={deletingId === user.user_id}
                                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === user.user_id ? (
                                                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-sm" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="text-gray-600 mb-3 text-4xl">
                                            <FontAwesomeIcon icon={faSearch} />
                                        </div>
                                        <p className="text-gray-500">No customers found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Load More Button */}
            {visibleCount < sortedUsers.length && (
                <div className="flex justify-center mt-8 pb-8">
                    <Button
                        onClick={loadMore}
                        loading={loadingMore}
                        variant="secondary"
                        className="px-8"
                    >
                        Load More Customers
                    </Button>
                </div>
            )}
        </>
    );
}

export default withPermission(Users, 'users');
