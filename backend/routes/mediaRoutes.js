const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Whitelisted R2 hostname patterns — only proxy from your own bucket
const ALLOWED_HOSTNAME_PATTERNS = [
    /\.r2\.dev$/,                       // public R2 buckets (pub-xxx.r2.dev)
    /\.cloudflarestorage\.com$/,        // private R2 via S3 API
    /\.cloudflare\.com$/,
    /(^|\.)adbuthverse\.com$/,          // assets CDN and main domain
];

function isAllowedUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        // Only allow HTTPS (and HTTP for localhost dev)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
        // Hostname must match one of our R2 patterns
        return ALLOWED_HOSTNAME_PATTERNS.some(pattern => pattern.test(parsed.hostname));
    } catch {
        return false;
    }
}

/**
 * GET /api/media/proxy-video?url=<encoded-r2-url>
 *
 * Acts as a CORS proxy specifically for R2-hosted videos.
 * The backend fetches the video server-to-server (no CORS issue),
 * then streams it to the browser with Access-Control-Allow-Origin: *
 * so the browser's canvas can safely read video pixels.
 *
 * Security:
 *  - Only proxies URLs from allowed R2 hostnames (whitelist)
 *  - Does not execute or store the content
 *  - Streams directly to the client without buffering large files in memory
 */
router.get('/proxy-video', (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter.' });
    }

    let decodedUrl;
    try {
        decodedUrl = decodeURIComponent(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL encoding.' });
    }

    if (!isAllowedUrl(decodedUrl)) {
        return res.status(403).json({ error: 'URL not allowed. Only R2-hosted media can be proxied.' });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(decodedUrl);
    } catch {
        return res.status(400).json({ error: 'Malformed URL.' });
    }

    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
            // Forward range requests so video seeking works in the browser
            ...(req.headers.range ? { Range: req.headers.range } : {}),
        },
    };

    const proxyReq = protocol.request(options, (proxyRes) => {
        // Add permissive CORS headers so the browser allows canvas pixel access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range, Accept-Ranges');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Forward important response headers from R2
        const headersToForward = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
            'etag',
            'last-modified',
        ];
        headersToForward.forEach(h => {
            if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
        });

        res.status(proxyRes.statusCode);
        // Stream the video bytes directly — zero buffering, zero CPU overhead
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('[MediaProxy] Upstream error:', err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Failed to fetch media from upstream.' });
        }
    });

    req.on('close', () => {
        // Client disconnected early (e.g. navigated away) — abort upstream request
        proxyReq.destroy();
    });

    proxyReq.end();
});

module.exports = router;
