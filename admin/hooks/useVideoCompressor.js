"use client";
import { useState, useRef, useCallback } from "react";

// CDN base for ffmpeg.wasm 0.12 core files (single-thread, no SharedArrayBuffer needed)
const FFMPEG_CDN = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

/**
 * useVideoCompressor
 *
 * A React hook that lazily loads FFmpeg WASM and exposes a `compressVideo` function.
 *
 * Usage:
 *   const { compressVideo, compressStatus, isCompressing, ffmpegLoaded } = useVideoCompressor();
 *   const compressedFile = await compressVideo(rawFile, (pct) => setProgress(pct));
 */
export function useVideoCompressor() {
    const ffmpegRef = useRef(null);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [compressStatus, setCompressStatus] = useState(""); // e.g. "Compressing 45%"
    const loadingRef = useRef(false);

    // Lazy-load FFmpeg WASM once
    const ensureLoaded = useCallback(async () => {
        if (ffmpegRef.current && ffmpegLoaded) return ffmpegRef.current;
        if (loadingRef.current) {
            // Wait until the first load finishes
            await new Promise((res) => {
                const check = setInterval(() => {
                    if (!loadingRef.current) { clearInterval(check); res(); }
                }, 100);
            });
            return ffmpegRef.current;
        }

        loadingRef.current = true;
        try {
            const { FFmpeg } = await import("@ffmpeg/ffmpeg");
            const { toBlobURL } = await import("@ffmpeg/util");

            const ff = new FFmpeg();

            await ff.load({
                coreURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.wasm`, "application/wasm"),
            });

            ffmpegRef.current = ff;
            setFfmpegLoaded(true);
            return ff;
        } catch (err) {
            console.error("[useVideoCompressor] Failed to load FFmpeg WASM:", err);
            throw err;
        } finally {
            loadingRef.current = false;
        }
    }, [ffmpegLoaded]);

    /**
     * compressVideo
     * @param {File} file - The raw video File object
     * @param {(pct: number) => void} [onProgress] - Optional progress callback (0–100)
     * @returns {Promise<File>} - The compressed video File (or the original if compression fails/too small)
     */
    const compressVideo = useCallback(async (file, onProgress) => {
        // Only compress actual video files
        if (!file || !file.type.startsWith("video/")) return file;

        // File size guards (warn > 100MB, skip > 500MB)
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > 500) {
            if (typeof window !== "undefined") {
                window.alert(`This video is too large (${sizeInMB.toFixed(1)} MB). Browser-side compression is skipped for files over 500MB to avoid browser crashes. The original video will be uploaded directly.`);
            }
            setCompressStatus("Skipped (>500MB)");
            setTimeout(() => setCompressStatus(""), 4000);
            return file;
        }

        if (sizeInMB > 100) {
            if (typeof window !== "undefined") {
                const proceed = window.confirm(`This video is large (${sizeInMB.toFixed(1)} MB). Browser-side compression may take a few minutes and use significant memory.\n\nDo you still want to compress it before uploading? (Cancel to upload original directly)`);
                if (!proceed) {
                    setCompressStatus("Skipped (uploading original)");
                    setTimeout(() => setCompressStatus(""), 4000);
                    return file;
                }
            }
        }

        setIsCompressing(true);
        setCompressStatus("Loading compressor…");

        let ff;
        try {
            ff = await ensureLoaded();
        } catch {
            // FFmpeg couldn't load — just return the original file silently
            setIsCompressing(false);
            setCompressStatus("");
            return file;
        }

        try {
            const { fetchFile } = await import("@ffmpeg/util");

            const inputName = `input_${Date.now()}.mp4`;
            const outputName = `output_${Date.now()}.mp4`;

            setCompressStatus("Compressing 0%");

            // Progress listener
            ff.on("progress", ({ progress }) => {
                const pct = Math.round(Math.min(progress * 100, 99));
                setCompressStatus(`Compressing ${pct}%`);
                if (onProgress) onProgress(pct);
            });

            // Write input file to virtual FS
            await ff.writeFile(inputName, await fetchFile(file));

            // Re-encode: H.264 CRF 28, AAC 128k, scale height to 720px (maintains vertical/horizontal aspect), max bitrate 1500k
            await ff.exec([
                "-i", inputName,
                "-vcodec", "libx264",
                "-crf", "28",
                "-preset", "ultrafast",
                "-vf", "scale=-2:720,fps=fps=30",
                "-b:v", "1500k",
                "-maxrate", "1500k",
                "-bufsize", "3000k",
                "-acodec", "aac",
                "-b:a", "128k",
                "-movflags", "+faststart",
                "-y",
                outputName,
            ]);

            // Read output
            const data = await ff.readFile(outputName);
            const blob = new Blob([data.buffer], { type: "video/mp4" });

            // Clean up virtual FS
            try { await ff.deleteFile(inputName); } catch {}
            try { await ff.deleteFile(outputName); } catch {}

            // If compressed file is actually larger, return the original
            if (blob.size >= file.size) {
                setCompressStatus("Compression skipped (already optimal)");
                setTimeout(() => setCompressStatus(""), 3000);
                setIsCompressing(false);
                return file;
            }

            const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".mp4"),
                { type: "video/mp4" }
            );

            const saved = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1);
            setCompressStatus(`Compressed! Saved ${saved}%`);
            setTimeout(() => setCompressStatus(""), 4000);

            if (onProgress) onProgress(100);
            return compressedFile;
        } catch (err) {
            const isCancel = err && (err.message === "called FFmpeg.terminate()" || err.message?.includes("terminate") || err.message?.includes("aborted"));
            if (isCancel) {
                console.log("[useVideoCompressor] Compression was cancelled by the user.");
                setCompressStatus("Cancelled");
                setTimeout(() => setCompressStatus(""), 3000);
                throw new Error("COMPRESSION_CANCELLED");
            }
            console.error("[useVideoCompressor] Compression error:", err);
            setCompressStatus("Compression failed — uploading original");
            setTimeout(() => setCompressStatus(""), 4000);
            return file; // fall back to original
        } finally {
            setIsCompressing(false);
        }
    }, [ensureLoaded]);

    /**
     * cancelCompression
     * Kills the FFmpeg WebWorker immediately and resets state.
     * Call this when the user removes a video while it is compressing.
     */
    const cancelCompression = useCallback(() => {
        if (ffmpegRef.current) {
            try {
                ffmpegRef.current.terminate();
            } catch {}
            // Null out so ensureLoaded() will reload on next use
            ffmpegRef.current = null;
            setFfmpegLoaded(false);
            loadingRef.current = false;
        }
        setIsCompressing(false);
        setCompressStatus('Cancelled');
        setTimeout(() => setCompressStatus(''), 2000);
    }, []);

    return { compressVideo, cancelCompression, compressStatus, isCompressing, ffmpegLoaded };
}
