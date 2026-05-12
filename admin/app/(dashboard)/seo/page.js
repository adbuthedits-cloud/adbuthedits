"use client";
import withPermission from '../../../components/withPermission';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSave, faGlobe, faPencilAlt, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getAuthToken } from '../../../utils/auth';
import { useRouter } from 'next/navigation';
import Button from '../../../components/Button';
import GlobalLoader from '../../../components/GlobalLoader';

function SeoDashboard() {
    const router = useRouter();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPage, setSelectedPage] = useState(null); // For editing
    const [saving, setSaving] = useState(false);

    // Grouped by Root Folder Structure
    const systemPages = [
        // --- Main Pages ---
        { page_identifier: 'home', title: 'Home Page', path: '/' },
        { page_identifier: 'about', title: 'About Us', path: '/about' },

        { page_identifier: 'blogs', title: 'Blogs', path: '/blogs' },
        { page_identifier: 'contact', title: 'Contact Us', path: '/contact' },
        { page_identifier: 'enquiry-form', title: 'Enquiry Form', path: '/enquiry-form' },

        // --- Auth & User ---
        { page_identifier: 'login', title: 'Login Page', path: '/login' },
        { page_identifier: 'signup', title: 'Sign Up Page', path: '/signup' },

        // --- E-Commerce & Shop ---
        { page_identifier: 'shop', title: 'Shop Page', path: '/shop' },
        { page_identifier: 'cart', title: 'Cart Page', path: '/cart' },
        { page_identifier: 'checkout', title: 'Checkout Page', path: '/checkout' },
        { page_identifier: 'wishlist', title: 'Wishlist Page', path: '/wishlist' },

        // --- Services Root ---
        { page_identifier: 'service-main', title: 'Services Main', path: '/services' },

        // --- Services: Videos ---
        { page_identifier: 'service-videos', title: 'Service: Videos Main', path: '/services/videos' },
        { page_identifier: 'service-video-ads', title: 'Service: Adbuth Ads', path: '/services/videos/adbuth-ads' },
        { page_identifier: 'service-video-corporate', title: 'Service: Corporate', path: '/services/videos/adbuth-corporate' },
        { page_identifier: 'service-video-edits', title: 'Service: Edits', path: '/services/videos/adbuth-edits' },
        { page_identifier: 'service-video-music', title: 'Service: Music', path: '/services/videos/adbuth-music' },
        { page_identifier: 'service-video-politics', title: 'Service: Politics', path: '/services/videos/adbuth-politics' },

        // --- Services: Designing ---
        { page_identifier: 'service-designing', title: 'Service: Designing', path: '/services/designing' },
        { page_identifier: 'service-design-invitations', title: 'Service: E-Invitations', path: '/services/designing/adbuth-e-invitations' },
        { page_identifier: 'service-design-graphics', title: 'Service: Adbuth Graphics', path: '/services/designing/adbuth-graphics' },

        // --- Services: Learning ---
        { page_identifier: 'service-learning', title: 'Service: Learning', path: '/services/learning' },
        { page_identifier: 'service-learning-dam', title: 'Service: Adbuth DAM', path: '/services/learning/adbuth-dam' },
        { page_identifier: 'service-learning-elearning', title: 'Service: E-Learning', path: '/services/learning/adbuth-e-learning' },

        // --- Legal & Policies ---
        { page_identifier: 'privacy', title: 'Privacy Policy', path: '/privacy' },
        { page_identifier: 'terms', title: 'Terms & Conditions', path: '/terms' },
        { page_identifier: 'refund', title: 'Refund Policy', path: '/refund' },
        { page_identifier: 'shipping', title: 'Shipping Policy', path: '/shipping' },
    ];

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }
            const res = await axios.get(`${apiUrl}/api/seo/pages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Merge system pages with DB results
            const dbPages = res.data;
            const merged = systemPages.map(sys => {
                const found = dbPages.find(d => d.page_identifier === sys.page_identifier);
                return found || sys;
            });

            // Also add any custom pages from DB that aren't in systemPages
            const custom = dbPages.filter(d => !systemPages.find(s => s.page_identifier === d.page_identifier));

            setPages([...merged, ...custom]);
            setLoading(false);
        } catch (error) {
            console.error(error);
            // If API fails (maybe route doesn't exist yet), just show system defaults
            setPages(systemPages);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }
            await axios.post(`${apiUrl}/api/seo/pages`, selectedPage, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPages();
            setSelectedPage(null);
        } catch (error) {
            alert('Failed to save SEO');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (page) => {
        if (!window.confirm(`Are you sure you want to delete SEO for ${page.page_identifier}?`)) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            await axios.delete(`${apiUrl}/api/seo/pages/${page.page_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPages();
        } catch (error) {
            alert('Failed to delete SEO');
        }
    };

    if (loading) return <div>Loading SEO...</div>;

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">SEO Management</h1>
                    <p className="text-gray-400">Optimize search engine visibility for static pages</p>
                </div>
                <Button 
                    onClick={() => setSelectedPage({ page_identifier: '', title: '', path: '', meta_title: '', meta_description: '', keywords: '', isNew: true })}
                    variant="primary"
                    className="flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Page SEO
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map((page, idx) => (
                    <div key={idx} className="bg-[#1E1628] border border-[#2d1b4e] rounded-2xl p-6 hover:border-[#a78bfa]/50 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                                <FontAwesomeIcon icon={faGlobe} className="text-xl" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedPage(page)} className="text-gray-500 hover:text-white transition-colors">
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                </button>
                                {page.page_id && !systemPages.find(s => s.page_identifier === page.page_identifier) && (
                                    <button onClick={() => handleDelete(page)} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{page.title || page.page_identifier}</h3>
                        <p className="text-xs text-gray-500 font-mono mb-4">{page.path}</p>

                        <div className="space-y-2">
                            <div className="text-sm text-gray-400 truncate">
                                <span className="text-gray-600 font-bold">Title:</span> {page.meta_title || page.title || 'Default'}
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                                <span className="text-gray-600 font-bold">Desc:</span> {page.meta_description || page.description || 'Default'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {selectedPage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1E1628] border border-[#2d1b4e] rounded-2xl w-full max-w-2xl p-8 shadow-2xl animate-scaleIn">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {selectedPage.isNew ? 'Add New SEO' : `Edit SEO: ${selectedPage.title || selectedPage.page_identifier}`}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">Page Identifier</label>
                                    <input
                                        value={selectedPage.page_identifier || ''}
                                        onChange={e => setSelectedPage({ ...selectedPage, page_identifier: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        disabled={!selectedPage.isNew}
                                        className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-white outline-none focus:border-[#a78bfa] disabled:opacity-50"
                                        placeholder="e.g. my-custom-page"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">Route Path</label>
                                    <input
                                        value={selectedPage.path || ''}
                                        onChange={e => setSelectedPage({ ...selectedPage, path: e.target.value })}
                                        className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-white outline-none focus:border-[#a78bfa]"
                                        placeholder="e.g. /my-custom-page"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Meta Title</label>
                                <input
                                    value={selectedPage.meta_title || selectedPage.title || ''}
                                    onChange={e => setSelectedPage({ ...selectedPage, meta_title: e.target.value, title: e.target.value })}
                                    className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-white outline-none focus:border-[#a78bfa]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Meta Description</label>
                                <textarea
                                    value={selectedPage.meta_description || selectedPage.description || ''}
                                    onChange={e => setSelectedPage({ ...selectedPage, meta_description: e.target.value, description: e.target.value })}
                                    rows={4}
                                    className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-white outline-none focus:border-[#a78bfa] resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Keywords</label>
                                <input
                                    value={selectedPage.keywords || selectedPage.meta_keywords || ''}
                                    onChange={e => setSelectedPage({ ...selectedPage, keywords: e.target.value, meta_keywords: e.target.value })}
                                    className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-white outline-none focus:border-[#a78bfa]"
                                    placeholder="keyword1, keyword2"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setSelectedPage(null)} className="text-gray-400 hover:text-white px-4 py-2">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-[#7C3AED] text-white px-8 py-2 rounded-xl font-bold hover:bg-[#6D28D9]">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default withPermission(SeoDashboard, 'seo');
