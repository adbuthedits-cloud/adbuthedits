"use client";

import React, { useRef, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCamera,
    faCheckCircle,
    faExclamationCircle,
    faHourglassHalf,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function VideoThumbnailGenerator({ videoUrl, onCapture, isFile = false }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("idle"); // idle | loading | ready | capturing | success | error
    const [errorMsg, setErrorMsg] = useState("");

    if (!videoUrl) return null;

    // Build the effective video source:
    // - Local File blobs: use as-is (no CORS issue)
    // - R2 remote URLs: route through our backend proxy which adds CORS headers
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const effectiveVideoUrl = isFile
        ? videoUrl
        : `${API_URL}/api/media/proxy-video?url=${encodeURIComponent(videoUrl)}`;

    // Called when the video has loaded enough data to determine dimensions
    const handleVideoLoaded = () => {
        setStatus("ready");
    };

    // Called if the video itself fails to load (network error, bad URL, etc.)
    const handleVideoError = (e) => {
        console.error("Video load error:", e);
        setStatus("error");
        setErrorMsg("The video could not be loaded. Check the URL or file.");
    };

    const handleCapture = useCallback(() => {
        setErrorMsg("");

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Safety: ensure refs exist
        if (!video || !canvas) {
            setStatus("error");
            setErrorMsg("Internal error: video or canvas element is missing.");
            return;
        }

        // readyState 2 = HAVE_CURRENT_DATA, 3 = HAVE_FUTURE_DATA, 4 = HAVE_ENOUGH_DATA
        if (video.readyState < 2) {
            setStatus("error");
            setErrorMsg("Video is not ready yet. Please wait for it to load and press pause first.");
            return;
        }

        // Ensure video is paused so the frame is stable
        if (!video.paused && !video.ended) {
            setStatus("error");
            setErrorMsg("Please pause the video at the frame you want before capturing.");
            return;
        }

        setStatus("capturing");

        try {
            // Use actual video dimensions for maximum quality
            const width = video.videoWidth;
            const height = video.videoHeight;

            if (!width || !height) {
                setStatus("error");
                setErrorMsg("Cannot read video dimensions. Ensure the video has fully loaded.");
                return;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            // Draw the current paused frame
            ctx.drawImage(video, 0, 0, width, height);

            // Export as high-quality JPEG
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        setStatus("error");
                        setErrorMsg("Failed to capture frame. The canvas may be tainted due to CORS restrictions.");
                        return;
                    }

                    const file = new File([blob], `thumbnail-${Date.now()}.jpg`, {
                        type: "image/jpeg",
                    });

                    // Create a stable preview URL
                    const previewUrl = URL.createObjectURL(blob);

                    if (onCapture) {
                        onCapture(file, previewUrl);
                    }

                    setStatus("success");
                    // Auto-reset status label after 4s
                    setTimeout(() => setStatus("ready"), 4000);
                },
                "image/jpeg",
                0.92 // 92% quality — sharper without being too heavy
            );
        } catch (err) {
            console.error("Capture error:", err);
            setStatus("error");
            // Distinguish CORS tainted-canvas errors from other errors
            if (err.name === "SecurityError" || (err.message && err.message.toLowerCase().includes("tainted"))) {
                setErrorMsg("Security error: Your R2 bucket does not have CORS enabled for this domain. Please add your admin domain to the R2 CORS policy.");
            } else {
                setErrorMsg("An unexpected error occurred during capture. Please try again.");
            }
        }
    }, [onCapture]);

    const isButtonDisabled = status === "capturing" || status === "idle" || status === "loading";

    return (
        <div className="bg-[#130C1C] border border-[#2d1b4e] rounded-xl p-4 mt-4 space-y-3">
            <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCamera} className="text-purple-400 text-sm" />
                <h4 className="text-sm font-bold text-gray-200">Video Frame Capture</h4>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-1 text-purple-500/70" />
                Play the video, scrub to the perfect frame, then <strong className="text-gray-400">pause</strong> and click{" "}
                <strong className="text-gray-400">Capture Frame</strong>.
            </p>

            <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Video Player */}
                <div className="w-full md:w-1/2 max-w-xs rounded-lg overflow-hidden bg-black border border-[#2d1b4e] shadow-md">
                    <video
                        ref={videoRef}
                        src={effectiveVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        crossOrigin="anonymous"
                        onLoadedData={handleVideoLoaded}
                        onCanPlay={handleVideoLoaded}
                        onError={handleVideoError}
                        onWaiting={() => setStatus("loading")}
                        className="w-full h-auto max-h-[260px] object-contain"
                    />
                    {/* Hidden canvas for pixel extraction */}
                    <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 justify-center pt-1">
                    <button
                        type="button"
                        onClick={handleCapture}
                        disabled={isButtonDisabled}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 px-5 rounded-lg shadow transition-all active:scale-95 flex items-center gap-2"
                    >
                        {status === "capturing" ? (
                            <>
                                <FontAwesomeIcon icon={faHourglassHalf} className="animate-pulse" />
                                Capturing...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCamera} />
                                Capture Frame
                            </>
                        )}
                    </button>

                    {/* Status messages */}
                    {(status === "idle" || status === "loading") && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faHourglassHalf} className="text-gray-600" />
                            Waiting for video to load…
                        </p>
                    )}

                    {status === "success" && (
                        <div className="text-green-500 text-xs font-semibold flex items-center gap-1">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Thumbnail set! You can capture again to replace it.
                        </div>
                    )}

                    {status === "error" && errorMsg && (
                        <div className="text-red-400 text-[11px] font-medium flex flex-col gap-2 max-w-[240px] bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                            <span className="flex items-center gap-2 text-red-500">
                                <FontAwesomeIcon icon={faExclamationCircle} className="flex-shrink-0" />
                                <strong>Connection Blocked</strong>
                            </span>
                            <p className="opacity-80 leading-normal">
                                Your browser blocked access to this video frame. This usually means your **Cloudflare R2 CORS policy** needs to be updated.
                            </p>
                            <a 
                                href="https://developers.cloudflare.com/r2/buckets/cors/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                            >
                                How to fix this →
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
