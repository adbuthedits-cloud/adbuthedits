import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSave, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import SeoHead from '../components/SeoHead';
import useSeo from '../hooks/useSeo';

export default function Settings() {
    const { seoData } = useSeo('settings');
    const { user, login } = useAuth(); // We might need to update user context after profile change
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Profile State
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            // Split name if first/last aren't separate in context (depends on auth provider implementation)
            // Assuming user object might just have 'name'. If it has first_name etc use that.
            // Adjusting based on common patterns; ideally we fetch fresh user data here.
            // For now, let's use what we have or empty defaults.
            const names = user.name ? user.name.split(' ') : ['', ''];
            setProfileData({
                first_name: user.first_name || names[0] || '',
                last_name: user.last_name || names.slice(1).join(' ') || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ text: 'Profile updated successfully', type: 'success' });
                // Optionally update context if we had a method for it, or rely on next refresh
                // For immediate feedback, we could force a reload or re-fetch user
            } else {
                setMessage({ text: data.msg || 'Update failed', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Something went wrong', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ text: 'Password changed successfully', type: 'success' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ text: data.msg || 'Change failed', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Something went wrong', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            <SeoHead
                title={seoData?.meta_title || seoData?.title || "Account Settings | Adbuth Edits"}
                description={seoData?.meta_description || seoData?.description || "Manage your account settings."}
                data={seoData}
            />
            <Navbar isdark={false} />

            <main className="flex-grow pt-32 pb-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar Tabs */}
                        <div className="md:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-white p-2">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'profile' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faUser} /> Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('password')}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${activeTab === 'password' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faLock} /> Security
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-3">
                            <div className="bg-white rounded-3xl shadow-sm border border-white p-8">
                                {message.text && (
                                    <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {message.text}
                                    </div>
                                )}

                                {activeTab === 'profile' ? (
                                    <motion.form
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={handleProfileUpdate}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl">
                                                <FontAwesomeIcon icon={faUser} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                                <p className="text-gray-500 text-sm">Update your personal details here.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.first_name}
                                                    onChange={e => setProfileData({ ...profileData, first_name: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="John"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                <input
                                                    type="text"
                                                    value={profileData.last_name}
                                                    onChange={e => setProfileData({ ...profileData, last_name: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                            >
                                                {loading ? 'Saving...' : <><FontAwesomeIcon icon={faSave} /> Save Changes</>}
                                            </button>
                                        </div>
                                    </motion.form>
                                ) : (
                                    <motion.form
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={handlePasswordChange}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
                                                <FontAwesomeIcon icon={faShieldAlt} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Security</h2>
                                                <p className="text-gray-500 text-sm">Manage your password and security settings.</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                placeholder="Enter current password"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="Minimum 6 characters"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                                            >
                                                {loading ? 'Updating...' : <><FontAwesomeIcon icon={faLock} /> Update Password</>}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
