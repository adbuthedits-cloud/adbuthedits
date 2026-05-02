/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
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
};

module.exports = nextConfig;
