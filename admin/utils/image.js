/**
 * Validates an image source string to ensure it won't crash the next/image component.
 * Next.js Image requires absolute URLs (http/https) or valid relative paths (starting with /).
 */
export const isValidImageSrc = (src) => {
    if (!src || typeof src !== 'string') return false;
    return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/');
};

/**
 * Returns a safe image source for next/image, or a fallback placeholder if invalid.
 */
export const getSafeImageSrc = (src, fallback = '/images/placeholder-blog.png') => {
    return isValidImageSrc(src) ? src : fallback;
};
