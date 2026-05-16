/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        // unoptimized: true is intentional — images are served from Cloudflare R2/CDN
        // which handles compression and resizing natively. Next.js image optimization
        // (sharp) runs in-process and would OOM on Render's 512MB limit.
        unoptimized: true,
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
}

module.exports = nextConfig
