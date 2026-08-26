/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    transpilePackages: ['@fortawesome/fontawesome-svg-core'],

    // Limit concurrency and worker threads to prevent high RAM/CPU usage during dev compilation
    experimental: {
        workerThreads: false,
        cpus: 1
    },

    // Images served from Cloudflare R2 CDN — keep unoptimized to avoid OOM on Render's 512MB limit.
    // Cloudflare handles compression and resizing natively.
    images: {
        unoptimized: true,
        minimumCacheTTL: 86400,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev',
            },
            {
                // Custom CDN domain — set NEXT_PUBLIC_CDN_URL to this
                protocol: 'https',
                hostname: 'cdn.adbuthverse.com',
            },
            {
                protocol: 'https',
                hostname: 'assets.adbuthverse.com',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // Add security + cache-control headers for all routes
    async headers() {
        return [
            // ── Security headers for all pages ──────────────────────────────
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
            // ── Static assets: aggressive long-term caching ─────────────────
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
