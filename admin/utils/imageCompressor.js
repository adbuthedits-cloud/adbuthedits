/**
 * imageCompressor.js
 *
 * Client-side image compression and WebP conversion using HTML5 Canvas.
 * Caps maximum resolution at 1920px (width or height) and outputs high-quality WebP.
 * Bypasses non-images and GIFs (to preserve animations).
 */

export async function compressImage(file, { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = {}) {
    // Only compress images
    if (!file || !file.type.startsWith("image/")) return file;

    // Skip GIFs because canvas compression destroys animation frames
    if (file.type === "image/gif") return file;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Scale proportionally if dimensions exceed thresholds
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }

                        // Create a new File object with .webp extension
                        const webpName = file.name.replace(/\.[^.]+$/, ".webp");
                        const compressedFile = new File([blob], webpName, {
                            type: "image/webp",
                            lastModified: Date.now(),
                        });

                        // Only return compressed file if it actually saves space
                        if (compressedFile.size < file.size) {
                            console.log(`[ImageCompressor] Compressed "${file.name}" (${(file.size / 1024).toFixed(1)} KB) -> "${webpName}" (${(compressedFile.size / 1024).toFixed(1)} KB)`);
                            resolve(compressedFile);
                        } else {
                            console.log(`[ImageCompressor] Original file is already optimal: ${(file.size / 1024).toFixed(1)} KB`);
                            resolve(file);
                        }
                    },
                    "image/webp",
                    quality
                );
            };
            img.onerror = () => resolve(file);
            img.src = event.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}
