import dynamic from 'next/dynamic'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import SeoHead from '../components/SeoHead'
import useSeo from '../hooks/useSeo'

const WhatWeDo = dynamic(() => import('../components/WhatWeDo'), { ssr: false })
const FeaturedBlogs = dynamic(() => import('../components/FeaturedBlogs'), { ssr: false })
const FAQ = dynamic(() => import('../components/FAQ'), { ssr: false })
const ContactForm = dynamic(() => import('../components/ContactForm'), { ssr: false })
const Footer = dynamic(() => import('../components/Footer'), { ssr: false })

const sampleBlogs = [
  { slug: 'storytelling-magic', title: 'How to create memorable videos', excerpt: 'Short excerpt...', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/blog-1.png' },
  { slug: 'editing-tips', title: 'How a Good Editing makes a difference', excerpt: 'Short excerpt...', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/blog-2.png' },
  { slug: 'preserve-moments', title: 'Preserving life\'s special moments', excerpt: 'Short excerpt...', image: 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/blog-3.png' }
]

const faqs = [
  { q: 'Why does one need to choose Adbuth Verse?', a: 'We bring together a wealth of expertise in editing, sound design, motion graphics, colour grading, animations, and visual effects, all of which are essential to creating a polished, impactful final product. Additionally, we also understand the current trends and latest technologies and deliver them according to your needs.' },
  { q: 'How Adbuth Verse can add value to your memories?', a: 'Adbuth Verse with their expertise in their field of work enhances the emotional depth of the video, elevating it beyond a simple recording to a cinematic experience ensuring that your memories are immortalized with the highest level of quality, artistry and attention to detail.' },
  { q: 'How Adbuth Verse deliver your projects on time?', a: 'We provide personalised attention and professional results regardless of the project\'s scale based on first-cum-first-serve basis.' },
  { q: 'What kind of industries do you serve at Adbuth Verse?', a: 'We serve a diverse clientele, including businesses, advertising agencies, content creators, filmmakers, influencers, YouTubers and more.' },
  { q: 'Do you work with clients of all project sizes?', a: 'Whether you\'re working on a small personal project or a large-scale production, we offer customized solutions for projects of any scale.' },
  { q: 'How can I submit my footage/ video for editing?', a: 'You can upload your content to our secured cloud storage. Once we agree to work on the project, a personalised and secured cloud drive access will be provided.' },
  { q: 'Can you help with just specific aspects of post-production?', a: 'Yes, we can! Whether you need help with a particular service like video editing, color grading, or sound design, or need comprehensive post-production studio support, we are flexible and can tailor our services to fit the scope of your project.' },
  { q: 'At Adbuth Verse, do you offer specialised editing services (e.g., 4K editing, VFX, animation)?', a: 'Yes, we offer specialised services such as high-resolution (4K) editing, visual effects (VFX), animation, and other advanced editing techniques.' },
]


export async function getStaticProps() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiUrl}/api/blogs`);
    const blogs = await res.json();

    const items = blogs
      .filter(b => b.published)
      .slice(0, 6)
      .map(b => ({
        slug: b.slug,
        title: b.title,
        excerpt: b.meta_description || b.content.substring(0, 150) + '...',
        meta_description: b.meta_description || '',
        image: b.thumbnail || 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev/website-assets/pages/home/blog-1.png'
      }));

    return {
      props: {
        items,
      },
      revalidate: 60, // Refresh data at most every 60 seconds
    };
  } catch (error) {
    console.error("Error fetching blogs for home page:", error);
    return {
      props: {
        items: [],
      },
      revalidate: 60,
    };
  }
}

export default function Home({ items }) {
  return (
    <div>
      <SeoHead page="home" />
      <Navbar />
      <main className='bg-white'>
        <Hero />
        <WhatWeDo />
        <FeaturedBlogs items={items || []} />
        <FAQ questions={faqs} />
        <ContactForm />
      </main>

      <Footer />
    </div>
  )
}
