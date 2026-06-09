"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import AccessDenied from "../../../components/AccessDenied";
import withPermission from "../../../components/withPermission";
import { getAuthToken, getAuthUser, hasPermission } from "../../../utils/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCloudUploadAlt, faFolder, faFolderOpen, faFolderPlus,
    faFile, faImage, faVideo, faFileZipper, faFileCode,
    faTrash, faLink, faCopy, faCheck, faSpinner, faHome,
    faChevronRight, faRefresh, faTimes, faSearch, faEye,
    faDownload, faUpload, faExclamationTriangle, faShieldAlt,
    faGlobe, faLock, faMagnifyingGlass, faCompress
} from "@fortawesome/free-solid-svg-icons";
import { useVideoCompressor } from "../../../hooks/useVideoCompressor";
import { compressImage } from "../../../utils/imageCompressor";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (name = "", mimeType = "") => {
    const ext = name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(ext) || mimeType.startsWith("image/"))
        return { icon: faImage, color: "text-emerald-400" };
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext) || mimeType.startsWith("video/"))
        return { icon: faVideo, color: "text-blue-400" };
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
        return { icon: faFileZipper, color: "text-yellow-400" };
    if (["js", "ts", "json", "html", "css", "xml", "yaml", "yml"].includes(ext))
        return { icon: faFileCode, color: "text-purple-400" };
    return { icon: faFile, color: "text-gray-400" };
};

const isPreviewable = (name = "") => {
    const ext = name.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "webm"].includes(ext);
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ prefix, onNavigate }) {
    const parts = prefix ? prefix.replace(/\/$/, "").split("/") : [];
    return (
        <nav className="flex items-center gap-1 text-sm flex-wrap">
            <button
                onClick={() => onNavigate("")}
                className="flex items-center gap-1.5 text-[#a78bfa] hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
                <FontAwesomeIcon icon={faHome} className="text-xs" />
                <span>Root</span>
            </button>
            {parts.map((part, idx) => {
                const partPrefix = parts.slice(0, idx + 1).join("/") + "/";
                return (
                    <span key={idx} className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 text-[10px]" />
                        <button
                            onClick={() => onNavigate(partPrefix)}
                            className={`px-2 py-1 rounded transition-colors ${
                                idx === parts.length - 1
                                    ? "text-white font-semibold"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            {part}
                        </button>
                    </span>
                );
            })}
        </nav>
    );
}

// ─── File Preview Modal ───────────────────────────────────────────────────────
function PreviewModal({ file, onClose }) {
    if (!file) return null;
    const ext = file.name.split(".").pop().toLowerCase();
    const isImg = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    const isVid = ["mp4", "webm"].includes(ext);

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#2d1b4e]">
                    <div>
                        <p className="text-white font-semibold truncate max-w-md">{file.name}</p>
                        <p className="text-gray-500 text-xs">{formatBytes(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                        >
                            <FontAwesomeIcon icon={faGlobe} />
                            Open
                        </a>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-[#2d1b4e] hover:bg-red-500/20 border border-[#3b2a5f] hover:border-red-500/40 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>
                <div className="p-4 overflow-auto max-h-[70vh] flex items-center justify-center bg-[#120c1e]">
                    {isImg && (
                        <img
                            src={file.url}
                            alt={file.name}
                            className="max-w-full max-h-[60vh] object-contain rounded-lg"
                        />
                    )}
                    {isVid && (
                        <video
                            src={file.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-[60vh] rounded-lg"
                        />
                    )}
                    {!isImg && !isVid && (
                        <div className="text-center text-gray-500 py-12">
                            <FontAwesomeIcon icon={faFile} className="text-5xl mb-4 text-gray-600" />
                            <p>Preview not available for this file type</p>
                            <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#a78bfa] hover:bg-[#9061f9] text-[#1a1025] rounded-lg font-bold text-sm"
                            >
                                <FontAwesomeIcon icon={faDownload} />
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onUpload, uploading, prefix }) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onUpload(files);
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                ${dragging
                    ? "border-[#a78bfa] bg-[#a78bfa]/10 scale-[1.01]"
                    : "border-[#2d1b4e] hover:border-[#a78bfa]/50 bg-[#1a1025] hover:bg-[#a78bfa]/5"
                }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length) onUpload(files);
                    e.target.value = "";
                }}
            />
            {uploading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-xl" />
                    </div>
                    <p className="text-gray-400 text-sm">Uploading files…</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                        ${dragging ? "bg-[#a78bfa]/20 border-[#a78bfa]" : "bg-[#2d1b4e] border border-[#3b2a5f]"}`}
                    >
                        <FontAwesomeIcon
                            icon={faCloudUploadAlt}
                            className={`text-2xl ${dragging ? "text-[#a78bfa]" : "text-gray-500"}`}
                        />
                    </div>
                    <div>
                        <p className="text-gray-300 font-medium">
                            {dragging ? "Drop files here" : "Drag & drop files or click to upload"}
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                            Any file type · Max 500 MB · Images & videos auto-compress to WebP / MP4
                        </p>
                        {prefix && (
                            <p className="text-[#a78bfa] text-xs mt-2">
                                Uploading to: <span className="font-mono bg-[#a78bfa]/10 px-1.5 py-0.5 rounded">/{prefix}</span>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function MediaManagerPage() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isClient, setIsClient] = useState(false);

    // Browser state
    const [prefix, setPrefix] = useState("");
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // UI state
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadQueue, setUploadQueue] = useState([]); // [{name, status, label, url}]
    const [previewFile, setPreviewFile] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);

    // Create folder modal
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'file'|'folder', item }
    const [deleting, setDeleting] = useState(false);

    // Client-side video compression
    const { compressVideo, compressStatus, isCompressing } = useVideoCompressor();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Init auth on client side only
    useEffect(() => {
        setIsClient(true);
        const u = getAuthUser();
        const t = getAuthToken();
        setUser(u);
        setToken(t);
    }, []);

    // Always build headers dynamically so token is never stale
    const getHeaders = () => {
        const t = getAuthToken(); // read fresh from localStorage every time
        return t ? { Authorization: `Bearer ${t}` } : {};
    };

    // ─── Load folder contents ──────────────────────────────────────────────
    const loadFolder = useCallback(async (folderPrefix) => {
        const t = getAuthToken(); // read fresh every call — avoids stale closure
        if (!t) return;
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${apiUrl}/api/file-manager/list`, {
                params: { prefix: folderPrefix },
                headers: { Authorization: `Bearer ${t}` },
            });
            setFolders(res.data.folders || []);
            setFiles(res.data.files || []);
            setPrefix(folderPrefix);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load folder.");
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        loadFolder("");
    }, [loadFolder]);

    // ─── Create folder ────────────────────────────────────────────────────
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        setCreatingFolder(true);
        setError("");
        try {
            await axios.post(`${apiUrl}/api/file-manager/create-folder`, {
                prefix,
                name: newFolderName.trim(),
            }, { headers: getHeaders() });
            setSuccess(`Folder "${newFolderName}" created!`);
            setShowCreateFolder(false);
            setNewFolderName("");
            loadFolder(prefix);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create folder.");
        } finally {
            setCreatingFolder(false);
            setTimeout(() => setSuccess(""), 3000);
        }
    };

    // ─── Upload files: uploads ORIGINAL + COMPRESSED version both to cloud ─
    const handleUpload = async (fileList) => {
        setUploading(true);
        setError("");
        const queue = fileList.map(f => ({ name: f.name, status: "pending", label: "Pending", url: null }));
        setUploadQueue(queue);
        const authHeaders = getHeaders();
        const uploadUrl = `${apiUrl}/api/file-manager/upload?prefix=${encodeURIComponent(prefix)}`;

        for (let i = 0; i < fileList.length; i++) {
            const originalFile = fileList[i]; // always keep a reference to the original
            const isVideo = originalFile.type.startsWith("video/");
            const isImage = originalFile.type.startsWith("image/");

            // ── Step 1: Generate compressed version (without replacing original) ──
            let compressedFile = null;

            if (isVideo) {
                setUploadQueue(q => q.map((item, idx) =>
                    idx === i ? { ...item, status: "compressing", label: "Compressing video..." } : item
                ));
                try {
                    const result = await compressVideo(originalFile, (pct) => {
                        setUploadQueue(q => q.map((item, idx) =>
                            idx === i ? { ...item, label: `Compressing video ${pct}%` } : item
                        ));
                    });
                    if (result && result !== originalFile && result.size < originalFile.size) {
                        compressedFile = result;
                    }
                } catch {
                    // compression failed — original only
                }
            } else if (isImage) {
                setUploadQueue(q => q.map((item, idx) =>
                    idx === i ? { ...item, status: "compressing", label: "Compressing image..." } : item
                ));
                try {
                    const result = await compressImage(originalFile);
                    if (result && result !== originalFile && result.size < originalFile.size) {
                        compressedFile = result;
                    }
                } catch {
                    // compression failed — original only
                }
            }

            // ── Step 2: Always upload ORIGINAL file first ────────────────────
            setUploadQueue(q => q.map((item, idx) =>
                idx === i ? { ...item, status: "uploading", label: compressedFile ? "Uploading original..." : "Uploading..." } : item
            ));

            try {
                const formData = new FormData();
                formData.append("file", originalFile); // THE ORIGINAL — never the compressed
                formData.append("prefix", prefix);

                const res = await axios.post(uploadUrl, formData, {
                    headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
                });

                setUploadQueue(q => q.map((item, idx) =>
                    idx === i ? { ...item, status: "done", label: "Done", url: res.data.file.url } : item
                ));

                // ── Step 3: ALSO upload compressed version with _web suffix ──
                if (compressedFile) {
                    setUploadQueue(q => q.map((item, idx) =>
                        idx === i ? { ...item, label: "Uploading compressed (_web) copy..." } : item
                    ));
                    try {
                        // Rename: inject _web before the extension
                        // e.g. photo.jpg → photo_web.webp  |  clip.mp4 → clip_web.mp4
                        const ext = compressedFile.name.includes(".")
                            ? "." + compressedFile.name.split(".").pop()
                            : "";
                        const baseName = compressedFile.name.slice(0, compressedFile.name.length - ext.length);
                        const webName = `${baseName}_web${ext}`;
                        const renamedFile = new File([compressedFile], webName, { type: compressedFile.type });

                        const compressedFormData = new FormData();
                        compressedFormData.append("file", renamedFile);
                        compressedFormData.append("prefix", prefix);
                        await axios.post(uploadUrl, compressedFormData, {
                            headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
                        });
                        setUploadQueue(q => q.map((item, idx) =>
                            idx === i ? { ...item, label: `Done (+ ${webName} saved)` } : item
                        ));
                    } catch {
                        // Compressed upload failed — original is already safe
                        setUploadQueue(q => q.map((item, idx) =>
                            idx === i ? { ...item, label: "Done (compressed copy failed)" } : item
                        ));
                    }
                }

            } catch (err) {
                setUploadQueue(q => q.map((item, idx) =>
                    idx === i ? { ...item, status: "error", label: err.response?.data?.error || "Upload failed" } : item
                ));
            }
        }

        setUploading(false);
        setSuccess("Upload complete!");
        setTimeout(() => {
            setSuccess("");
            setUploadQueue([]);
        }, 5000);
        loadFolder(prefix);
    };

    // ─── Delete file ──────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        setError("");
        try {
            if (deleteTarget.type === "file") {
                await axios.delete(`${apiUrl}/api/file-manager/delete-file`, {
                    data: { key: deleteTarget.item.key },
                    headers: getHeaders(),
                });
            } else {
                await axios.delete(`${apiUrl}/api/file-manager/delete-folder`, {
                    data: { prefix: deleteTarget.item.prefix },
                    headers: getHeaders(),
                });
            }
            setSuccess("Deleted successfully!");
            setDeleteTarget(null);
            loadFolder(prefix);
        } catch (err) {
            setError(err.response?.data?.error || "Delete failed.");
        } finally {
            setDeleting(false);
            setTimeout(() => setSuccess(""), 3000);
        }
    };

    // ─── Copy URL ─────────────────────────────────────────────────────────
    const copyUrl = (url, key) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        });
    };

    if (!isClient) {
        return (
            <div className="flex items-center justify-center py-20">
                <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-2xl" />
            </div>
        );
    }

    if (!hasPermission(user, "media_manager", "view")) {
        return (
            <div className="p-8">
                <AccessDenied module="Media Manager" action="view" />
            </div>
        );
    }

    const canEdit = hasPermission(user, "media_manager", "edit");
    const canDelete = hasPermission(user, "media_manager", "delete");

    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="w-full">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
                            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-[#a78bfa]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Media Manager</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-13">
                        Manage cloud storage files · Images auto-compress to WebP, Videos to MP4
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadFolder(prefix)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm transition-all disabled:opacity-50"
                    >
                        <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    {canEdit && (
                        <button
                            onClick={() => { setShowCreateFolder(true); setNewFolderName(""); }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm transition-all"
                        >
                            <FontAwesomeIcon icon={faFolderPlus} />
                            New Folder
                        </button>
                    )}
                </div>
            </div>

            {/* ── Alerts ─────────────────────────────────────────────────── */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {error}
                    <button onClick={() => setError("")} className="ml-auto text-red-400/60 hover:text-red-400">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faCheck} />
                    {success}
                </div>
            )}

            {/* ── Upload Queue ────────────────────────────────────────────── */}
            {uploadQueue.length > 0 && (
                <div className="mb-4 bg-[#1a1025] border border-[#2d1b4e] rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-400 mb-3">Upload Progress</p>
                    <div className="space-y-2">
                        {uploadQueue.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    item.status === "done" ? "bg-green-500/20" :
                                    item.status === "error" ? "bg-red-500/20" :
                                    item.status === "compressing" ? "bg-orange-500/20" :
                                    item.status === "uploading" ? "bg-[#a78bfa]/20" :
                                    "bg-gray-700"
                                }`}>
                                    {item.status === "done" && <FontAwesomeIcon icon={faCheck} className="text-green-400 text-[10px]" />}
                                    {item.status === "error" && <FontAwesomeIcon icon={faTimes} className="text-red-400 text-[10px]" />}
                                    {item.status === "compressing" && <FontAwesomeIcon icon={faCompress} className="text-orange-400 text-[10px]" />}
                                    {item.status === "uploading" && <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-[10px]" />}
                                    {item.status === "pending" && <div className="w-2 h-2 rounded-full bg-gray-600" />}
                                </div>
                                <span className="text-gray-400 truncate flex-1">{item.name}</span>
                                <span className={`text-xs font-medium ${
                                    item.status === "done" ? "text-green-400" :
                                    item.status === "error" ? "text-red-400" :
                                    item.status === "compressing" ? "text-orange-400" :
                                    item.status === "uploading" ? "text-[#a78bfa]" :
                                    "text-gray-600"
                                }`}>
                                    {item.label || "Pending"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Breadcrumb + Search ─────────────────────────────────────── */}
            <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
                <Breadcrumb prefix={prefix} onNavigate={loadFolder} />
                <div className="relative">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search files…"
                        className="bg-[#2d1b4e] border border-[#3b2a5f] rounded-lg pl-8 pr-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#a78bfa] w-48"
                    />
                </div>
            </div>

            {/* ── Upload Zone ─────────────────────────────────────────────── */}
            {canEdit && (
                <div className="mb-4">
                    <UploadZone onUpload={handleUpload} uploading={uploading} prefix={prefix} />
                </div>
            )}

            {/* ── Info strip ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-[#a78bfa]" />
                    All files stored securely on Cloudflare R2
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faGlobe} className="text-emerald-500" />
                    Public bucket · URLs accessible globally
                </span>
                <span>·</span>
                <span>{filteredFolders.length} folder{filteredFolders.length !== 1 ? "s" : ""} · {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}</span>
            </div>

            {/* ── File Browser ─────────────────────────────────────────────── */}
            {loading ? (
                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl p-20 flex items-center justify-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-3xl" />
                </div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#2d1b4e] border border-[#3b2a5f] flex items-center justify-center mb-4">
                        <FontAwesomeIcon icon={faFolder} className="text-gray-600 text-2xl" />
                    </div>
                    <p className="text-gray-400 font-medium">This folder is empty</p>
                    <p className="text-gray-600 text-sm mt-1">
                        {canEdit ? "Upload files or create a sub-folder to get started." : "No files found here."}
                    </p>
                </div>
            ) : (
                <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-xl overflow-hidden">
                    {/* Folders */}
                    {filteredFolders.length > 0 && (
                        <div className="border-b border-[#2d1b4e]">
                            <div className="px-4 py-2 bg-[#120c1e]">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folders</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
                                {filteredFolders.map((folder) => (
                                    <div
                                        key={folder.prefix}
                                        className="group relative border-r border-b border-[#2d1b4e] last:border-r-0"
                                    >
                                        <button
                                            onClick={() => loadFolder(folder.prefix)}
                                            className="w-full p-4 text-left hover:bg-[#2d1b4e]/50 transition-colors"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-center">
                                                <div className="relative">
                                                    <FontAwesomeIcon
                                                        icon={faFolder}
                                                        className="text-4xl text-yellow-500/70 group-hover:text-yellow-400 transition-colors"
                                                    />
                                                </div>
                                                <span className="text-gray-300 text-xs font-medium truncate w-full group-hover:text-white transition-colors">
                                                    {folder.name}
                                                </span>
                                            </div>
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "folder", item: folder }); }}
                                                className="absolute top-2 right-2 w-6 h-6 rounded bg-red-500/0 hover:bg-red-500/20 border border-transparent hover:border-red-500/40 text-transparent hover:text-red-400 flex items-center justify-center transition-all text-[10px] group-hover:opacity-100"
                                                title="Delete folder"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    {filteredFiles.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-[#120c1e]">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Files</p>
                            </div>
                            <div className="divide-y divide-[#2d1b4e]">
                                {filteredFiles.map((file) => {
                                    const { icon, color } = getFileIcon(file.name);
                                    const canPreview = isPreviewable(file.name);
                                    const isCopied = copiedKey === file.key;

                                    return (
                                        <div
                                            key={file.key}
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-[#2d1b4e]/30 transition-colors group"
                                        >
                                            {/* Icon */}
                                            <div className="w-9 h-9 rounded-lg bg-[#2d1b4e] border border-[#3b2a5f] flex items-center justify-center flex-shrink-0">
                                                <FontAwesomeIcon icon={icon} className={`text-sm ${color}`} />
                                            </div>

                                            {/* Name + meta */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-200 text-sm font-medium truncate">{file.name}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-gray-600 text-xs">{formatBytes(file.size)}</span>
                                                    {file.lastModified && (
                                                        <span className="text-gray-700 text-xs">
                                                            {new Date(file.lastModified).toLocaleDateString("en-IN", {
                                                                day: "numeric", month: "short", year: "numeric"
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canPreview && (
                                                    <button
                                                        onClick={() => setPreviewFile(file)}
                                                        title="Preview"
                                                        className="w-7 h-7 rounded-lg bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-400 hover:text-white flex items-center justify-center text-xs transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => copyUrl(file.url, file.key)}
                                                    title="Copy URL"
                                                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition-all ${
                                                        isCopied
                                                            ? "bg-green-500/20 border-green-500/40 text-green-400"
                                                            : "bg-[#2d1b4e] hover:bg-[#3b2a5f] border-[#3b2a5f] text-gray-400 hover:text-white"
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} />
                                                </button>
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Open in new tab"
                                                    className="w-7 h-7 rounded-lg bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-400 hover:text-white flex items-center justify-center text-xs transition-all"
                                                >
                                                    <FontAwesomeIcon icon={faGlobe} />
                                                </a>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => setDeleteTarget({ type: "file", item: file })}
                                                        title="Delete"
                                                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400/60 hover:text-red-400 flex items-center justify-center text-xs transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* URL chip */}
                                            <div className="hidden lg:flex items-center">
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#a78bfa]/60 hover:text-[#a78bfa] text-xs font-mono truncate max-w-[200px] transition-colors"
                                                >
                                                    {file.url.replace(/^https?:\/\//, "")}
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Create Folder Modal ──────────────────────────────────────── */}
            {showCreateFolder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1025] border border-[#2d1b4e] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faFolderPlus} className="text-yellow-400" />
                                </div>
                                <h2 className="text-white font-bold text-lg">New Folder</h2>
                            </div>
                            <button
                                onClick={() => setShowCreateFolder(false)}
                                className="w-8 h-8 rounded-lg bg-[#2d1b4e] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="mb-2">
                            <label className="text-xs text-gray-500 mb-1.5 block">Location</label>
                            <p className="text-sm text-gray-400 font-mono bg-[#2d1b4e] px-3 py-2 rounded-lg border border-[#3b2a5f]">
                                /{prefix || "root"}
                            </p>
                        </div>

                        <div className="mb-5">
                            <label className="text-xs text-gray-500 mb-1.5 block">Folder Name *</label>
                            <input
                                autoFocus
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !creatingFolder && handleCreateFolder()}
                                placeholder="e.g. banners, thumbnails, logos"
                                className="w-full bg-[#2d1b4e] border border-[#3b2a5f] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#a78bfa] text-sm"
                            />
                            <p className="text-gray-600 text-xs mt-1.5">Only letters, numbers, dashes and underscores</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateFolder(false)}
                                className="flex-1 px-4 py-2.5 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim() || creatingFolder}
                                className="flex-1 px-4 py-2.5 bg-[#a78bfa] hover:bg-[#9061f9] disabled:opacity-50 text-[#1a1025] rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                {creatingFolder ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faFolderPlus} />}
                                Create Folder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1025] border border-red-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <FontAwesomeIcon icon={faTrash} className="text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold">
                                    Delete {deleteTarget.type === "folder" ? "Folder" : "File"}
                                </h2>
                                <p className="text-gray-500 text-xs">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
                            <p className="text-red-400 text-sm font-medium truncate">
                                {deleteTarget.type === "folder"
                                    ? `/${deleteTarget.item.prefix}`
                                    : deleteTarget.item.name
                                }
                            </p>
                            {deleteTarget.type === "folder" && (
                                <p className="text-gray-500 text-xs mt-1">
                                    ⚠️ All files inside this folder will also be permanently deleted.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-[#2d1b4e] hover:bg-[#3b2a5f] border border-[#3b2a5f] text-gray-300 rounded-lg text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                {deleting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrash} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── File Preview Modal ─────────────────────────────────────────── */}
            {previewFile && (
                <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
            )}
        </div>
    );
}

export default withPermission(MediaManagerPage, 'media_manager');

