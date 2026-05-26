/**
 * cdn.js — Central CDN URL utility with web-optimized version support
 *
 * Convention:
 *   Original:  products/image.png       → stored in R2, never shown on web
 *   Web image: products/image.webp      → auto-converted WebP, served to browsers
 *   Original:  products/video.mp4       → stored in R2, used for download
 *   Web video: products/video_web.mp4   → compressed preview, served to browsers
 *
 * Change NEXT_PUBLIC_CDN_URL in .env to switch CDN domains globally.
 */

const R2_ORIGIN = 'https://pub-439d84178c4c4a779aaeb4ebd0df65c8.r2.dev'
const OLD_CDN = 'https://cdn.adbuthverse.com'

function getCdnBase() {
  return (process.env.NEXT_PUBLIC_CDN_URL || R2_ORIGIN).replace(/\/$/, '')
}

function replaceOrigins(url) {
  if (!url || typeof url !== 'string') return url
  const base = getCdnBase()
  return url.replace(R2_ORIGIN, base).replace(OLD_CDN, base)
}

/**
 * Convert any R2 URL to the custom CDN URL.
 * @param {string|null|undefined} url
 * @returns {string|null|undefined}
 */
export function cdnUrl(url) {
  if (!url || typeof url !== 'string') return url
  return replaceOrigins(url)
}

/**
 * Get the web-optimized IMAGE URL (WebP).
 * Falls back to original if no WebP version exists.
 *
 * Original:  /folder/image.png  &rarr;  /folder/image.webp
 * If already .webp or not an image extension &rarr; returns cdnUrl(url)
 *
 * @param {string|null|undefined} url
 * @returns {string|null|undefined}
 */
export function cdnImage(url) {
  if (!url || typeof url !== 'string') return url
  return replaceOrigins(url)
}

/**
 * Get the web-optimized VIDEO URL (_web.mp4 compressed preview).
 * Falls back to original CDN URL if no _web version exists.
 *
 * @param {string|null|undefined} url
 * @returns {string|null|undefined}
 */
export function cdnVideo(url) {
  if (!url || typeof url !== 'string') return url
  return replaceOrigins(url)
}

/**
 * Convert an array of URLs (images or mixed).
 * @param {string[]|null|undefined} urls
 * @param {'image'|'video'|'auto'} type
 * @returns {string[]}
 */
export function cdnUrls(urls, type = 'auto') {
  if (!Array.isArray(urls)) return urls
  return urls.map(url => {
    if (type === 'image') return cdnImage(url)
    if (type === 'video') return cdnVideo(url)
    // auto: detect by extension
    if (/\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i.test(url)) return cdnVideo(url)
    if (/\.(png|jpg|jpeg|gif|tiff|bmp)(\?.*)?$/i.test(url)) return cdnImage(url)
    return cdnUrl(url)
  })
}

/**
 * Process a JSON field (Product.images or Product.video arrays).
 * @param {any} json
 * @param {'image'|'video'|'auto'} type
 * @returns {any}
 */
export function cdnJson(json, type = 'auto') {
  if (!json) return json
  if (Array.isArray(json)) return cdnUrls(json, type)
  return json
}
