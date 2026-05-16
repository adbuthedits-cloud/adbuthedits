/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        // NOTE: 'unoptimized: true' was removed — Next.js now automatically
        // resizes, compresses and converts images to WebP/AVIF on-the-fly.
        // This is the single biggest performance improvement for the shop page.
        formats: ['image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200],
        imageSizes: [128, 256, 384],
        minimumCacheTTL: 86400, // Cache optimized images for 24h
        remotePatterns: [
            // Cloudflare R2 public bucket
            {
                protocol: 'https',
                hostname: 'pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev',
            },
            // Wildcard fallback (covers any other CDN or old URLs)
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
}

module.exports = nextConfig
