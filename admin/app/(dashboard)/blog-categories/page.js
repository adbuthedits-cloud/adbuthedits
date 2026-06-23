"use client";
import withPermission from '../../../components/withPermission';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes, faTags, faEye } from '@fortawesome/free-solid-svg-icons';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';

function BlogCategories() {
    const user = getAuthUser() || {};
    const canEdit = user.is_super_admin || (user.permissions?.blog_categories && user.permissions.blog_categories.includes('edit'));
    const canDelete = user.is_super_admin || (user.permissions?.blog_categories && user.permissions.blog_categories.includes('delete'));

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '' });
    const [newCategory, setNewCategory] = useState({ name: '', slug: '' });
    const [showAddModal, setShowAddModal] = useState(false);

    const isDirty = (editingId !== null) || (showAddModal && (newCategory.name !== '' || newCategory.slug !== ''));
    useUnsavedChangesWarning(isDirty);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const token = getAuthToken();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${apiUrl}/api/admin/blog-categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch categories', error);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const token = getAuthToken();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await axios.post(`${apiUrl}/api/admin/blog-categories`, newCategory, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewCategory({ name: '', slug: '' });
            setShowAddModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Failed to create category', error);
            alert(error.response?.data?.error || 'Failed to create category');
        }
    };

    const handleUpdate = async (id) => {
        const token = getAuthToken();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await axios.put(`${apiUrl}/api/admin/blog-categories/${id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingId(null);
            fetchCategories();
        } catch (error) {
            console.error('Failed to update category', error);
            alert(error.response?.data?.error || 'Failed to update category');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This might affect blogs in this category.')) return;
        const token = getAuthToken();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await axios.delete(`${apiUrl}/api/admin/blog-categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category', error);
            alert(error.response?.data?.error || 'Failed to delete category');
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({ name: cat.name, slug: cat.slug });
    };

    const generateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">Blog Categories</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage categories for your blog posts</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#6D28D9] transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2 text-sm"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Add Category
                    </button>
                )}
            </div>

            <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#130C1C] border-b border-[#2d1b4e]">
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d1b4e]">
                        {categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    {editingId === cat.id ? (
                                        <input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                                            className="bg-[#130C1C] border border-[#2d1b4e] p-2 rounded text-sm text-white w-full outline-none focus:ring-1 focus:ring-purple-500"
                                        />
                                    ) : (
                                        <span className="text-gray-200 font-medium">{cat.name}</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editingId === cat.id ? (
                                        <input
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="bg-[#130C1C] border border-[#2d1b4e] p-2 rounded text-xs font-mono text-[#a78bfa] w-full outline-none"
                                        />
                                    ) : (
                                        <span className="text-xs font-mono text-gray-500 tracking-wider">/{cat.slug}</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingId === cat.id ? (
                                            <>
                                                <button onClick={() => handleUpdate(cat.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"><FontAwesomeIcon icon={faSave} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-white/10 rounded transition-colors"><FontAwesomeIcon icon={faTimes} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => alert(JSON.stringify(cat, null, 2))} className="p-2 text-green-400 hover:bg-green-400/10 rounded transition-colors"><FontAwesomeIcon icon={faEye} /></button>
                                                {canEdit && <button onClick={() => startEdit(cat)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"><FontAwesomeIcon icon={faEdit} /></button>}
                                                {canDelete && <button onClick={() => handleDelete(cat.id)} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded transition-colors"><FontAwesomeIcon icon={faTrash} /></button>}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {categories.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-500 italic">No categories yet. Click "Add Category" to start.</div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={handleCreate} className="bg-[#1E1628] border border-[#2d1b4e] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Add New Category</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Category Name</label>
                                <input
                                    autoFocus
                                    required
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, slug: generateSlug(e.target.value) })}
                                    className="w-full bg-[#130C1C] border border-[#2d1b4e] p-3 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="e.g. Wedding Photography"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Slug</label>
                                <input
                                    required
                                    value={newCategory.slug}
                                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                                    className="w-full bg-[#130C1C] border border-[#2d1b4e] p-3 rounded-xl text-xs font-mono text-[#a78bfa] outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-[#2d1b4e] text-gray-400 font-bold hover:bg-white/5 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#7C3AED] text-white font-bold hover:bg-[#6D28D9] transition-all shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default withPermission(BlogCategories, 'blog_categories');
