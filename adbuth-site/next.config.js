/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            // Cloudflare R2 public bucket (dev URL)
            {
                protocol: 'https',
                hostname: 'pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev',
            },
            // Wildcard fallback (covers any other CDN or old B2 URLs)
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
}

module.exports = nextConfig
