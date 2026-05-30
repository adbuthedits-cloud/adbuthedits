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

import withPermission from "../../../../components/withPermission";

function CreateProduct() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDraftSubmit, setIsDraftSubmit] = useState(false);

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
        canonical_url: ""
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
    const { compressVideo, isCompressing } = useVideoCompressor();
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
    };

    const removeItem = (index, list, setList) => {
        setList(list.filter((_, i) => i !== index));
    };

    const addTagItem = () => {
        if (!tempTagKey.trim() || !tempTagValue.trim()) return;
        setTags([...tags, { key: tempTagKey.trim(), value: tempTagValue.trim() }]);
        setTempTagKey("");
        setTempTagValue("");
    };

    const removeTagItem = (index) => {
        setTags(tags.filter((_, i) => i !== index));
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

    const handleFileUpload = async (file, subfolder = "image", explicitKey = null) => {
        if (!file) return null;
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

            const res = await axios.post(`${apiUrl}/api/admin/upload-media`, formDataPayload, {
                headers: headers
            });
            return res.data.url;
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isCompressing) {
            alert("Please wait for video compression to finish before submitting. Large videos might take a minute.");
            return;
        }

        setLoading(true);

        try {
            const token = getAuthToken();
            if (!token) {
                router.push("/login");
                return;
            }

            let thumbnailUrl = formData.thumbnail;
            if (formData.thumbnail instanceof File) {
                setUploadingThumbnail(true);
                thumbnailUrl = await handleFileUpload(formData.thumbnail, "thumbnail");
                setUploadingThumbnail(false);
                if (!thumbnailUrl) throw new Error("Thumbnail upload failed");
            }

            const finalImages = [];
            if (images.some(img => img instanceof File)) setUploadingGallery(true);
            for (const item of images) {
                if (item instanceof File) {
                    const url = await handleFileUpload(item, "image");
                    if (url) finalImages.push(url);
                    else throw new Error("Gallery image upload failed");
                } else {
                    finalImages.push(item);
                }
            }
            setUploadingGallery(false);

            const finalVideos = [];
            if (videos.some(vid => vid instanceof File)) setUploadingVideo(true);
            for (const item of videos) {
                if (item instanceof File) {
                    const url = await handleFileUpload(item, "video");
                    if (url) {
                        finalVideos.push(url);
                        // If we have a compressed version, upload it with _web suffix
                        if (item.compressedVersion && item.compressedVersion !== item) {
                            try {
                                const urlObj = new URL(url);
                                let originalKey = decodeURIComponent(urlObj.pathname);
                                if (originalKey.startsWith('/')) originalKey = originalKey.substring(1);
                                const webKey = originalKey.replace(/\.[^/.]+$/, '_web.mp4');
                                await handleFileUpload(item.compressedVersion, "video", webKey);
                            } catch (e) {
                                console.error("Failed to upload compressed version", e);
                            }
                        }
                    }
                    else throw new Error("Video upload failed");
                } else {
                    finalVideos.push(item);
                }
            }
            setUploadingVideo(false);

            let resourceFileUrl = formData.resource_file;
            if (formData.resource_file instanceof File) {
                setUploadingResource(true);
                resourceFileUrl = await handleFileUpload(formData.resource_file, "file");
                setUploadingResource(false);
                if (!resourceFileUrl) throw new Error("Resource file upload failed");
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
                resource_file: resourceFileUrl
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            await axios.post(`${apiUrl}/api/admin/products`, dataToSubmit, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (isDraftSubmit) {
                alert("Draft saved successfully! You can continue editing.");
                setLoading(false);
                // Don't redirect if it's a draft
            } else {
                router.push("/products");
            }
        } catch (error) {
            setUploadingThumbnail(false);
            setUploadingGallery(false);
            setUploadingVideo(false);
            setUploadingResource(false);
            console.error(error);
            alert("Failed to create product: " + (error.response?.data?.error || error.message));
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
        setUploadingThumbnail(true);
        try {
            const compressed = await compressImage(file);
            setFormData(prev => ({ ...prev, thumbnail: compressed }));
            setThumbnailPreview(URL.createObjectURL(compressed));
        } catch (err) {
            console.error("Image compression failed, using original:", err);
            setFormData(prev => ({ ...prev, thumbnail: file }));
            setThumbnailPreview(URL.createObjectURL(file));
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
        } catch (err) {
            console.error("Gallery compression failed, using original:", err);
            setImages(prev => [...prev, ...files]);
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleVideoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        e.target.value = "";

        // Add placeholders immediately so user sees them in the list
        setVideos(prev => [...prev, ...files]);
        const startIdx = videos.length; // index of first new video

        // Compress each video in the browser
        for (let i = 0; i < files.length; i++) {
            const vidIdx = startIdx + i;
            const file = files[i];
            if (!file.type.startsWith("video/")) continue;

            setVideoCompressStatus(s => ({ ...s, [vidIdx]: { status: "compressing", pct: 0 } }));

            try {
                const compressed = await compressVideo(file, (pct) => {
                    setVideoCompressStatus(s => ({ ...s, [vidIdx]: { status: "compressing", pct } }));
                });

                // Attach the compressed file to the original file object
                // We do NOT replace the placeholder. The original file stays in `videos` array.
                file.compressedVersion = compressed;
                
                setVideoCompressStatus(s => ({
                    ...s,
                    [vidIdx]: compressed.size < file.size
                        ? { status: "done", pct: 100 }
                        : { status: "skipped", pct: 100 }
                }));
            } catch {
                setVideoCompressStatus(s => ({ ...s, [vidIdx]: { status: "skipped", pct: 0 } }));
            }
        }
    };

    const handleResourceFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, resource_file: file }));
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
                                        onCapture={(file, previewUrl) => {
                                            setFormData(prev => ({ ...prev, thumbnail: file }));
                                            setThumbnailPreview(previewUrl);
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
                                            <button type="button" onClick={() => removeItem(idx, images, setImages)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 text-white rounded-full text-[10px] flex items-center justify-center shadow-lg hover:bg-red-500">
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
                                const cs = videoCompressStatus[idx];
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
                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(idx, videos, setVideos); setVideoCompressStatus(s => { const n = {...s}; delete n[idx]; return n; }); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
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
                                        onClick={() => setFormData(p => ({ ...p, resource_file: "" }))}
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

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#130C1C]/80 backdrop-blur-md border-t border-[#2d1b4e] z-40 flex justify-end gap-4">
                    <button type="submit" formNoValidate onClick={() => setIsDraftSubmit(true)} disabled={loading || isCompressing} className="w-full max-w-[250px] bg-[#2d1b4e] text-gray-300 py-2 rounded-full font-bold hover:bg-[#3b2a5f] transition-all shadow-xl shadow-purple-900/10 flex items-center justify-center gap-3 text-lg border border-[#3b2a5f] disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading && isDraftSubmit ? (
                            <>
                                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                Saving Draft...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faSave} />
                                Save as Draft
                            </>
                        )}
                    </button>
                    <button type="submit" onClick={() => setIsDraftSubmit(false)} disabled={loading || isCompressing} className="w-full max-w-[250px] bg-[#7C3AED] text-white py-2 rounded-full font-bold hover:bg-[#6D28D9] transition-all shadow-2xl shadow-purple-900/20 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading && !isDraftSubmit ? (
                            <>
                                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                Creating Product...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faPlus} />
                                Create Product
                            </>
                        )}
                    </button>
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
