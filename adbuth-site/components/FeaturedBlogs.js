import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image';

export default function FeaturedBlogs({ items = [] }) {
  if (!items || items.length === 0) return null;

  const featuredItems = items.slice(0, 3);
  const sidebarItems = items.slice(3, 6);
  const hasSidebar = sidebarItems.length > 0;

  return (
    <section className="hidden lg:block bg-gray-100 py-20 text-black">
      <div className="max-w-7xl mx-auto px-6">
        <h3 className="text-4xl font-black uppercase tracking-tight mb-12">Featured Blogs</h3>

        <div className="flex flex-col lg:flex-row gap-6 ">
          {/* Main Featured Cards */}
          <div className="w-full lg:w-[75%] flex flex-col md:flex-row gap-6">
            {featuredItems.map((b, i) => (
              <Link href={`/blogs/${b.slug}`} key={b.slug} className="w-full  md:w-1/3 ">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer w-full shadow-md"
                >
                  <Image
                    src={b.image}
                    alt={b.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6">
                    <h4 className="text-white font-bold text-lg md:text-xl leading-snug mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">{b.title}</h4>
                    <p className="text-gray-300 text-xs line-clamp-2">{b.meta_description || b.excerpt}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Sidebar List */}
          {hasSidebar && (
            <div className="w-full lg:w-[25%] flex flex-col justify-between">
              {sidebarItems.map((b, i) => (
                <Link href={`/blogs/${b.slug}`} key={b.slug}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    className="flex gap-4 items-end hover:bg-white rounded-2xl transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-200 group"
                  >
                    <div className="relative aspect-square w-[7vw] flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                      <Image
                        src={b.image}
                        alt="thumb"
                        fill
                        sizes="96px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold leading-tight group-hover:text-purple-700 transition-colors line-clamp-3 mb-2">
                        {b.title}
                      </h5>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/blogs" className="inline-block px-8 py-3 rounded-full border border-black hover:bg-black hover:text-white transition-all font-medium">
            View all
          </Link>
        </div>
      </div>
    </section>
  )
}
