"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '../../../../../utils/auth';
import withPermission from '../../../../../components/withPermission';
import ActionToolbar from '../../../../../components/ActionToolbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faTags, faImage, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { getSafeImageSrc } from '../../../../../utils/image';
import Image from 'next/image';

function ViewBlog({ user }) {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const token = getAuthToken();
                if (!token) {
                    router.push('/login');
                    return;
                }
                const res = await axios.get(`${apiUrl}/api/admin/blogs/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBlog(res.data);
            } catch (error) {
                console.error("Failed to fetch blog", error);
                alert("Failed to load blog details.");
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBlog();
        }
    }, [id, router]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this blog?')) return;
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            await axios.delete(`${apiUrl}/api/admin/blogs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            router.push('/blogs');
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete blog");
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

    if (!blog) return null;

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Blog Details</h1>
                <p className="text-gray-400">Viewing read-only details for "{blog.title}"</p>
            </div>

            <ActionToolbar 
                user={user}
                module="blogs"
                onEdit={() => router.push(`/blogs/edit/${id}`)}
                onDelete={handleDelete}
                backUrl="/blogs"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Content (Left, 2 columns wide) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Core Info */}
                    <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                            <FontAwesomeIcon icon={faFileAlt} className="text-[#a78bfa] text-xl" />
                            <h2 className="text-xl font-bold text-white">Content Overview</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Title</label>
                                <div className="text-white text-xl font-bold bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                    {blog.title}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Slug</label>
                                <div className="text-gray-400 font-mono bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                    {blog.slug}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Content Snippet (Raw formatted text)</label>
                                <div className="text-gray-300 bg-[#130C1C] px-4 py-4 rounded-xl border border-[#2d1b4e] min-h-[200px] max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                                    <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right, 1 column wide) */}
                <div className="space-y-6">
                    
                    {/* Media */}
                    <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                            <FontAwesomeIcon icon={faImage} className="text-blue-400 text-xl" />
                            <h2 className="text-xl font-bold text-white">Media</h2>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Thumbnail</label>
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#130C1C] border border-[#2d1b4e] flex items-center justify-center">
                                {blog.thumbnail ? (
                                    <Image src={getSafeImageSrc(blog.thumbnail)} alt="Thumbnail preview" fill className="object-cover" />
                                ) : (
                                    <div className="text-center text-gray-600">
                                        <FontAwesomeIcon icon={faImage} className="text-3xl mb-2" />
                                        <p className="text-xs">No thumbnail</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta Data */}
                    <div className="bg-[#1E1628] rounded-2xl p-6 border border-[#2d1b4e] shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#2d1b4e] pb-4">
                            <FontAwesomeIcon icon={faInfoCircle} className="text-emerald-400 text-xl" />
                            <h2 className="text-xl font-bold text-white">Meta Data</h2>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Status</label>
                                <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border max-w-full ${blog.published ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                    {blog.published ? 'Published' : 'Draft'}
                                </div>
                            </div>
                            
                            {blog.category && (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Category</label>
                                    <div className="text-[#a78bfa] font-bold bg-[#130C1C] px-4 py-3 rounded-xl border border-[#2d1b4e]">
                                        {blog.category.name}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Meta Description</label>
                                <div className="text-gray-300 bg-[#130C1C] p-4 rounded-xl border border-[#2d1b4e] text-sm">
                                    {blog.meta_description || <span className="italic opacity-50">Not specified</span>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {(blog.tags && blog.tags.length > 0) ? (
                                        typeof blog.tags === 'string' ? JSON.parse(blog.tags).map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-[#2d1b4e] text-white text-xs rounded-full border border-[#4a2d7a]">{tag}</span>
                                        )) : blog.tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-[#2d1b4e] text-white text-xs rounded-full border border-[#4a2d7a]">{tag}</span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm italic">No tags</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default withPermission(ViewBlog, 'blogs', 'view');
