"use client";
import withPermission from '../../../components/withPermission';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faSave, faCheckCircle, faExclamationCircle, faEye, faEyeSlash, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { getAuthToken } from '../../../utils/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideIn } from '../../../components/Animations';

function Settings() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    
    // Maintenance Mode State
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [fetchingMaintenance, setFetchingMaintenance] = useState(true);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (status.message) setStatus({ type: '', message: '' });
    };

    const toggleShow = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    useEffect(() => {
        const fetchMaintenance = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${apiUrl}/api/settings/public`);
                setMaintenanceMode(res.data.maintenance_mode);
            } catch (err) {
                console.error("Failed to fetch maintenance mode", err);
            } finally {
                setFetchingMaintenance(false);
            }
        };
        fetchMaintenance();
    }, []);

    const toggleMaintenance = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            if (!token) return router.push('/login');

            const newValue = !maintenanceMode;
            setMaintenanceMode(newValue); // Optimistic update

            await axios.put(`${apiUrl}/api/settings/maintenance_mode`, 
                { value: newValue, description: "System Maintenance Mode Toggle" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setStatus({ type: 'success', message: `Maintenance mode ${newValue ? 'enabled' : 'disabled'} successfully.` });
        } catch (error) {
            setMaintenanceMode(!maintenanceMode); // Revert
            setStatus({
                type: 'error',
                message: error.response?.data?.msg || 'Failed to update maintenance mode'
            });
        }
    };

    // Validation Requirements
    const validations = {
        length: formData.newPassword.length >= 6,
        upper: /[A-Z]/.test(formData.newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
        match: formData.newPassword && formData.newPassword === formData.confirmPassword
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validations.length || !validations.upper || !validations.special || !validations.match) {
            setStatus({ type: 'error', message: 'Please ensure all password requirements are met.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }
            const res = await axios.put(`${apiUrl}/api/auth/change-password`,
                {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStatus({ type: 'success', message: res.data.msg });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data?.msg || 'Failed to update password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">Settings</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage your account security and preferences.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Visual Side */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-gradient-to-br from-[#1E1628] to-[#2d1b4e] text-white p-8 rounded-[18px] shadow-lg relative overflow-hidden h-full flex flex-col justify-center border border-[#2d1b4e]">
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm shadow-inner border border-white/10">
                                <FontAwesomeIcon icon={faLock} className="text-3xl text-[#a78bfa]" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Secure Your Account</h3>
                            <p className="text-gray-300 text-sm leading-relaxed opacity-90">
                                Regularly updating your password helps protect your admin dashboard from unauthorized access.
                                Use a strong, unique password.
                            </p>
                        </div>
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#a78bfa]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full lg:w-2/3">
                    <div className="bg-[#1E1628] p-8 rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e]">
                        
                        {/* Status Message */}
                        <div className="mb-6">
                            <AnimatePresence>
                                {status.message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`p-4 rounded-lg flex items-center gap-3 text-sm border ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                                    >
                                        <FontAwesomeIcon icon={status.type === 'success' ? faCheckCircle : faExclamationCircle} />
                                        {status.message}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* System Settings Section */}
                        <div className="mb-10">
                            <h3 className="font-bold text-lg text-white mb-6 border-b border-[#2d1b4e] pb-4">System Status</h3>
                            <div className="bg-[#2d1b4e]/30 p-6 rounded-xl border border-[#a78bfa]/20 flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-semibold flex items-center gap-2">
                                        <FontAwesomeIcon icon={faPowerOff} className={maintenanceMode ? "text-amber-500" : "text-emerald-500"} />
                                        Maintenance Mode
                                    </h4>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {maintenanceMode 
                                            ? "Website is currently hidden from the public." 
                                            : "Website is live and accessible to all users."}
                                    </p>
                                </div>
                                <button 
                                    onClick={toggleMaintenance}
                                    disabled={fetchingMaintenance}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${maintenanceMode ? 'bg-amber-500' : 'bg-[#3b2a5f]'} ${fetchingMaintenance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-[#a78bfa]/50'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-white mb-6 border-b border-[#2d1b4e] pb-4">Change Password</h3>

                        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">

                            {/* Current Password */}
                            <div>
                                <label className="text-sm font-semibold text-gray-300 mb-2 block">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword.current ? "text" : "password"}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-12 py-3 bg-[#2d1b4e] border border-transparent text-gray-200 rounded-xl focus:bg-[#3b2a5f] focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500"
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button type="button" onClick={() => toggleShow('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#a78bfa]">
                                        <FontAwesomeIcon icon={showPassword.current ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-sm font-semibold text-gray-300 mb-2 block">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword.new ? "text" : "password"}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-12 py-3 bg-[#2d1b4e] border border-transparent text-gray-200 rounded-xl focus:bg-[#3b2a5f] focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500"
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <button type="button" onClick={() => toggleShow('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#a78bfa]">
                                        <FontAwesomeIcon icon={showPassword.new ? faEyeSlash : faEye} />
                                    </button>
                                </div>

                                {/* Password Strength Indicators */}
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className={`text-xs flex items-center gap-1.5 ${validations.length ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        <FontAwesomeIcon icon={validations.length ? faCheckCircle : faExclamationCircle} className={`text-[10px] ${validations.length ? '' : 'opacity-0'}`} />
                                        Min 6 Characters
                                    </div>
                                    <div className={`text-xs flex items-center gap-1.5 ${validations.upper ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        <FontAwesomeIcon icon={validations.upper ? faCheckCircle : faExclamationCircle} className={`text-[10px] ${validations.upper ? '' : 'opacity-0'}`} />
                                        1 Uppercase Letter
                                    </div>
                                    <div className={`text-xs flex items-center gap-1.5 ${validations.special ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        <FontAwesomeIcon icon={validations.special ? faCheckCircle : faExclamationCircle} className={`text-[10px] ${validations.special ? '' : 'opacity-0'}`} />
                                        1 Special Character
                                    </div>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-sm font-semibold text-gray-300 mb-2 block">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword.confirm ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full pl-4 pr-12 py-3 bg-[#2d1b4e] border ${formData.confirmPassword && !validations.match ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-transparent text-gray-200 rounded-xl focus:bg-[#3b2a5f] focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50'} rounded-xl outline-none transition-all placeholder-gray-500`}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#a78bfa]">
                                        <FontAwesomeIcon icon={showPassword.confirm ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                                {formData.confirmPassword && !validations.match && (
                                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || !validations.length || !validations.upper || !validations.special || !validations.match}
                                    className="bg-[#7C3AED] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-900/40"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSave} />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default withPermission(Settings, 'settings');

