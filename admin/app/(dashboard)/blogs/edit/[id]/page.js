"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEye, faCalendar, faUser, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Image from 'next/image';
import { getAuthToken } from '../../../../../utils/auth';
import { BuilderProvider, useBuilder } from '../../../../../components/builder/BuilderContext';
import PageBuilder from '../../../../../components/builder/PageBuilder';
import { useUnsavedChangesWarning } from '../../../../../hooks/useUnsavedChangesWarning';
import withPermission from '../../../../../components/withPermission';

// Separate component to consume context
function EditBlogContent({ initialData }) {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { sections, setSections } = useBuilder();
    const [isDirty, setIsDirty] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: initialData.title || '',
        slug: initialData.slug || '',
        author: initialData.author || '',
        post_date: initialData.post_date ? new Date(initialData.post_date).toISOString().split('T')[0] : '',
        thumbnail: initialData.thumbnail || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || '',
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        meta_keywords: initialData.meta_keywords || '',
        canonical_url: initialData.canonical_url || '',
        published: initialData.published || false,
        blog_category_id: initialData.blog_category_id || ''
    });

    const [categories, setCategories] = useState([]);

    useUnsavedChangesWarning(isDirty);

    useEffect(() => {
        if (loading) {
            setIsDirty(false);
            return;
        }

        const titleChanged = (formData.title || '') !== (initialData.title || '');
        const slugChanged = (formData.slug || '') !== (initialData.slug || '');
        const authorChanged = (formData.author || '') !== (initialData.author || '');
        const dateChanged = (formData.post_date || '') !== (initialData.post_date ? new Date(initialData.post_date).toISOString().split('T')[0] : '');
        const thumbnailChanged = (formData.thumbnail || '') !== (initialData.thumbnail || '');
        const tagsChanged = (formData.tags || '') !== (Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags || '');
        const metaTitleChanged = (formData.meta_title || '') !== (initialData.meta_title || '');
        const metaDescriptionChanged = (formData.meta_description || '') !== (initialData.meta_description || '');
        const metaKeywordsChanged = (formData.meta_keywords || '') !== (initialData.meta_keywords || '');
        const canonicalUrlChanged = (formData.canonical_url || '') !== (initialData.canonical_url || '');
        const publishedChanged = Boolean(formData.published) !== Boolean(initialData.published);
        const categoryChanged = (formData.blog_category_id || '') !== (initialData.blog_category_id || '');

        const hasTextChange = titleChanged || slugChanged || authorChanged || dateChanged || thumbnailChanged || tagsChanged || metaTitleChanged || metaDescriptionChanged || metaKeywordsChanged || canonicalUrlChanged || publishedChanged || categoryChanged;

        let initialSections = [];
        if (initialData.structure) {
            try {
                initialSections = typeof initialData.structure === 'string' ? JSON.parse(initialData.structure) : initialData.structure;
            } catch (e) {
                console.error("Failed to parse structure in dirty check", e);
            }
        }
        const hasSectionChange = JSON.stringify(sections) !== JSON.stringify(initialSections);

        setIsDirty(hasTextChange || hasSectionChange);
    }, [formData, sections, initialData, loading]);

    // Load initial sections if available
    useEffect(() => {
        if (initialData.structure) {
            try {
                const parsed = typeof initialData.structure === 'string' ? JSON.parse(initialData.structure) : initialData.structure;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSections(parsed);
                }
            } catch (e) {
                console.error("Failed to parse structure", e);
            }
        }
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

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const token = getAuthToken();
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await axios.post(`${apiUrl}/api/admin/upload-blog-image`, formDataUpload, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            setFormData({ ...formData, thumbnail: res.data.url });
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    // --- HTML GENERATOR ---
    const generateHTML = () => {
        let html = '';
        sections.forEach(sec => {
            html += `<div class="grid-row ${sec.layout} my-8 gap-6 flex flex-col md:flex-row">`;
            sec.columns.forEach(col => {
                html += `<div class="grid-col flex-1 min-w-0">`;
                col.blocks.forEach(block => {
                    if (block.type === 'header') {
                        const Tag = block.level;
                        const classes = {
                            h1: "text-4xl font-extrabold mb-6 text-gray-900",
                            h2: "text-3xl font-bold mb-4 mt-8 text-gray-800",
                            h3: "text-2xl font-bold mb-3 mt-6 text-gray-800",
                            h4: "text-xl font-bold mb-2 mt-4 text-gray-800"
                        }[Tag];
                        html += `<${Tag} class="${classes}">${block.content}</${Tag}>`;
                    } else if (block.type === 'text') {
                        html += `<p class="mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">${block.content}</p>`;
                    } else if (block.type === 'list') {
                        html += `<ul class="list-disc pl-5 mb-6 space-y-2 text-gray-700">`;
                        if (Array.isArray(block.content)) {
                            block.content.forEach(item => {
                                html += `<li>${item}</li>`;
                            });
                        }
                        html += `</ul>`;
                    } else if (block.type === 'image') {
                        html += `
                            <div class="my-6">
                                <img src="${block.url}" alt="${block.alt || ''}" class="w-full rounded-2xl shadow-sm" />
                                ${block.alt ? `<p class="text-center text-sm text-gray-500 mt-2 italic">${block.alt}</p>` : ''}
                            </div>
                        `;
                    } else if (block.type === 'video') {
                        const embedUrl = block.url ? block.url.replace('watch?v=', 'embed/') : '';
                        html += `
                            <div class="my-6 relative pt-[56.25%] bg-black rounded-2xl overflow-hidden shadow-sm">
                                <iframe class="absolute inset-0 w-full h-full" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
                            </div>
                        `;
                    }
                });
                html += `</div>`;
            });
            html += `</div>`;
        });
        return html;
    };

    const handleSubmit = async () => {
        if (!formData.title) return alert('Title is required');
        if (!formData.slug) return alert('Slug is required');

        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }
            const dataToSubmit = {
                ...formData,
                content: generateHTML(),
                structure: sections, // Send as object, not string
                tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
                post_date: formData.post_date || null,
                blog_category_id: formData.blog_category_id || null // FIX: Empty string to null
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await axios.put(`${apiUrl}/api/admin/blogs/${id}`, dataToSubmit, {
                headers: { Authorization: `Bearer ${token}` }
            });

            router.push('/blogs');
        } catch (error) {
            console.error(error);
            const errMsg = error.response?.data?.error || error.message || 'Failed to update blog';
            alert(`Error: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/blogs" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1E1628] border border-[#2d1b4e] text-gray-400 hover:bg-[#2d1b4e] hover:text-[#a78bfa] transition-colors shadow-lg shadow-purple-900/10">
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Edit Blog Post</h1>
                        <p className="text-gray-400">Advanced Page Builder</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#7C3AED] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#6D28D9] transition-all shadow-lg shadow-purple-900/20"
                >
                    {loading ? 'Updating...' : 'Update Post'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-180px)]">
                {/* LEFT: Builder Canvas */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-20">
                    <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] p-6 space-y-6">
                        <div className="space-y-4 border-b border-[#2d1b4e] pb-6">
                            <input name="title" value={formData.title} required onChange={handleChange} className="w-full p-3 border border-[#2d1b4e] text-2xl rounded-xl font-bold bg-[#130C1C] outline-none placeholder-gray-600 text-white" placeholder="Post Title" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <input name="slug" value={formData.slug} required onChange={handleChange} className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm font-mono text-[#a78bfa] outline-none placeholder-gray-600" placeholder="slug-url" />
                                    <select 
                                        name="blog_category_id" 
                                        value={formData.blog_category_id || ''} 
                                        onChange={handleChange} 
                                        className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-gray-300 outline-none h-[4.5rem]"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div 
                                    onClick={() => document.getElementById('thumb-edit-upload').click()}
                                    className="relative h-32 rounded-xl bg-[#130C1C] border-2 border-dashed border-[#2d1b4e] hover:border-[#a78bfa]/50 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group"
                                >
                                    {formData.thumbnail ? (
                                        <>
                                            <img src={formData.thumbnail} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                                            <div className="relative z-10 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl text-white mb-1" />
                                                <span className="text-[10px] font-bold text-white uppercase">Replace Image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500 group-hover:text-gray-300 transition-colors">
                                            <FontAwesomeIcon icon={faCloudUploadAlt} className={`text-2xl mb-2 ${uploading ? 'animate-bounce text-[#a78bfa]' : ''}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload Thumbnail'}</span>
                                        </div>
                                    )}
                                    <input 
                                        id="thumb-edit-upload" 
                                        type="file" 
                                        hidden 
                                        accept="image/*" 
                                        onChange={handleThumbnailUpload} 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="author" value={formData.author} onChange={handleChange} className="p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-gray-300 outline-none placeholder-gray-600" placeholder="Author Name" />
                                <div className="relative">
                                    <input type="date" name="post_date" value={formData.post_date} onChange={handleChange} className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-white outline-none custom-date-input" />

                                </div>
                            </div>
                            <input name="tags" value={formData.tags} onChange={handleChange} className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-gray-300 outline-none placeholder-gray-600" placeholder="Tags (comma separated)" />

                            {/* SEO SECTION */}
                            <div className="pt-6 border-t border-[#2d1b4e] space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span> SEO Metadata
                                </h3>
                                <div className="space-y-3">
                                    <input name="meta_title" value={formData.meta_title} onChange={handleChange} className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-gray-300 outline-none placeholder-gray-600" placeholder="Meta Title (SEO)" />
                                    <textarea name="meta_description" value={formData.meta_description} onChange={handleChange} rows="3" className="w-full p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-gray-300 outline-none placeholder-gray-600 resize-none" placeholder="Meta Description"></textarea>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input name="meta_keywords" value={formData.meta_keywords} onChange={handleChange} className="p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-gray-300 outline-none placeholder-gray-600" placeholder="Keywords" />
                                        <input name="canonical_url" value={formData.canonical_url} onChange={handleChange} className="p-3 bg-[#130C1C] border border-[#2d1b4e] rounded-xl text-sm text-gray-300 outline-none placeholder-gray-600" placeholder="Canonical URL" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" name="published" checked={formData.published} onChange={handleChange} className="w-4 h-4 text-[#7C3AED] rounded cursor-pointer accent-[#7C3AED] bg-[#130C1C] border-[#2d1b4e]" id="pubCheck" />
                                <label htmlFor="pubCheck" className="text-sm font-bold text-gray-400 cursor-pointer select-none hover:text-white transition-colors">Publish Immediately</label>
                            </div>
                        </div>

                        <PageBuilder />
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                <div className="flex flex-col bg-[#130C1C] rounded-3xl overflow-hidden shadow-2xl border border-[#2d1b4e]">
                    <div className="bg-[#1E1628] px-6 py-4 border-b border-[#2d1b4e] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold">
                            <FontAwesomeIcon icon={faEye} className="text-[#a78bfa]" />
                            <span>Live Preview</span>
                        </div>
                        <div className="flex gap-1.5 opacity-60">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-black text-white font-sans">
                        {/* Fake Hero */}
                        <div className="relative h-[400px] w-full bg-gray-900 border-b border-[#2d1b4e]">
                            {formData.thumbnail ? (
                                <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                                    No Cover Image
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                                <span className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-2">
                                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Blogs
                                </span>
                                <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 text-white drop-shadow-lg">{formData.title || "Untitled Post"}</h1>
                                <div className="flex items-center gap-6 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCalendar} className="text-[#FCD804]" />
                                        {new Date(formData.post_date || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                    {formData.author && (
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faUser} className="text-[#FCD804]" />
                                            {formData.author}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Render HTML Preview */}
                        <div className="p-8">
                            <article
                                className="preview-content max-w-none text-gray-300 leading-relaxed [&_p]:mb-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-4 [&_h2]:mt-10 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-3 [&_h3]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_li]:mb-2 [&_a]:text-[#FCD804] [&_a]:underline [&_img]:rounded-2xl [&_img]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#7D287E] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400"
                                dangerouslySetInnerHTML={{ __html: generateHTML().replace(/text-gray-[8,9][0-9]+/g, 'text-gray-200').replace(/text-gray-700/g, 'text-gray-400').replace(/bg-white/g, 'bg-transparent') }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .preview-content .grid-row { display: flex; gap: 2rem; }
                @media (max-width: 768px) { .preview-content .grid-row { flex-direction: column; } }
                
                .custom-date-input::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    filter: invert(1);
                }
            `}</style>
        </>
    );
}

function EditBlog() {
    const params = useParams();
    const router = useRouter();
    const [initialData, setInitialData] = useState(null);

    useEffect(() => {
        if (params.id) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }
            axios.get(`${apiUrl}/api/admin/blogs/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setInitialData(res.data))
                .catch(err => {
                    console.error(err);
                    router.push('/blogs');
                });
        }
    }, [params.id]);

    if (!initialData) return <div className="p-8 text-center text-gray-500">Loading editor...</div>;

    return (
        <BuilderProvider>
            <EditBlogContent initialData={initialData} />
        </BuilderProvider>
    );
}

export default withPermission(EditBlog, 'blogs');
