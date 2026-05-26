import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShareNodes, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import axios from 'axios';
import SeoHead from '../../components/SeoHead';
import useSeo from '../../hooks/useSeo';
import { cdnImage } from '../../utils/cdn';


export default function Blogs() {
  const [categories, setCategories] = useState(['All']);
  const [allPosts, setAllPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentShareUrl, setCurrentShareUrl] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);

  // Dynamic SEO
  const { seoData } = useSeo('blogs');

  // Fetch Blogs and Categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const [blogsRes, catsRes] = await Promise.all([
          axios.get(`${apiUrl}/api/blogs`),
          axios.get(`${apiUrl}/api/blogs/categories`)
        ]);

        const fetchedCats = catsRes.data.map(c => c.name);
        setCategories(['All', ...fetchedCats]);

        const formattedPosts = blogsRes.data.map(blog => ({
          slug: blog.slug,
          title: blog.title,
          date: new Date(blog.post_date || blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
          author: blog.author || 'Adbuth Team',
          category: blog.category?.name || 'Uncategorized',
          excerpt: blog.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...', // Strip HTML
          image: cdnImage(blog.thumbnail) || '/images/blog1.jpg' // Fallback image
        }));
        setAllPosts(formattedPosts);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset visible count when search or category changes
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, selectedCategory]);

  // Filter Logic
  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get visible posts based on count
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  // Load more handler
  const loadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  // Share handlers
  const handleShare = (slug) => {
    const url = `${window.location.origin}/blogs/${slug}`;
    setCurrentShareUrl(url);
    setShareModalOpen(true);
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(currentShareUrl)}`, '_blank');
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentShareUrl)}`, '_blank');
  };

  const shareToEmail = () => {
    window.location.href = `mailto:?subject=Check out this blog&body=${encodeURIComponent(currentShareUrl)}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(currentShareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      <SeoHead
        title={seoData?.meta_title || seoData?.title || "Our Blog | Adbuth Verse"}
        description={seoData?.meta_description || seoData?.description || "Explore the latest insights, trends, and stories from Adbuth Verse."}
        image={seoData?.og_image || "https://assets.adbuthverse.com/website-assets/pages/blogs/blogs-header.webp"}
        author={seoData?.author || "Adbuth Verse"}
        data={seoData} // Pass full object for keywords, canonical
      />
      <Navbar highlight="blogs" isdark={false} />

      <main>

        {/* Header Section */}
        <section
          className="py-32 text-center relative z-10 bg-cover bg-bottom bg-no-repeat"
          style={{
            backgroundImage: `url('${cdnImage("https://assets.adbuthverse.com/website-assets/pages/blogs/mobile-blogs.webp")}')`
          }}
        >
          {/* Desktop background image override */}
          <div
            className="absolute inset-0 -z-10 hidden md:block bg-cover bg-bottom bg-no-repeat"
            style={{ backgroundImage: `url('${cdnImage("https://assets.adbuthverse.com/website-assets/pages/blogs/blogs-header.webp")}')` }}
          />

          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter relative z-10">
            <span className="text-[#7D287E]">ADBUTH</span> <span className="text-[#FCD804]">BLOGS</span>
          </h1>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Search */}
          <div className="relative w-2/3 block lg:hidden ml-auto">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 text-black rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7D287E]"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">
              <FontAwesomeIcon icon={faSearch} size="sm" />
            </span>
          </div>
          {/* Main Content - Blog List */}
          <div className="lg:col-span-3">

            {loading ? (
              <div className="text-center py-20 text-gray-500">Loading blogs...</div>
            ) : (
              <>
                {/* Mobile: Card Grid (2 columns) */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {visiblePosts.length > 0 ? (
                      visiblePosts.map((post, i) => (
                        <motion.div
                          key={`mobile-${post.slug}-${i}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          className="bg-white text-black rounded-lg overflow-hidden shadow-lg"
                        >
                          {/* Image & Content Link */}
                          <Link href={`/blogs/${post.slug}`}>
                            <div className="cursor-pointer">
                              <div className="relative h-28 overflow-hidden">
                                <Image
                                  src={post.image}
                                  alt={post.title}
                                  fill
                                  sizes="(max-width: 1024px) 50vw, 33vw"
                                  className="object-cover"
                                />
                              </div>

                              <div className="p-3 pb-0">
                                <h3 className="text-sm font-bold text-[#7D287E] mb-2 leading-tight line-clamp-2">
                                  {post.title}
                                </h3>

                                <p className="text-gray-700 text-[10px] leading-relaxed mb-3 line-clamp-3">
                                  {post.excerpt}
                                </p>
                              </div>
                            </div>
                          </Link>

                          {/* Meta Info with Share Button */}
                          <div className="p-3 pt-0">
                            <div className="flex items-center justify-between text-[9px] text-gray-500 border-t border-gray-200 pt-2">
                              <span>{post.date}</span>
                              <button
                                onClick={() => handleShare(post.slug)}
                                className="text-gray-400 hover:text-[#7D287E] transition-colors"
                              >
                                <FontAwesomeIcon icon={faShareNodes} className="text-sm" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="col-span-2 text-gray-500 text-center py-12">No posts found.</p>
                    )}
                  </div>

                  {/* Load More Button - Mobile */}
                  {hasMore && (
                    <div className="flex justify-center">
                      <button
                        onClick={loadMore}
                        className="bg-[#7D287E] hover:bg-[#5c1f5d] text-white text-sm py-2 px-6 rounded-full transition-colors"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop: List Layout */}
                <div className="hidden lg:block">
                  <div className="space-y-12 mb-8">
                    {visiblePosts.length > 0 ? (
                      visiblePosts.map((post, i) => (
                        <article key={`desktop-${post.slug}-${i}`} className="flex flex-col md:flex-row gap-8 items-start border-b border-gray-800 pb-12 last:border-0">
                          {/* Image */}
                          <div className="w-full md:w-1/3 shrink-0">
                            <Link href={`/blogs/${post.slug}`}>
                              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden cursor-pointer">
                                <Image src={post.image} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover hover:scale-105 transition-transform duration-500" />
                              </div>
                            </Link>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <Link href={`/blogs/${post.slug}`}>
                              <h2 className="text-2xl font-medium text-white mb-2 leading-tight hover:text-[#FCD804] transition-colors cursor-pointer">
                                {post.title}
                              </h2>
                            </Link>
                            <p className="text-[#FCD804] text-xs font-bold mb-4 uppercase">{post.date}</p>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                              {post.excerpt}
                            </p>
                            <div className="flex justify-between items-center">
                              <Link href={`/blogs/${post.slug}`} aria-label={`Read more about ${post.title}`}>
                                <button className="bg-[#5c6bc0] hover:bg-[#3949ab] text-white text-xs font-bold py-2 px-6 rounded transition-colors">
                                  Read More
                                </button>
                              </Link>
                              <button
                                onClick={() => handleShare(post.slug)}
                                className="text-gray-400 hover:text-[#FCD804] transition-colors flex items-center gap-2 text-xs font-bold group"
                              >

                                <FontAwesomeIcon icon={faShareNodes} className="text-base" />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-12">No posts found matching your criteria.</p>
                    )}
                  </div>

                  {/* Load More Button - Desktop */}
                  {hasMore && (
                    <div className="flex justify-center pt-8">
                      <button
                        onClick={loadMore}
                        className="bg-[#7D287E] hover:bg-[#5c1f5d] text-white font-semibold py-3 px-10 rounded-full transition-colors"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-12 hidden lg:block">

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 text-black rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#7D287E]"
              />
              <span className="absolute right-3 top-2.5 text-gray-500">
                <FontAwesomeIcon icon={faSearch} size="sm" />
              </span>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xl font-medium mb-6 text-white">Categories</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                {categories.map(cat => (
                  <li
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`cursor-pointer hover:text-[#FCD804] transition-colors ${selectedCategory === cat ? 'text-[#FCD804] font-bold' : ''}`}
                  >
                    {cat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Posts */}
            <div>
              <h3 className="text-xl font-medium mb-6 text-white">Recent Posts</h3>
              <ul className="space-y-4 text-xs text-gray-400">
                {allPosts.slice(0, 10).map(post => (
                  <li key={post.slug}>
                    <Link href={`/blogs/${post.slug}`} className="hover:text-[#FCD804] transition-colors leading-snug block">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </aside>

        </div>

        {/* Share Modal */}
        {shareModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShareModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Share Blog</h3>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <button
                  onClick={shareToWhatsApp}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faWhatsapp} className="text-2xl text-green-600" />
                  <span className="font-medium text-gray-900">Share on WhatsApp</span>
                </button>

                <button
                  onClick={shareToTwitter}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <FontAwesomeIcon icon={faXTwitter} className="text-2xl text-gray-900" />
                  <span className="font-medium text-gray-900">Share on X (Twitter)</span>
                </button>

                <button
                  onClick={shareToEmail}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="font-medium text-gray-900">Share via Email</span>
                </button>

                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-gray-900">Copy Link</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
