"use client";

import { useSortableData } from '../../hooks/useSortableData';
import { useEffect, useState } from 'react';
import { getAuthToken, getAuthUser, hasPermission, canAccessModule, logout } from '../../utils/auth';
import { 
    Tag, 
    MessageSquare, 
    BarChart3, 
    FileText,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import {
    IndianRupee,
    ShoppingCart,
    Clock,
    Users,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    ArrowUpDown,
    Loader2
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => (
    <div className="bg-[#1E1628] rounded-xl p-6 relative overflow-hidden group border border-[#2d1b4e] hover:border-[#7C3AED]/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(124,58,237,0.1)]">
        {/* Glow effect behind icon */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#7C3AED]/5 rounded-full blur-3xl group-hover:bg-[#7C3AED]/10 transition-all duration-500"></div>

        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-[#2d1b4e]/50 rounded-lg border border-[#7C3AED]/20 text-[#a78bfa] group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-900/20 backdrop-blur-sm">
                    <Icon size={22} strokeWidth={2} />
                </div>
                {trend !== null && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${trend === 'up'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span>{trendValue}%</span>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-4xl font-black w-fit text-white tracking-tight mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#a78bfa] transition-all duration-300">
                    {value}
                </h3>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        revenue: 0
    });
    const [loading, setLoading] = useState(true);

    const [recentOrders, setRecentOrders] = useState([]);
    const { items: sortedOrders, requestSort, sortConfig } = useSortableData(recentOrders);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        const token = getAuthToken();
        if (!token) {
            // No token? Redirect to login immediately
            window.location.href = '/login';
            return;
        }

        setLoading(true);
        setError(null);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const res = await axios.get(`${apiUrl}/api/admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStats(res.data.stats);
            setRecentOrders(res.data.recentOrders || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                logout();
                window.location.href = '/login';
            } else if (err.code === 'ERR_NETWORK') {
                console.warn('Network stream broke due to idle. Ignoring.');
                // Don't set error visually to prevent jarring screen, keep existing data intact
            } else {
                setError(err.response?.data?.error || 'Failed to load data. Please check connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                    <Loader2 className="w-10 h-10 text-[#7C3AED] animate-spin" />
                    <div className="text-gray-400 font-medium text-sm tracking-wide">Loading Dashboard...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[32px] font-bold text-white tracking-tight">
                        Welcome back, {getAuthUser()?.first_name || 'Admin'}
                    </h1>
                    <p className="text-gray-500 mt-1">Here is what's happening in your department today.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 border border-red-500/20 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    {error}
                </div>
            )}

            {/* Stats Grid - Permission-based visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {(() => {
                    const u = getAuthUser();
                    const isSuperAdmin = u?.is_super_admin === true;
                    return (
                        <>
                            {/* Revenue — Super Admin or has payments:view */}
                            {(isSuperAdmin || hasPermission(u, 'payments', 'view')) && (
                                <StatCard
                                    title="Total Revenue"
                                    value={`₹${(stats?.revenue || 0).toLocaleString()}`}
                                    icon={IndianRupee}
                                    trend={parseFloat(stats?.revenueGrowth) >= 0 ? "up" : "down"}
                                    trendValue={Math.abs(stats?.revenueGrowth || 0)}
                                />
                            )}

                            {/* Orders — anyone with orders:view */}
                            {(isSuperAdmin || hasPermission(u, 'orders', 'view')) && (
                                <StatCard
                                    title="Total Orders"
                                    value={stats?.totalOrders || 0}
                                    icon={ShoppingCart}
                                    trend={parseFloat(stats?.orderGrowth) >= 0 ? "up" : "down"}
                                    trendValue={Math.abs(stats?.orderGrowth || 0)}
                                />
                            )}

                            {/* Pending Orders */}
                            {(isSuperAdmin || hasPermission(u, 'orders', 'view')) && (
                                <StatCard
                                    title="Pending Orders"
                                    value={stats?.totalPendingOrders || 0}
                                    icon={Clock}
                                    trend={null}
                                    trendValue={0}
                                />
                            )}

                            {/* Customers */}
                            {(isSuperAdmin || hasPermission(u, 'users', 'view')) && (
                                <StatCard
                                    title="Total Customers"
                                    value={stats?.totalUsers || 0}
                                    icon={Users}
                                    trend={parseFloat(stats?.userGrowth) >= 0 ? "up" : "down"}
                                    trendValue={Math.abs(stats?.userGrowth || 0)}
                                />
                            )}

                            {/* Products / Stock */}
                            {(isSuperAdmin || hasPermission(u, 'products', 'view')) && (
                                <StatCard
                                    title="Total Products"
                                    value={stats?.totalProducts || 0}
                                    icon={Package}
                                    trend={null}
                                    trendValue={0}
                                />
                            )}

                            {/* Coupons — marketing module */}
                            {(isSuperAdmin || hasPermission(u, 'marketing', 'view')) && (
                                <StatCard
                                    title="Active Coupons"
                                    value={stats?.activeCoupons || 0}
                                    icon={Tag}
                                    trend={null}
                                    trendValue={0}
                                />
                            )}

                            {/* Inquiries / Support */}
                            {(isSuperAdmin || hasPermission(u, 'reviews', 'view')) && (
                                <StatCard
                                    title="Open Inquiries"
                                    value={stats?.recentInquiriesCount || 0}
                                    icon={MessageSquare}
                                    trend={null}
                                    trendValue={0}
                                />
                            )}
                        </>
                    );
                })()}
            </div>

            {/* Recent Orders Section */}
            <div className="bg-[#1E1628] p-8 rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.2)] border border-[#2d1b4e]">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-xl text-white tracking-tight">Recent Orders</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#2d1b4e] text-gray-400 text-xs uppercase tracking-wider">
                                <th onClick={() => requestSort('order_id')} className="cursor-pointer py-4 font-bold hover:text-[#a78bfa] transition-colors">
                                    Order ID <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th onClick={() => requestSort('user.email')} className="cursor-pointer py-4 font-bold hover:text-[#a78bfa] transition-colors">
                                    Customer <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th onClick={() => requestSort('createdAt')} className="cursor-pointer py-4 font-bold hover:text-[#a78bfa] transition-colors">
                                    Date <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th onClick={() => requestSort('total_amount')} className="cursor-pointer py-4 font-bold hover:text-[#a78bfa] transition-colors">
                                    Amount <FontAwesomeIcon icon={faSort} className="ml-1 opacity-50" />
                                </th>
                                <th className="py-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {sortedOrders.length > 0 ? (
                                sortedOrders.map((order) => (
                                    <tr key={order.order_id} className="border-b border-dashed border-[#2d1b4e] last:border-0 hover:bg-[#2d1b4e]/30 transition-colors group">
                                        <td className="py-5 font-semibold text-white group-hover:text-[#a78bfa] transition-colors">
                                            #{order.order_id.slice(0, 8)}
                                        </td>
                                        <td className="py-5 text-gray-400 font-medium">
                                            {order.user ? (
                                                <div className="flex flex-col">
                                                    <span className="text-gray-200">{order.user.first_name}</span>
                                                    <span className="text-xs text-gray-500 font-normal">{order.user.email}</span>
                                                </div>
                                            ) : 'Guest'}
                                        </td>
                                        <td className="py-5 text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="py-5 font-bold text-white">₹{order.total_amount.toLocaleString()}</td>
                                        <td className="py-5">
                                            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-[#2d1b4e]/50 rounded-full flex items-center justify-center text-gray-500">
                                                <Package size={24} />
                                            </div>
                                            <p>No recent orders found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

