import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Footer from '../../components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendar, faUser } from '@fortawesome/free-solid-svg-icons';
import SeoHead from '../../components/SeoHead';
import { cdnImage } from '../../utils/cdn';

export default function BlogPost() {
  const router = useRouter()
  const { slug } = router.query
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/blogs/${slug}`);
      setBlog(res.data);
    } catch (err) {
      console.error(err);
      setError('Blog post not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="bg-black min-h-screen text-white font-sans flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  );

  if (error || !blog) return (
    <div className="bg-black min-h-screen text-white font-sans flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-red-500">Error</h1>
      <p>{error || 'Post not found'}</p>
      <Link href="/blogs" className="text-[#FCD804] hover:underline">Back to Blogs</Link>
    </div>
  );

  const thumbnail = cdnImage(blog.thumbnail);

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      <SeoHead
        data={{
          meta_title: blog.meta_title,
          meta_description: blog.meta_description,
          meta_keywords: blog.meta_keywords || (blog.tags ? blog.tags.join(', ') : ''),
          og_image: thumbnail,
          canonical_url: blog.canonical_url
        }}
        title={`${blog.title} | Adbuth Verse`}
        description={blog.meta_description || blog.content.substring(0, 160)}
        image={thumbnail}
        author={blog.author || "Adbuth Verse"}
      />
      <main className="pt-24 min-h-screen">

        {/* Hero Section */}
        <div className="relative h-[450px] w-full bg-gray-900">
          {thumbnail ? (
            <Image src={thumbnail} alt={blog.title} fill className="object-cover opacity-60" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
              No Cover Image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-8 md:p-24 md:pb-10 max-w-7xl mx-auto">
            <Link href="/blogs" className="text-gray-400 hover:text-[#FCD804] text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-2 transition-colors">
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Blogs
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 text-white drop-shadow-lg">{blog.title}</h1>
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendar} className="text-[#FCD804]" />
                {new Date(blog.post_date || blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              {blog.author && (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-[#FCD804]" />
                  {blog.author}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          <article className="max-w-none text-gray-300 leading-relaxed [&_p]:mb-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-4 [&_h2]:mt-10 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-3 [&_h3]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_li]:mb-2 [&_a]:text-[#FCD804] [&_a]:underline [&_img]:rounded-2xl [&_img]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#7D287E] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400">
            {/* 
                   Render HTML Content 
                   Note: Ensure blog.content comes from a trusted source (Admin)
                */}
            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
          </article>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-800">
              <h3 className="text-sm font-bold text- uppercase tracking-widest mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-900 text-gray-300 rounded-full text-xs font-medium border border-gray-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  )
}

