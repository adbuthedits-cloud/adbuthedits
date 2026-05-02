import Head from 'next/head';
import { useState, useEffect } from 'react';

const SeoHead = ({ page, data, title, description, image, author, loading = false }) => {
    // State for static page data fetching
    const [staticMeta, setStaticMeta] = useState(null);

    useEffect(() => {
        // If 'page' identifier is provided (e.g. 'home'), fetch global SEO settings
        if (page && !data) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            fetch(`${apiUrl}/api/seo/pages`)
                .then(res => res.json())
                .then(pages => {
                    const match = pages.find(p => p.page_identifier === page);
                    if (match) setStaticMeta(match);
                })
                .catch(err => console.error("SEO Fetch Error", err));
        }
    }, [page]);

    // Determine final values
    // Priority: Explicit Data (from props/DB) > Static Fetch > Fallback Props > Default
    const meta = data || staticMeta || {};

    // Dynamic Fallbacks
    const finalTitle = meta.meta_title || meta.title || title || 'ADBUTH Media Works';
    const finalDesc = meta.meta_description || meta.description || description || 'Premium Video Editing Templates and Services';
    const finalKeywords = meta.meta_keywords || meta.keywords || 'video editing, templates, adbuth, media';
    const finalImage = meta.og_image || image || 'https://adbuth.com/og-default.jpg';
    const finalAuthor = meta.author || author;
    const finalCanonical = meta.canonical_url || (typeof window !== 'undefined' ? window.location.href : '');

    if (loading) return null;

    return (
        <Head>
            <title>{finalTitle}</title>
            <meta name="description" content={finalDesc} />
            <meta name="keywords" content={finalKeywords} />
            {meta.no_index && <meta name="robots" content="noindex,nofollow" />}
            {finalCanonical && <link rel="canonical" href={finalCanonical} />}
            {finalAuthor && <meta name="author" content={finalAuthor} />}

            {/* Open Graph */}
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDesc} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:url" content={finalCanonical} />
            <meta property="og:type" content="website" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDesc} />
            <meta name="twitter:image" content={finalImage} />
        </Head>
    );
};

export default SeoHead;
