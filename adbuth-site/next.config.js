/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    transpilePackages: ['@fortawesome/fontawesome-svg-core'],

    // Images served from Cloudflare R2 CDN — keep unoptimized to avoid OOM on Render's 512MB limit.
    // Cloudflare handles compression and resizing natively.
    images: {
        unoptimized: true,
        minimumCacheTTL: 86400, // Cache images for 24 hours on CDN
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // Add cache-control headers for all static assets
    async headers() {
        return [
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/:path*.{jpg,jpeg,png,gif,svg,ico,webp,avif,mp4,webm}',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=86400, stale-while-revalidate=604800',
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig
