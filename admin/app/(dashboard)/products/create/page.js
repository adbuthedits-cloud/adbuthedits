"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faArrowLeft, faPlus, faTimes, faTrash, faVideo, faPlay, faPencilAlt, faEdit, faCloudUploadAlt, faSpinner, faFileUpload, faCheckCircle, faExpand, faSync, faCompress } from "@fortawesome/free-solid-svg-icons";
import { getAuthToken, getAuthUser, hasPermission } from "../../../../utils/auth";
import Image from "next/image";
import Link from "next/link";
import VideoThumbnailGenerator from "../../../../components/VideoThumbnailGenerator";
import { useVideoCompressor } from "../../../../hooks/useVideoCompressor";
import { compressImage } from "../../../../utils/imageCompressor";
import { useUnsavedChangesWarning } from "../../../../hooks/useUnsavedChangesWarning";
import toast from "react-hot-toast";

import withPermission from "../../../../components/withPermission";

function CreateProduct() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDraftSubmit, setIsDraftSubmit] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useUnsavedChangesWarning(isDirty);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        price: "",
        compared_price: "",
        parent_category_id: "",
        asset_type_id: "",
        asset_variant_id: "",
        asset_category_id: "",
        asset_sub_category_id: "",
        asset_orientation_id: "",
        serial_number: "",
        internal_sku: "",
        resource_file: "",
        thumbnail: "",
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        canonical_url: "",
        language: "English"
    });

    const [images, setImages] = useState([]); 
    const [tags, setTags] = useState([]);
    const [colors, setColors] = useState([]);
    const [toPerson, setToPerson] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [videos, setVideos] = useState([]); 
    const [summary, setSummary] = useState([]); 
    const [customizations, setCustomizations] = useState([]); 
    const [thumbnailPreview, setThumbnailPreview] = useState("");
    const [thumbnailLightboxOpen, setThumbnailLightboxOpen] = useState(false);
    const [showVideoCapture, setShowVideoCapture] = useState(false);
    const [editingCustIndex, setEditingCustIndex] = useState(null); 

    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadingResource, setUploadingResource] = useState(false);

    // Per-file upload progress during submit: { [label]: { pct: 0-100, done: bool, error: bool } }
    const [uploadProgress, setUploadProgress] = useState({});

    const [tempImage, setTempImage] = useState("");
    const [tempTagKey, setTempTagKey] = useState("");
    const [tempTagValue, setTempTagValue] = useState("");
    const [tempColor, setTempColor] = useState("");
    const [tempPerson, setTempPerson] = useState("");
    const [tempSubCat, setTempSubCat] = useState("");
    const [tempVideo, setTempVideo] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [tempSummaryKey, setTempSummaryKey] = useState("");
    const [tempSummaryPoint, setTempSummaryPoint] = useState("");
    const [tempSummaryPoints, setTempSummaryPoints] = useState([]);
    const [editingSummaryIndex, setEditingSummaryIndex] = useState(null);
    const [tempCustKey, setTempCustKey] = useState("");
    const [tempCustFieldName, setTempCustFieldName] = useState("");
    const [tempCustFieldType, setTempCustFieldType] = useState("text");
    const [tempCustFieldList, setTempCustFieldList] = useState([]);
    const [editingCustFieldIndex, setEditingCustFieldIndex] = useState(null);

    const [masterData, setMasterData] = useState({ types: [], variants: [], orientations: [], categories: [], subCategories: [], parentCategories: [], customizationTemplates: [] });
    const [templateName, setTemplateName] = useState("");
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [internalSku, setInternalSku] = useState("");

    // Client-side video compression
    const { compressVideo, cancelCompression, isCompressing } = useVideoCompressor();
    // Per-video compression status: { [index]: { status: 'compressing'|'done'|'skipped', pct: number } }
    const [videoCompressStatus, setVideoCompressStatus] = useState({});

    // Stable preview URL for the first video to prevent reloading/juddering on every render
    const [videoObjectUrl, setVideoObjectUrl] = useState("");
    useEffect(() => {
        const firstVideo = videos[0];
        if (firstVideo instanceof File) {
            const url = URL.createObjectURL(firstVideo);
            setVideoObjectUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setVideoObjectUrl(firstVideo || "");
        }
    }, [videos]);

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = getAuthToken();
        // Use the admin endpoint — it has NO Redis cache so new sub-categories appear instantly.
        // The public /api/products/master-data is cached for 24h and would show stale data.
        fetch(`${apiUrl}/api/admin/master-data`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(r => r.ok ? r.json() : Promise.reject("Failed to load master data"))
            .then(data => {
                if (data && !data.error) setMasterData(data);
            })
            .catch(err => console.error(err));
    }, []);

    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

    useEffect(() => {
        const find = (arr, id, idKey) => arr.find(x => x[idKey] === id);
        const t = find(masterData.types, formData.asset_type_id, "type_id")?.code || "";
        const v = find(masterData.variants, formData.asset_variant_id, "variant_id")?.code || "";
        const c = find(masterData.categories, formData.asset_category_id, "asset_category_id")?.code || "";
        const s = find(masterData.subCategories, formData.asset_sub_category_id, "asset_sub_category_id")?.code || "";
        const o = find(masterData.orientations, formData.asset_orientation_id, "orientation_id")?.code || "";
        const sn = formData.serial_number || "####";
        const parts = ["JAP", t, v, c, s, o, sn].filter(Boolean);
        setInternalSku(parts.length > 1 ? parts.join("-") : "");
    }, [formData, masterData]);

    useEffect(() => {
        if (!isSlugManuallyEdited && formData.title) {
            const slug = formData.title
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_-]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title, isSlugManuallyEdited]);

    useEffect(() => {
        const { parent_category_id, asset_type_id, asset_variant_id, asset_category_id, asset_sub_category_id, asset_orientation_id } = formData;
        
        if (parent_category_id && asset_type_id) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const params = new URLSearchParams({
                parent_category_id,
                asset_type_id,
                asset_variant_id,
                asset_category_id,
                asset_sub_category_id,
                asset_orientation_id
            });

            fetch(`${apiUrl}/api/products/next-serial?${params.toString()}`)
                .then(r => r.json())
                .then(data => {
                    if (data.nextSerial) {
                        setFormData(prev => ({ ...prev, serial_number: data.nextSerial }));
                    }
                })
                .catch(err => console.error("Serial fetch failed", err));
        }
    }, [
        formData.parent_category_id,
        formData.asset_type_id,
        formData.asset_variant_id,
        formData.asset_category_id,
        formData.asset_sub_category_id,
        formData.asset_orientation_id
    ]);

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === "title") {
            value = value.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
        if (e.target.name === "slug") setIsSlugManuallyEdited(true);
        setFormData({ ...formData, [e.target.name]: value });
        setIsDirty(true);
    };

    const handleKeyDown = (e) => {
        // Prevent form submission when Enter is pressed in input fields
        if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "submit") {
            e.preventDefault();
        }
    };

    const addItem = (item, setItem, list, setList) => {
        if (!item.trim()) return;
        setList([...list, item.trim()]);
        setItem("");
        setIsDirty(true);
    };

    const removeItem = (index, list, setList) => {
        setList(list.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const addTagItem = () => {
        if (!tempTagKey.trim() || !tempTagValue.trim()) return;
        setTags([...tags, { key: tempTagKey.trim(), value: tempTagValue.trim() }]);
        setTempTagKey("");
        setTempTagValue("");
        setIsDirty(true);
    };

    const removeTagItem = (index) => {
        setTags(tags.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const addSummaryPoint = () => {
        if (!tempSummaryPoint.trim()) return;
        setTempSummaryPoints([...tempSummaryPoints, tempSummaryPoint.trim()]);
        setTempSummaryPoint("");
    };

    const removeSummaryPoint = (pIdx) => {
        setTempSummaryPoints(tempSummaryPoints.filter((_, i) => i !== pIdx));
    };

    const addSummaryGroup = () => {
        if (!tempSummaryKey.trim() || tempSummaryPoints.length === 0) return;
        const newGroup = { key: tempSummaryKey.trim(), values: tempSummaryPoints };

        if (editingSummaryIndex !== null) {
            const updatedSummary = [...summary];
            updatedSummary[editingSummaryIndex] = newGroup;
            setSummary(updatedSummary);
            setEditingSummaryIndex(null);
        } else {
            setSummary([...summary, newGroup]);
        }

        setTempSummaryKey("");
        setTempSummaryPoints([]);
        setIsDirty(true);
    };

    const startEditSummary = (index) => {
        const item = summary[index];
        setTempSummaryKey(item.key);
        setTempSummaryPoints(item.values);
        setEditingSummaryIndex(index);
        document.getElementById("summary-form-top")?.scrollIntoView({ behavior: "smooth" });
    };

    const cancelEditSummary = () => {
        setEditingSummaryIndex(null);
        setTempSummaryKey("");
        setTempSummaryPoints([]);
    };

    const removeSummaryGroup = (index) => {
        if (editingSummaryIndex === index) {
            cancelEditSummary();
        }
        setSummary(summary.filter((_, i) => i !== index));
        setIsDirty(true);
    };

    const addCustField = () => {
        if (!tempCustFieldName.trim()) return;
        
        if (editingCustFieldIndex !== null) {
            const updated = [...tempCustFieldList];
            updated[editingCustFieldIndex] = [tempCustFieldName.trim(), tempCustFieldType];
            setTempCustFieldList(updated);
            setEditingCustFieldIndex(null);
        } else {
            setTempCustFieldList([...tempCustFieldList, [tempCustFieldName.trim(), tempCustFieldType]]);
        }
        
        setTempCustFieldName("");
        setTempCustFieldType("text");
    };

    const startEditCustField = (fIdx) => {
        const item = tempCustFieldList[fIdx];
        const [name, type] = Array.isArray(item) ? item : [item, "text"];
        setTempCustFieldName(name);
        setTempCustFieldType(type);
        setEditingCustFieldIndex(fIdx);
    };

    const removeCustField = (fIdx) => {
        if (editingCustFieldIndex === fIdx) {
            setEditingCustFieldIndex(null);
            setTempCustFieldName("");
            setTempCustFieldType("text");
        }
        setTempCustFieldList(tempCustFieldList.filter((_, i) => i !== fIdx));
        setIsDirty(true);
    };

    const addCustomizationGroup = () => {
        if (!tempCustKey.trim() || tempCustFieldList.length === 0) return;
        const newGroup = { [tempCustKey.trim()]: tempCustFieldList };

        if (editingCustIndex !== null) {
            const updated = [...customizations];
            updated[editingCustIndex] = newGroup;
            setCustomizations(updated);
            setEditingCustIndex(null);
        } else {
            setCustomizations([...customizations, newGroup]);
        }

        setTempCustKey("");
        setTempCustFieldList([]);
        setEditingCustFieldIndex(null);
        setIsDirty(true);
    };

    const startEditCustomization = (index) => {
        const group = customizations[index];
        const key = Object.keys(group)[0];
        const fields = group[key];
        setTempCustKey(key);
        setTempCustFieldList(fields);
        setEditingCustIndex(index);
        document.getElementById("cust-form-top")?.scrollIntoView({ behavior: "smooth" });
    };

    const cancelEditCustomization = () => {
        setEditingCustIndex(null);
        setTempCustKey("");
        setTempCustFieldList([]);
        setEditingCustFieldIndex(null);
    };

    const removeCustomization = (index) => {
        if (editingCustIndex === index) {
            cancelEditCustomization();
        }
        setCustomizations(customizations.filter((_, i) => i !== index));
    };

    // Upload a single file to R2 via the backend.
    // Returns { url, timedOut, error } — never throws.
    const handleFileUpload = async (file, subfolder = "image", explicitKey = null, onProgress = null) => {
        if (!file) return { url: null, timedOut: false, error: 'No file provided' };
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const formDataPayload = new FormData();
            
            const parent = masterData.parentCategories?.find(c => c.category_id === formData.parent_category_id)?.category_name || "Generic";
            const typeCode = masterData.types?.find(t => t.type_id === formData.asset_type_id)?.code || "Type";
            const variantCode = masterData.variants?.find(v => v.variant_id === formData.asset_variant_id)?.code || "Variant";
            const categoryCode = masterData.categories?.find(c => c.asset_category_id === formData.asset_category_id)?.code || "Category";
            const subCategoryCode = masterData.subCategories?.find(s => s.asset_sub_category_id === formData.asset_sub_category_id)?.code || "Subcategory";
            const orientationCode = masterData.orientations?.find(o => o.orientation_id === formData.asset_orientation_id)?.code || "Orientation";
            
            formDataPayload.append("parentCategory", parent.replace(/\s+/g, ""));
            formDataPayload.append("typeCode", typeCode.replace(/\s+/g, ""));
            formDataPayload.append("variantCode", variantCode.replace(/\s+/g, ""));
            formDataPayload.append("categoryCode", categoryCode.replace(/\s+/g, ""));
            formDataPayload.append("subCategoryCode", subCategoryCode.replace(/\s+/g, ""));
            formDataPayload.append("orientationCode", orientationCode.replace(/\s+/g, ""));
            formDataPayload.append("sku", (internalSku || "no-sku").replace(/\s+/g, ""));
            formDataPayload.append("subfolder", subfolder); 
            if (explicitKey) formDataPayload.append("explicitKey", explicitKey);
            formDataPayload.append("file", file);

            const token = getAuthToken();
            const headers = { "Content-Type": "multipart/form-data" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            // Generous timeouts: 15 min for video, 5 min for everything else
            const isVideo = subfolder === "video" || file.type?.startsWith("video/");
            const TIMEOUT_MS = isVideo ? 15 * 60 * 1000 : 5 * 60 * 1000;

            const res = await axios.post(`${apiUrl}/api/admin/upload-media`, formDataPayload, {
                headers,
                timeout: TIMEOUT_MS,
                onUploadProgress: (evt) => {
                    if (onProgress && evt.total) {
                        const pct = Math.round((evt.loaded / evt.total) * 100);
                        onProgress(pct);
                    }
                }
            });
            return { url: res.data.url, timedOut: false, error: null };
        } catch (err) {
            const isTimeout = err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout');
            console.error(`Upload ${isTimeout ? 'timed out' : 'failed'}:`, err.response?.data || err.message || err);
            return { url: null, timedOut: isTimeout, error: err.message };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isCompressing) {
            alert("Please wait for video compression to finish before submitting.");
            return;
        }

        setLoading(true);

        // Pre-populate upload progress for all files to be uploaded so overall progress is calculated correctly
        const initialProgress = {};
        if (formData.thumbnail instanceof File) {
            initialProgress["Thumbnail"] = { pct: 0, done: false, error: false };
        }
        for (let i = 0; i < images.length; i++) {
            if (images[i] instanceof File) {
                initialProgress[`Image ${i + 1}`] = { pct: 0, done: false, error: false };
            }
        }
        for (let i = 0; i < videos.length; i++) {
            if (videos[i] instanceof File) {
                initialProgress[`Video ${i + 1} (Original)`] = { pct: 0, done: false, error: false };
                if (videos[i].compressedVersion && videos[i].compressedVersion !== videos[i]) {
                    initialProgress[`Video ${i + 1} (Compressed)`] = { pct: 0, done: false, error: false };
                }
            }
        }
        if (formData.resource_file instanceof File) {
            initialProgress["Resource File"] = { pct: 0, done: false, error: false };
        }
        setUploadProgress(initialProgress);

        // Helper: update one entry in the upload progress panel
        const setFileProgress = (label, pct, done = false, timedOut = false, failed = false) => {
            setUploadProgress(prev => ({ ...prev, [label]: { pct, done, timedOut, error: failed } }));
        };

        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            // ── Thumbnail ──────────────────────────────────────────────
            let thumbnailUrl = formData.thumbnail;
            if (formData.thumbnail instanceof File) {
                setUploadingThumbnail(true);
                setFileProgress("Thumbnail", 0);
                const result = await handleFileUpload(
                    formData.thumbnail, "thumbnail", null,
                    (pct) => setFileProgress("Thumbnail", pct)
                );
                thumbnailUrl = result.url;
                setUploadingThumbnail(false);
                if (result.url) {
                    setFileProgress("Thumbnail", 100, true);
                } else {
                    setFileProgress("Thumbnail", 0, false, result.timedOut, !result.timedOut);
                    console.warn("Thumbnail upload failed — continuing without it.");
                }
            }

            // ── Gallery Images ─────────────────────────────────────────
            const finalImages = [];
            if (images.some(img => img instanceof File)) setUploadingGallery(true);
            for (let i = 0; i < images.length; i++) {
                const item = images[i];
                if (item instanceof File) {
                    const label = `Image ${i + 1}`;
                    setFileProgress(label, 0);
                    const result = await handleFileUpload(
                        item, "image", null,
                        (pct) => setFileProgress(label, pct)
                    );
                    if (result.url) {
                        finalImages.push(result.url);
                        setFileProgress(label, 100, true);
                    } else {
                        setFileProgress(label, 0, false, result.timedOut, !result.timedOut);
                        console.warn(`Gallery image ${i + 1} upload ${result.timedOut ? 'timed out' : 'failed'} — skipping.`);
                    }
                } else {
                    finalImages.push(item);
                }
            }
            setUploadingGallery(false);

            // ── Videos: upload BOTH original AND compressed to R2 ──────
            const finalVideos = [];
            const hasLocalVideos = videos.some(vid => vid instanceof File);
            if (hasLocalVideos) setUploadingVideo(true);

            for (let i = 0; i < videos.length; i++) {
                const item = videos[i];
                if (!(item instanceof File)) {
                    finalVideos.push(item);
                    continue;
                }

                const vidNum = i + 1;
                const origLabel = `Video ${vidNum} (Original)`;
                const compLabel = `Video ${vidNum} (Compressed)`;
                const hasCompressed = item.compressedVersion && item.compressedVersion !== item;

                // --- Upload original ---
                setFileProgress(origLabel, 0);
                const origResult = await handleFileUpload(
                    item, "video", null,
                    (pct) => setFileProgress(origLabel, pct)
                );
                if (origResult.url) {
                    setFileProgress(origLabel, 100, true);
                    finalVideos.push(origResult.url);
                } else {
                    setFileProgress(origLabel, 0, false, origResult.timedOut, !origResult.timedOut);
                    console.warn(`Video ${vidNum} original upload ${origResult.timedOut ? 'timed out' : 'failed'}.`);
                }

                // --- Upload compressed as a _web version to R2 ---
                if (hasCompressed) {
                    // Build the _web key based on original key so they live side-by-side
                    let webKey = null;
                    if (origResult.url) {
                        try {
                            const urlObj = new URL(origResult.url);
                            let originalKey = decodeURIComponent(urlObj.pathname);
                            if (originalKey.startsWith('/')) originalKey = originalKey.substring(1);
                            webKey = originalKey.replace(/\.[^/.]+$/, '_web.mp4');
                        } catch {}
                    }

                    setFileProgress(compLabel, 0);
                    const compResult = await handleFileUpload(
                        item.compressedVersion, "video", webKey,
                        (pct) => setFileProgress(compLabel, pct)
                    );
                    if (compResult.url) {
                        setFileProgress(compLabel, 100, true);
                        finalVideos.push(compResult.url);
                    } else {
                        setFileProgress(compLabel, 0, false, compResult.timedOut, !compResult.timedOut);
                        console.warn(`Video ${vidNum} compressed upload ${compResult.timedOut ? 'timed out' : 'failed'} — original still saved.`);
                    }
                }
            }
            setUploadingVideo(false);

            // ── Resource File ──────────────────────────────────────────
            let resourceFileUrl = formData.resource_file;
            if (formData.resource_file instanceof File) {
                setUploadingResource(true);
                const resLabel = "Resource File";
                setFileProgress(resLabel, 0);
                const result = await handleFileUpload(
                    formData.resource_file, "file", null,
                    (pct) => setFileProgress(resLabel, pct)
                );
                resourceFileUrl = result.url;
                setUploadingResource(false);
                if (result.url) {
                    setFileProgress(resLabel, 100, true);
                } else {
                    setFileProgress(resLabel, 0, false, result.timedOut, !result.timedOut);
                    console.warn(`Resource file upload ${result.timedOut ? 'timed out' : 'failed'} — continuing without it.`);
                }
            }

            const summaryObject = summary.reduce((acc, curr) => {
                acc[curr.key] = curr.values;
                return acc;
            }, {});

            const tagsObject = tags.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            const dataToSubmit = {
                ...formData,
                parent_category_id: formData.parent_category_id || null,
                asset_type_id: formData.asset_type_id || null,
                asset_variant_id: formData.asset_variant_id || null,
                asset_category_id: formData.asset_category_id || null,
                asset_sub_category_id: formData.asset_sub_category_id || null,
                asset_orientation_id: formData.asset_orientation_id || null,
                internal_sku: internalSku || null,
                serial_number: formData.serial_number || null,
                price: parseFloat(formData.price) || 0,
                compared_price: formData.compared_price ? parseFloat(formData.compared_price) : null,
                thumbnail: thumbnailUrl,
                images: finalImages,
                is_draft: isDraftSubmit,
                tags: tagsObject,
                colors: colors,
                to_person: toPerson,
                sub_category_json: subCategories,
                video: finalVideos,
                summary: summaryObject,
                customization: customizations,
                resource_file: resourceFileUrl,
                language: formData.language || 'English'
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            await axios.post(`${apiUrl}/api/admin/products`, dataToSubmit, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsDirty(false);
            if (isDraftSubmit) {
                toast.success("Draft saved successfully!");
                setLoading(false);
            } else {
                toast.success("Product created successfully!");
                router.push("/products");
            }
        } catch (error) {
            setUploadingThumbnail(false);
            setUploadingGallery(false);
            setUploadingVideo(false);
            setUploadingResource(false);
            console.error(error);
            toast.error("Failed to create product: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Only accept image files
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPG, PNG, WebP, etc.)");
            e.target.value = "";
            return;
        }
        // Release any previous captured preview URL to free memory
        if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
            URL.revokeObjectURL(thumbnailPreview);
        }
        try {
            const compressed = await compressImage(file);
            setFormData(prev => ({ ...prev, thumbnail: compressed }));
            setThumbnailPreview(URL.createObjectURL(compressed));
            setIsDirty(true);
        } catch (err) {
            console.error("Image compression failed, using original:", err);
            setFormData(prev => ({ ...prev, thumbnail: file }));
            setThumbnailPreview(URL.createObjectURL(file));
            setIsDirty(true);
        } finally {
            setUploadingThumbnail(false);
            e.target.value = "";
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        e.target.value = "";

        setUploadingGallery(true);
        try {
            const compressedFiles = await Promise.all(
                files.map(f => f.type.startsWith("image/") ? compressImage(f) : Promise.resolve(f))
            );
            setImages(prev => [...prev, ...compressedFiles]);
            setIsDirty(true);
        } catch (err) {
            console.error("Gallery compression failed, using original:", err);
            setImages(prev => [...prev, ...files]);
            setIsDirty(true);
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleVideoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        e.target.value = "";

        const filesWithId = files.map(file => {
            if (file.type.startsWith("video/")) {
                file.previewId = "vid_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
            }
            return file;
        });

        // Add videos with unique IDs to state
        setVideos(prev => [...prev, ...filesWithId]);
        setIsDirty(true);

        // Compress each video in the browser
        for (let i = 0; i < filesWithId.length; i++) {
            const file = filesWithId[i];
            if (!file.type.startsWith("video/")) continue;

            const vidId = file.previewId;
            setVideoCompressStatus(s => ({ ...s, [vidId]: { status: "compressing", pct: 0 } }));

            try {
                const compressed = await compressVideo(file, (pct) => {
                    setVideoCompressStatus(s => ({ ...s, [vidId]: { status: "compressing", pct } }));
                });

                // Attach compressed file to original so submit can read it
                file.compressedVersion = compressed;

                setVideoCompressStatus(s => ({
                    ...s,
                    [vidId]: compressed.size < file.size
                        ? { status: "done", pct: 100 }
                        : { status: "skipped", pct: 100 }
                }));
            } catch (err) {
                if (err.message === "COMPRESSION_CANCELLED") {
                    setVideoCompressStatus(s => {
                        const n = { ...s };
                        delete n[vidId];
                        return n;
                    });
                } else {
                    setVideoCompressStatus(s => ({ ...s, [vidId]: { status: "skipped", pct: 0 } }));
                }
            }
        }
    };

    const handleResourceFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, resource_file: file }));
            setIsDirty(true);
        }
        e.target.value = "";
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/products" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1E1628] border border-[#2d1b4e] text-gray-400 hover:bg-[#2d1b4e] hover:text-[#a78bfa] transition-colors shadow-lg shadow-purple-900/10">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Add New Product</h1>
                    <p className="text-gray-400">Fill in the details below</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8 pb-20">
                <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] p-8 space-y-6">
                    <h3 className="font-bold text-white text-lg border-b border-[#2d1b4e] pb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-purple-600 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)]"></span>
                        Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Title</label>
                            <input name="title" required value={formData.title} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="e.g. Birthday Video Template" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Slug</label>
                            <input name="slug" required value={formData.slug} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="e.g. birthday-video-template" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Parent Category <span className="text-purple-400 font-mono text-xs">[DI / GR]</span></label>
                            <select name="parent_category_id" required value={formData.parent_category_id} onChange={e => { handleChange(e); setFormData(p => ({ ...p, asset_category_id: "", asset_sub_category_id: "" })); }} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all">
                                <option value="">Select Parent</option>
                                {masterData.parentCategories?.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Type <span className="text-purple-400 font-mono text-xs">[PO / VI]</span></label>
                            <select name="asset_type_id" required value={formData.asset_type_id} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all">
                                <option value="">Select Type</option>
                                {masterData.types?.map(t => <option key={t.type_id} value={t.type_id}>{t.code} – {t.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Variant <span className="text-purple-400 font-mono text-xs">[WI / WO]</span></label>
                            <select name="asset_variant_id" required value={formData.asset_variant_id} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all">
                                <option value="">Select Variant</option>
                                {masterData.variants?.map(v => <option key={v.variant_id} value={v.variant_id}>{v.code} – {v.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Category <span className="text-purple-400 font-mono text-xs">[PE / BI / FW ...]</span></label>
                            <select name="asset_category_id" required value={formData.asset_category_id} onChange={e => { handleChange(e); setFormData(p => ({ ...p, asset_sub_category_id: "" })); }} disabled={!formData.parent_category_id} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all disabled:opacity-40">
                                <option value="">{formData.parent_category_id ? "Select Category" : "Select Parent First"}</option>
                                {masterData.categories?.filter(c => !formData.parent_category_id || String(c.parent_category_id) === String(formData.parent_category_id)).map(c => <option key={c.asset_category_id} value={c.asset_category_id}>{c.code} – {c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Sub-Category <span className="text-purple-400 font-mono text-xs">[AN / BIR / DIW ...]</span></label>
                            <select name="asset_sub_category_id" required value={formData.asset_sub_category_id} onChange={handleChange} disabled={!formData.asset_category_id} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all disabled:opacity-40">
                                <option value="">{formData.asset_category_id ? "Select Sub-Category" : "Select Category First"}</option>
                                {masterData.subCategories?.filter(s => !formData.asset_category_id || String(s.asset_category_id) === String(formData.asset_category_id)).map(s => <option key={s.asset_sub_category_id} value={s.asset_sub_category_id}>{s.code} – {s.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Orientation <span className="text-purple-400 font-mono text-xs">[HOR / VER / H&V]</span></label>
                            <select name="asset_orientation_id" required value={formData.asset_orientation_id} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all">
                                <option value="">Select Orientation</option>
                                {masterData.orientations?.map(o => <option key={o.orientation_id} value={o.orientation_id}>{o.code} – {o.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Serial Number <span className="text-purple-400 font-mono text-xs">[e.g. 1001]</span></label>
                            <input name="serial_number" type="number" required value={formData.serial_number} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="1001" />
                        </div>

                        {internalSku && (
                            <div className="md:col-span-2 bg-purple-900/20 border border-purple-700/30 rounded-xl px-4 py-3 flex items-center gap-3">
                                <span className="text-xs text-gray-400 font-medium">Generated SKU:</span>
                                <span className="font-mono text-purple-300 font-bold text-sm tracking-wider">{internalSku}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Price (₹)</label>
                            <input name="price" type="number" required onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="999" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Compared Price (₹)</label>
                            <input name="compared_price" type="number" onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="1499" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Language</label>
                            <select name="language" value={formData.language} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all">
                                {['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati'].map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] p-8 space-y-6">
                    <h3 className="font-bold text-white text-lg border-b border-[#2d1b4e] pb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>
                        Product Description
                    </h3>
                    <div className="space-y-2">
                        <textarea name="description" rows={8} onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="Product description..." />
                    </div>
                </div>

                <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] p-8 space-y-6">
                    <h3 className="font-bold text-white text-lg border-b border-[#2d1b4e] pb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        SEO & Meta Tags
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-bold text-gray-300">Meta Title (SEO Title)</label>
                                <span className={`text-xs ${formData.meta_title?.length > 60 ? "text-red-400" : "text-gray-500"}`}>{formData.meta_title?.length || 0}/60</span>
                            </div>
                            <input name="meta_title" onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="Title for Search Engines..." />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-bold text-gray-300">Meta Description</label>
                                <span className={`text-xs ${formData.meta_description?.length > 160 ? "text-red-400" : "text-gray-500"}`}>{formData.meta_description?.length || 0}/160</span>
                            </div>
                            <textarea name="meta_description" onChange={handleChange} rows="3" className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all resize-none placeholder-gray-500" placeholder="Summary for Search Results..."></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Meta Keywords</label>
                                <input name="meta_keywords" onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="keyword1, keyword2, keyword3..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Canonical URL</label>
                                <input name="canonical_url" onChange={handleChange} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500" placeholder="https://adbuth.com/..." />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-gray-300">Tags (Metadata)</label>
                                <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Examples: Brand: Adbuth, Quality: Premium</span>
                            </div>
                            <div className="flex gap-2">
                                <input value={tempTagKey} onChange={(e) => setTempTagKey(e.target.value)} className="w-1/3 p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="Key (e.g. Brand)" />
                                <input value={tempTagValue} onChange={(e) => setTempTagValue(e.target.value)} className="flex-1 p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="Value" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTagItem())} />
                                <button type="button" onClick={addTagItem} className="bg-purple-500/10 text-[#a78bfa] px-4 rounded-xl hover:bg-purple-500/20 border border-purple-500/20 transition-colors">
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                            </div>
                            {tags.length > 0 && (
                                <div className="mt-2 border border-[#2d1b4e] rounded-xl overflow-hidden">
                                    {tags.map((tag, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-[#130C1C]/50 border-b border-[#2d1b4e] last:border-0 text-sm">
                                            <div className="flex gap-4">
                                                <span className="font-semibold text-[#a78bfa] w-20 truncate">{tag.key}</span>
                                                <span className="text-gray-400">{tag.value}</span>
                                            </div>
                                            <button type="button" onClick={() => removeTagItem(idx)} className="text-gray-500 hover:text-red-400 transition-colors">
                                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">To Person (Target Audience)</label>
                                <div className="flex gap-2">
                                    <input value={tempPerson} onChange={(e) => setTempPerson(e.target.value)} className="flex-1 p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="e.g. Him, Her" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(tempPerson, setTempPerson, toPerson, setToPerson))} />
                                    <button type="button" onClick={() => addItem(tempPerson, setTempPerson, toPerson, setToPerson)} className="bg-emerald-500/10 text-emerald-400 px-4 rounded-xl hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors">
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {toPerson.map((p, idx) => (
                                        <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                                            {p}
                                            <button type="button" onClick={() => removeItem(idx, toPerson, setToPerson)} className="hover:text-red-400"><FontAwesomeIcon icon={faTimes} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] p-8 space-y-8">
                    <h3 className="font-bold text-white text-lg border-b border-[#2d1b4e] pb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-orange-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]"></span>
                        Media Gallery
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Thumbnail URL</label>
                            <div className="flex gap-2">
                                <input
                                    name="thumbnail"
                                    value={formData.thumbnail instanceof File ? "" : (formData.thumbnail || "")}
                                    onChange={(e) => {
                                        // Clear captured preview if admin manually types a URL
                                        if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
                                            URL.revokeObjectURL(thumbnailPreview);
                                            setThumbnailPreview("");
                                        }
                                        handleChange(e);
                                    }}
                                    className="flex-1 p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-gray-200 focus:ring-2 focus:ring-[#a78bfa]/30 focus:border-[#a78bfa]/50 outline-none transition-all placeholder-gray-500"
                                    placeholder="https://..."
                                />
                                <label className="bg-orange-600 cursor-pointer text-white px-4 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center" title="Upload thumbnail image">
                                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                                </label>
                            </div>
                            {uploadingThumbnail && (
                                <div className="mt-2 w-24 h-24 flex items-center justify-center bg-[#130C1C] border border-[#2d1b4e] rounded-lg">
                                    <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-xl" />
                                </div>
                            )}
                            {!uploadingThumbnail && (formData.thumbnail || thumbnailPreview) && (
                                <div className="mt-3 flex items-start gap-3">
                                    {/* Clickable thumbnail preview */}
                                    <div
                                        className="relative h-24 w-32 rounded-lg border border-[#2d1b4e] overflow-hidden cursor-pointer group flex-shrink-0"
                                        onClick={() => setThumbnailLightboxOpen(true)}
                                        title="Click to preview"
                                    >
                                        <Image
                                            src={thumbnailPreview || formData.thumbnail}
                                            alt="Thumbnail Preview"
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="128px"
                                        />
                                        {/* Expand icon overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                            <FontAwesomeIcon icon={faExpand} className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-lg" />
                                        </div>
                                    </div>
                                    {/* Change Thumbnail button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!window.confirm("Are you sure you want to remove the current thumbnail?")) return;
                                            if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
                                                URL.revokeObjectURL(thumbnailPreview);
                                            }
                                            setThumbnailPreview('');
                                            setFormData(prev => ({ ...prev, thumbnail: '' }));
                                            setShowVideoCapture(true);
                                        }}
                                        className="flex items-center gap-2 text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-colors"
                                        title="Remove thumbnail and recapture from video"
                                    >
                                        <FontAwesomeIcon icon={faSync} />
                                        Change
                                    </button>
                                </div>
                            )}

                            {/* Show the frame-capture tool ONLY if:
                                 1. A video exists (and it's not a YouTube/Vimeo link)
                                 2. The admin has NOT already set a thumbnail — OR explicitly clicked "Change" */}
                            {videos.length > 0
                                && !(videos[0] instanceof File ? false : (videos[0]?.includes('youtube.com') || videos[0]?.includes('youtu.be')))
                                && (!formData.thumbnail && !thumbnailPreview || showVideoCapture)
                                && (
                                <div className="mt-4">
                                    <div className="mb-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[11px] text-purple-300">
                                        <strong>No thumbnail set.</strong> Play the video below, pause at the perfect frame, and click <strong>Capture Frame</strong>.
                                    </div>
                                    <VideoThumbnailGenerator
                                        videoUrl={videoObjectUrl}
                                        isFile={videos[0] instanceof File}
                                        onCapture={async (file, previewUrl) => {
                                            setUploadingThumbnail(true);
                                            try {
                                                const compressed = await compressImage(file);
                                                setFormData(prev => ({ ...prev, thumbnail: compressed }));
                                                if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
                                                    URL.revokeObjectURL(thumbnailPreview);
                                                }
                                                setThumbnailPreview(URL.createObjectURL(compressed));
                                                setIsDirty(true);
                                            } catch (err) {
                                                console.error("Frame compression failed:", err);
                                                setFormData(prev => ({ ...prev, thumbnail: file }));
                                                setThumbnailPreview(previewUrl);
                                                setIsDirty(true);
                                            } finally {
                                                setUploadingThumbnail(false);
                                            }
                                            setShowVideoCapture(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300">Images Gallery</label>
                            <div className="flex gap-2">
                                <input value={tempImage} onChange={(e) => setTempImage(e.target.value)} className="flex-1 p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="Paste image URL here..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(tempImage, setTempImage, images, setImages))} />
                                <button type="button" onClick={() => addItem(tempImage, setTempImage, images, setImages)} className="bg-blue-500/10 text-blue-400 px-4 rounded-xl hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                                <label className="bg-blue-600 cursor-pointer text-white px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4 bg-[#130C1C]/50 p-4 rounded-xl border border-[#2d1b4e] min-h-[100px]">
                                {images.map((img, idx) => {
                                    const src = img instanceof File ? URL.createObjectURL(img) : img;
                                    return (
                                        <div key={idx} className="relative group">
                                            <div className="relative w-20 h-20 rounded-lg border border-[#2d1b4e] overflow-hidden">
                                                <Image src={src} alt="Gallery item" fill className="object-cover" sizes="80px" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm("Are you sure you want to remove this image?")) {
                                                        removeItem(idx, images, setImages);
                                                    }
                                                }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 text-white rounded-full text-[10px] flex items-center justify-center shadow-lg hover:bg-red-500"
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {uploadingGallery && (
                                    <div className="w-20 h-20 flex items-center justify-center bg-[#130C1C] border border-[#2d1b4e] rounded-lg">
                                        <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-xl" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[#2d1b4e]">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <FontAwesomeIcon icon={faVideo} className="text-[#a78bfa]" />
                            Video Showcase
                        </label>
                        <div className="flex gap-2">
                            <input value={tempVideo} onChange={(e) => setTempVideo(e.target.value)} className="flex-1 p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="Paste YouTube/Vimeo URL..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(tempVideo, setTempVideo, videos, setVideos))} />
                            <button type="button" onClick={() => addItem(tempVideo, setTempVideo, videos, setVideos)} className="bg-[#7C3AED] text-white px-6 rounded-xl hover:bg-[#6D28D9] transition-colors shadow-lg shadow-purple-900/20">
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                            <label className={`cursor-pointer text-white px-4 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20 transition-colors gap-2 ${isCompressing ? "bg-orange-600 hover:bg-orange-700" : "bg-[#7C3AED] hover:bg-[#6D28D9]"}`}>
                                <FontAwesomeIcon icon={isCompressing ? faCompress : faCloudUploadAlt} className={isCompressing ? "animate-pulse" : ""} />
                                {isCompressing && <span className="text-xs font-bold">Compressing…</span>}
                                <input type="file" className="hidden" accept="video/*" multiple onChange={handleVideoUpload} disabled={isCompressing} />
                            </label>
                        </div>

                        {/* Compression status banner */}
                        {isCompressing && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-xs">
                                <FontAwesomeIcon icon={faCompress} className="animate-pulse" />
                                <span>Browser is compressing your video — this may take a minute. Upload will start automatically when done.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 p-4 bg-[#130C1C]/50 rounded-2xl border border-[#2d1b4e] min-h-[100px]">
                            {videos.map((vid, idx) => {
                                const isLocal = vid instanceof File;
                                const vidId = isLocal ? vid.previewId : vid;
                                const cs = videoCompressStatus[vidId];
                                const isVidCompressing = cs?.status === "compressing";
                                return (
                                    <div key={idx} className="relative group aspect-video bg-black rounded-xl overflow-hidden shadow-sm border border-[#2d1b4e] cursor-pointer" onClick={() => !isVidCompressing && setSelectedVideo(vid)}>
                                        {/* Compression overlay */}
                                        {isVidCompressing ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
                                                <FontAwesomeIcon icon={faCompress} className="text-orange-400 text-xl animate-pulse" />
                                                <span className="text-orange-300 text-[10px] font-bold">
                                                    {cs.pct > 0 ? `${cs.pct}%` : "Starting…"}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                                                <FontAwesomeIcon icon={faPlay} className="text-white text-2xl group-hover:scale-110 transition-transform" />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isVidCompressing) {
                                                    const confirmed = window.confirm(
                                                        'This video is currently being compressed.\n\nAre you sure you want to cancel compression and remove it?'
                                                    );
                                                    if (!confirmed) return;
                                                    cancelCompression();
                                                } else {
                                                    const confirmed = window.confirm('Are you sure you want to remove this video?');
                                                    if (!confirmed) return;
                                                }
                                                removeItem(idx, videos, setVideos);
                                                setVideoCompressStatus(s => { const n = {...s}; delete n[vidId]; return n; });
                                            }}
                                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                        {/* Status badge */}
                                        {isLocal && (
                                            <span className={`absolute bottom-2 left-2 text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase ${
                                                isVidCompressing ? "bg-orange-600" :
                                                cs?.status === "done" ? "bg-green-600" :
                                                "bg-purple-600"
                                            }`}>
                                                {isVidCompressing ? `Compressing ${cs.pct}%` :
                                                 cs?.status === "done" ? "Compressed ✓" :
                                                 "Local"}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            {uploadingVideo && (
                                <div className="aspect-video flex items-center justify-center bg-[#130C1C] border border-[#2d1b4e] rounded-xl">
                                    <FontAwesomeIcon icon={faSpinner} spin className="text-[#a78bfa] text-2xl" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-[#2d1b4e]">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Resource File (Zip/Rar)</label>
                        <div className="flex flex-col gap-3">
                            <input
                                type="file"
                                accept=".zip,.rar,.7z"
                                onChange={handleResourceFileUpload}
                                className="hidden"
                                id="resource_file_upload"
                            />
                            <label
                                htmlFor="resource_file_upload"
                                className="cursor-pointer border-2 border-dashed border-[#2d1b4e] rounded-xl p-8 flex flex-col items-center gap-3 hover:bg-[#7C3AED]/5 transition-all text-gray-400 hover:text-[#7C3AED] hover:border-[#7C3AED]"
                            >
                                <FontAwesomeIcon icon={faFileUpload} size="2x" />
                                <span className="text-sm font-semibold">Upload Zip/Rar Package</span>
                                <span className="text-[10px] opacity-60 italic text-center px-4">This file will be stored in the /files subfolder of the product SKU</span>
                            </label>

                            {formData.resource_file && (
                                <div className="p-4 bg-[#1E1628] rounded-xl border border-green-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500 flex-shrink-0">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">Package Selected</p>
                                            <p className="text-[10px] text-gray-500 truncate">{formData.resource_file instanceof File ? formData.resource_file.name : formData.resource_file}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to remove this resource package?")) {
                                                setFormData(p => ({ ...p, resource_file: "" }));
                                            }
                                        }}
                                        className="text-gray-500 hover:text-red-400 p-2"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] p-8 space-y-6">
                    <h3 className="font-bold text-white text-lg border-b border-[#2d1b4e] pb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span>
                        Product Specifications (Summary)
                    </h3>
                    <div className="space-y-4" id="summary-form-top">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-300">Add Feature Sections</label>
                            {editingSummaryIndex !== null && (
                                <button onClick={cancelEditSummary} className="text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">Cancel Edit</button>
                            )}
                        </div>

                        <div className="bg-[#130C1C]/50 p-6 rounded-2xl border border-[#2d1b4e] space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section Title</label>
                                <input value={tempSummaryKey} onChange={(e) => setTempSummaryKey(e.target.value)} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="e.g. Dimensions, Features" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Details</label>
                                <div className="flex gap-2">
                                    <input value={tempSummaryPoint} onChange={(e) => setTempSummaryPoint(e.target.value)} className="flex-1 p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="Add a point..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSummaryPoint())} />
                                    <button type="button" onClick={addSummaryPoint} className="bg-orange-500/10 text-orange-400 px-4 rounded-xl hover:bg-orange-500/20 border border-orange-500/20 transition-colors">
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                                {tempSummaryPoints.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {tempSummaryPoints.map((p, i) => (
                                            <span key={i} className="bg-[#1E1628] border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm">
                                                {p}
                                                <button type="button" onClick={() => removeSummaryPoint(i)} className="hover:text-red-400"><FontAwesomeIcon icon={faTimes} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={addSummaryGroup} disabled={!tempSummaryKey.trim() || tempSummaryPoints.length === 0} className="w-full bg-[#7C3AED] text-white p-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50 hover:bg-[#6D28D9] transition-all">
                                {editingSummaryIndex !== null ? "Update Specification Section" : "Add Specification Section"}
                            </button>
                        </div>

                        {summary.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {summary.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start p-5 bg-[#1E1628] border border-[#2d1b4e] rounded-2xl shadow-sm border-l-4 border-l-orange-500">
                                        <div className="space-y-2">
                                            <span className="text-sm font-bold text-white">{item.key}</span>
                                            <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
                                                {item.values.map((v, i) => <li key={i}>{v}</li>)}
                                            </ul>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => startEditSummary(idx)} className="text-blue-400 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors"><FontAwesomeIcon icon={faEdit} /></button>
                                            <button type="button" onClick={() => removeSummaryGroup(idx)} className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"><FontAwesomeIcon icon={faTrash} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#1E1628] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#2d1b4e] p-8 space-y-6">
                    <h3 className="font-bold text-white text-lg border-b border-[#2d1b4e] pb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></span>
                        Customization Form Builder
                    </h3>
                    
                    {/* Template Controls */}
                    <div className="flex flex-wrap items-end gap-4 p-4 bg-pink-500/5 border border-pink-500/10 rounded-xl">
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Load Template</label>
                            <select 
                                className="w-full p-2.5 bg-[#2d1b4e] border border-pink-500/20 rounded-lg text-sm text-gray-200 outline-none"
                                onChange={(e) => {
                                    const template = masterData.customizationTemplates?.find(t => t.template_id === e.target.value);
                                    if (template && confirm(`Load template "${template.name}"? This will replace your current customization fields.`)) {
                                        setCustomizations(template.fields);
                                        setIsDirty(true);
                                    }
                                    e.target.value = "";
                                }}
                            >
                                <option value="">Select a preset template...</option>
                                {masterData.customizationTemplates?.map(t => (
                                    <option key={t.template_id} value={t.template_id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Save Current as Template</label>
                            <div className="flex gap-2">
                                <input 
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    className="flex-1 p-2.5 bg-[#2d1b4e] border border-pink-500/20 rounded-lg text-sm text-gray-200 outline-none placeholder-gray-600"
                                    placeholder="Template name (e.g. Wedding Form)"
                                />
                                <button 
                                    type="button"
                                    disabled={!templateName.trim() || customizations.length === 0 || isSavingTemplate}
                                    onClick={async () => {
                                        try {
                                            setIsSavingTemplate(true);
                                            const token = getAuthToken();
                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                                            await axios.post(`${apiUrl}/api/admin/master-data/customization-templates`, {
                                                name: templateName,
                                                fields: customizations
                                            }, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            alert("Template saved!");
                                            setTemplateName("");
                                            // Refresh master data to show new template in dropdown
                                            const mdRes = await fetch(`${apiUrl}/api/admin/master-data`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            const md = await mdRes.json();
                                            if (md && !md.error) setMasterData(md);
                                        } catch (err) {
                                            alert(err.response?.data?.error || "Failed to save template");
                                        } finally {
                                            setIsSavingTemplate(false);
                                        }
                                    }}
                                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {isSavingTemplate ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#130C1C]/50 p-6 rounded-2xl space-y-5 border border-[#2d1b4e]">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                                    {editingCustIndex !== null ? "Edit Customization Group" : "Add New Customization Group"}
                                </h4>
                                {editingCustIndex !== null && <button type="button" onClick={cancelEditCustomization} className="text-[10px] text-red-500 font-bold uppercase hover:bg-red-500/10 px-2 py-1 rounded">Cancel</button>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#2d1b4e] pb-6">
                                <div className="md:col-span-1 space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Group Header</label>
                                    <input value={tempCustKey} onChange={(e) => setTempCustKey(e.target.value)} className="w-full p-3 bg-[#2d1b4e] border border-transparent rounded-xl text-sm text-gray-200 outline-none placeholder-gray-500" placeholder="e.g. Wedding Details" />
                                </div>

                                <div className="md:col-span-2 bg-[#2d1b4e] p-4 rounded-xl border border-[#3b2a5f] space-y-3 shadow-inner">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-[#3b2a5f] pb-2 block">Quick Field Add</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input value={tempCustFieldName} onChange={(e) => setTempCustFieldName(e.target.value)} className="p-3 border border-transparent rounded-lg text-sm bg-[#130C1C]/50 text-gray-200 placeholder-gray-500 outline-none" placeholder="Label (e.g. Couple Name)" />
                                        <select value={tempCustFieldType} onChange={(e) => setTempCustFieldType(e.target.value)} className="p-3 border border-transparent rounded-lg text-sm bg-[#130C1C]/50 text-gray-200 outline-none">
                                            <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="time">Time</option><option value="media">Media</option><option value="email">Email</option><option value="boolean">Boolean</option>
                                        </select>
                                    </div>
                                    <button type="button" onClick={addCustField} disabled={!tempCustFieldName.trim()} className="w-full bg-[#130C1C] text-white p-2 rounded-lg text-xs font-bold hover:bg-black transition-colors border border-[#3b2a5f]">
                                        {editingCustFieldIndex !== null ? "Update Field" : "Add Field to Group"}
                                    </button>
                                </div>
                            </div>

                            {tempCustFieldList.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tempCustFieldList.map(([name, type], i) => (
                                        <span key={i} 
                                            onClick={() => startEditCustField(i)}
                                            className={`border px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${editingCustFieldIndex === i ? "bg-purple-600 text-white border-purple-400" : "bg-purple-500/10 text-[#a78bfa] border-purple-500/20 hover:bg-purple-500/20"}`}
                                        >
                                            {name} ({type})
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeCustField(i); }} className="hover:text-red-400"><FontAwesomeIcon icon={faTimes} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <button type="button" onClick={addCustomizationGroup} disabled={!tempCustKey.trim() || tempCustFieldList.length === 0} className="w-full bg-[#7C3AED] text-white p-4 rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:bg-[#6D28D9] transition-all">
                                {editingCustIndex !== null ? "Update Customization Group" : "Save Customization Group"}
                            </button>
                        </div>

                        {customizations.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {customizations.map((cust, idx) => {
                                    const key = Object.keys(cust)[0];
                                    const fields = cust[key];
                                    return (
                                        <div key={idx} className="flex justify-between items-start p-5 bg-[#1E1628] border border-[#2d1b4e] rounded-2xl shadow-sm border-l-4 border-l-pink-500">
                                            <div className="space-y-3">
                                                <span className="text-sm font-bold text-white uppercase tracking-tight">{key}</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Array.isArray(fields) && fields.map((item, i) => {
                                                        const [name, type] = Array.isArray(item) ? item : [item, "text"];
                                                        return <span key={i} className="text-[9px] bg-[#2d1b4e] text-gray-400 px-2 py-1 rounded-md border border-[#3b2a5f] font-bold">{name} <span className="opacity-50 text-[7px]">{type}</span></span>;
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => startEditCustomization(idx)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"><FontAwesomeIcon icon={faPencilAlt} /></button>
                                                <button type="button" onClick={() => removeCustomization(idx)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><FontAwesomeIcon icon={faTrash} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="fixed bottom-0 right-0 z-40 transition-all duration-200" style={{ left: 'var(--sidebar-width, 260px)' }}>

                    {/* Upload Progress Panel — shown during submit */}
                    {loading && Object.keys(uploadProgress).length > 0 && (
                        <div className="bg-[#0E0819]/98 backdrop-blur-xl border-t border-purple-500/20 px-6 pt-5 pb-3 shadow-[0_-8px_32px_rgba(124,58,237,0.15)]">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                                    <span className="text-xs font-bold text-purple-300 uppercase tracking-[0.15em]">Uploading Files</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">
                                    {Object.values(uploadProgress).filter(p => p.done).length} / {Object.keys(uploadProgress).length} complete
                                </span>
                            </div>

                            {/* Progress Items */}
                            <div className="space-y-3 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                                {Object.entries(uploadProgress).map(([label, { pct, done, timedOut, error }]) => {
                                    const isActive = !done && !error && !timedOut;
                                    const gradientBar = error
                                        ? 'from-red-600 to-red-400'
                                        : timedOut
                                        ? 'from-amber-600 to-amber-400'
                                        : done
                                        ? 'from-emerald-600 to-green-400'
                                        : 'from-violet-600 via-purple-500 to-fuchsia-400';
                                    const badge = error
                                        ? { text: 'Failed', cls: 'bg-red-500/15 text-red-400 border-red-500/30' }
                                        : timedOut
                                        ? { text: 'Timed Out', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
                                        : done
                                        ? { text: '✓ Done', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
                                        : { text: `${pct}%`, cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
                                    return (
                                        <div key={label} className="flex items-center gap-3 group">
                                            {/* Icon indicator */}
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                error ? 'bg-red-500/20' : timedOut ? 'bg-amber-500/20' : done ? 'bg-emerald-500/20' : 'bg-purple-500/15'
                                            }`}>
                                                {error ? (
                                                    <span className="text-red-400 text-xs font-bold">✕</span>
                                                ) : timedOut ? (
                                                    <span className="text-amber-400 text-xs">⏱</span>
                                                ) : done ? (
                                                    <span className="text-emerald-400 text-xs font-bold">✓</span>
                                                ) : (
                                                    <div className="w-3 h-3 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin"></div>
                                                )}
                                            </div>

                                            {/* Label + bar */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[11px] text-gray-300 font-medium truncate leading-none">{label}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2 shrink-0 ${badge.cls}`}>
                                                        {badge.text}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full bg-gradient-to-r ${gradientBar} transition-all duration-500 ${isActive ? 'shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''}`}
                                                        style={{ width: `${timedOut || error ? 100 : pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons Bar */}
                    <div className="bg-[#130C1C]/98 backdrop-blur-xl border-t border-[#2d1b4e]/80 px-6 py-4 flex items-center justify-end gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
                        {/* Overall progress mini-bar (shown when uploading) */}
                        {loading && Object.keys(uploadProgress).length > 0 && (
                            <div className="flex-1 max-w-xs hidden md:block">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        Overall
                                    </span>
                                    <span className="text-[10px] text-purple-300 font-bold">
                                        {Math.round(Object.values(uploadProgress).reduce((sum, p) => sum + (p.done || p.timedOut || p.error ? 100 : p.pct), 0) / Math.max(Object.keys(uploadProgress).length, 1))}%
                                    </span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                        style={{
                                            width: `${Math.round(Object.values(uploadProgress).reduce((sum, p) => sum + (p.done || p.timedOut || p.error ? 100 : p.pct), 0) / Math.max(Object.keys(uploadProgress).length, 1))}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            formNoValidate
                            onClick={() => setIsDraftSubmit(true)}
                            disabled={loading || isCompressing}
                            className="flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/40 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading && isDraftSubmit ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-300 rounded-full animate-spin"></div>
                                    <span>Saving Draft...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="text-xs" />
                                    <span>Save as Draft</span>
                                </>
                            )}
                        </button>

                        <button
                            type="submit"
                            onClick={() => setIsDraftSubmit(false)}
                            disabled={loading || isCompressing}
                            className="relative flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/40 overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out"></div>
                            {loading && !isDraftSubmit ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                    <span>Create Product</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {selectedVideo && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8 animate-fadeIn">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedVideo(null)}></div>
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-xl" />
                        </button>

                    <div className="w-full h-full flex items-center justify-center">
                            {selectedVideo instanceof File ? (
                                <video
                                    src={URL.createObjectURL(selectedVideo)}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                ></video>
                            ) : (selectedVideo?.includes("youtube.com") || selectedVideo?.includes("youtu.be")) ? (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${selectedVideo.includes("v=") ? selectedVideo.split("v=")[1].split("&")[0] : selectedVideo.split("/").pop()}?autoplay=1`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <video
                                    src={selectedVideo}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                ></video>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Thumbnail Lightbox Modal */}
            {thumbnailLightboxOpen && (thumbnailPreview || formData.thumbnail) && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        onClick={() => setThumbnailLightboxOpen(false)}
                    />
                    <div className="relative z-10 max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-[#2d1b4e] animate-scaleIn">
                        <button
                            type="button"
                            onClick={() => setThumbnailLightboxOpen(false)}
                            className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-all border border-white/20"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                            <Image
                                src={thumbnailPreview || formData.thumbnail}
                                alt="Thumbnail Full Preview"
                                fill
                                className="object-contain bg-black"
                                sizes="(max-width: 1024px) 100vw, 1024px"
                            />
                        </div>
                    </div>
                </div>
            )}


            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
}

export default withPermission(CreateProduct, "products");
