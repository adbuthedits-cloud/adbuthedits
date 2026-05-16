/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // unoptimized: true is critical for Render's 512MB memory limit.
        // It prevents Next.js from running the memory-heavy 'sharp' process.
        unoptimized: true,
        remotePatterns: [
            { protocol: 'http', hostname: 'localhost' },
            { protocol: 'https', hostname: '**.r2.dev' },
            { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
            { protocol: 'https', hostname: '**.amazonaws.com' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
            { protocol: 'https', hostname: 'fastly.picsum.photos' },
            { protocol: 'https', hostname: 'picsum.photos' },
            { protocol: 'https', hostname: 'img.youtube.com' },
            { protocol: 'https', hostname: 'ui-avatars.com' }
        ],
    },
    // Limit concurrency to reduce memory usage during build
    experimental: {
        workerThreads: false,
        cpus: 1
    },
    // Disable compression to save some runtime memory (Render handles this anyway)
    compress: false,
};

module.exports = nextConfig;
