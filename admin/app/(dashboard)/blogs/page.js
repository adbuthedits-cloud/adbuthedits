"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faPenNib, faTags, faTrash, faEye, faEdit } from '@fortawesome/free-solid-svg-icons';
import withPermission from '../../../components/withPermission';
import { getAuthToken, getAuthUser, hasPermission } from '../../../utils/auth';
import { getSafeImageSrc } from '../../../utils/image';
import Image from 'next/image';

function Blogs() {
    const user = getAuthUser();
    const canEdit = hasPermission(user, 'blogs', 'edit');
    const canDelete = hasPermission(user, 'blogs', 'delete');

    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchBlogs();
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
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchBlogs = async () => {
        const token = getAuthToken();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${apiUrl}/api/admin/blogs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlogs(res.data);
        } catch (error) {
            console.error('Failed to fetch blogs', error);
        }
    };

    const filteredBlogs = blogs.filter(b => {
        const matchesSearch = (b.title || '').toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory ? b.blog_category_id === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;
        const token = getAuthToken();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await axios.delete(`${apiUrl}/api/admin/blogs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBlogs();
        } catch (error) {
            console.error('Failed to delete blog', error);
            alert('Failed to delete blog');
        }
    };


    const [visibleCount, setVisibleCount] = useState(20);
    const visibleBlogs = filteredBlogs.slice(0, visibleCount);

    const loadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-white tracking-tight">Blog Posts</h1>
                    <p className="text-gray-400 text-sm mt-1">Create and manage your blog content</p>
                </div>
                {canEdit && (
                    <Link href="/blogs/create" className="bg-[#7C3AED] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#6D28D9] transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2 text-sm">
                        <FontAwesomeIcon icon={faPlus} />
                        New Post
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-[#1E1628] p-2.5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-[#2d1b4e] mb-8 flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-[400px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-sm" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search blogs..."
                        className="w-full pl-11 pr-4 py-2.5 bg-[#2d1b4e] text-sm text-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#a78bfa]/50 transition-all placeholder-gray-500 border border-transparent focus:border-[#a78bfa]/30"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2.5 bg-[#2d1b4e] text-sm text-gray-200 rounded-lg outline-none border border-transparent focus:border-[#a78bfa]/30 min-w-[200px]"
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleBlogs.map(blog => (
                    <div key={blog.blog_id} className="bg-[#1E1628] rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] overflow-hidden hover:shadow-xl hover:shadow-purple-900/10 transition-all group hover:-translate-y-1">
                        <div className="h-48 bg-[#130C1C] relative overflow-hidden group">
                            {blog.thumbnail ? (
                                <Image src={getSafeImageSrc(blog.thumbnail)} alt={blog.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <FontAwesomeIcon icon={faSearch} className="text-3xl opacity-30" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-[#130C1C]/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-3">
                                <Link href={`/blogs/view/${blog.blog_id}`}>
                                    <button className="w-10 h-10 rounded-full bg-[#1E1628] text-white hover:text-green-400 hover:scale-110 transition-all flex items-center justify-center shadow-lg border border-[#2d1b4e]">
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                </Link>
                                {canEdit && (
                                    <Link href={`/blogs/edit/${blog.blog_id}`}>
                                        <button className="w-10 h-10 rounded-full bg-[#1E1628] text-white hover:text-[#a78bfa] hover:scale-110 transition-all flex items-center justify-center shadow-lg border border-[#2d1b4e]">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    </Link>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(blog.blog_id)}
                                        className="w-10 h-10 rounded-full bg-[#1E1628] text-white hover:text-red-400 hover:scale-110 transition-all flex items-center justify-center shadow-lg border border-[#2d1b4e]"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide inline-block ${blog.published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                    {blog.published ? 'Published' : 'Draft'}
                                </span>
                                {blog.category && (
                                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-block">
                                        {blog.category.name}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-[#a78bfa] transition-colors">{blog.title}</h3>
                            <p className="text-gray-400 text-sm mb-0 line-clamp-2 leading-relaxed opacity-80">{blog.content.substring(0, 100)}...</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredBlogs.length && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={loadMore}
                        className="px-6 py-3 rounded-xl bg-[#2d1b4e] text-gray-200 font-bold hover:bg-[#3b2a5f] hover:text-white transition-all shadow-lg border border-[#3b2a5f]"
                    >
                        Load More Posts
                    </button>
                </div>
            )}

            {filteredBlogs.length === 0 && (
                <div className="text-center py-20 bg-[#1E1628] rounded-[24px] border border-dashed border-[#2d1b4e]">
                    <div className="text-[#2d1b4e] mb-4 text-5xl">
                        <FontAwesomeIcon icon={faSearch} />
                    </div>
                    <h3 className="text-lg font-bold text-white">No Blogs Found</h3>
                    <p className="text-gray-400 mt-1">Create your first blog post to get started.</p>
                </div>
            )}
        </>
    );
}

export default withPermission(Blogs, 'blogs');

