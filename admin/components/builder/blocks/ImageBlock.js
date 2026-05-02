import React, { useState } from 'react';
import Image from 'next/image';
import { useBuilder } from '../BuilderContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

export default function ImageBlock({ block }) {
    const { updateBlock } = useBuilder();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`${apiUrl}/api/admin/upload-blog-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            updateBlock(block.id, { url: res.data.url });
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (block.url) {
        return (
            <div className="space-y-2">
                <Image 
                    src={block.url} 
                    alt={block.alt || "Uploaded"} 
                    width={800} 
                    height={450} 
                    className="w-full rounded-lg object-contain bg-gray-50 border border-gray-100 max-h-[300px]" 
                    style={{ height: 'auto' }}
                />
                <input
                    value={block.alt || ''}
                    onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                    className="w-full text-xs text-center border-b border-transparent hover:border-gray-200 focus:border-purple-300 outline-none pb-1 text-gray-500"
                    placeholder="Add caption / alt text"
                />
            </div>
        );
    }

    return (
        <div
            onClick={() => document.getElementById(`upload-${block.id}`).click()}
            className="border-2 border-dashed border-gray-200 hover:border-purple-300 bg-gray-50 hover:bg-purple-50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[120px]"
        >
            <input
                id={`upload-${block.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
            />
            {uploading ? (
                <div className="text-purple-500 flex flex-col items-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mb-2" />
                    <span className="text-xs font-bold">Uploading...</span>
                </div>
            ) : (
                <div className="text-gray-400 flex flex-col items-center">
                    <FontAwesomeIcon icon={faImage} className="text-2xl mb-2" />
                    <span className="text-xs font-bold">Click to Upload Image</span>
                </div>
            )}
        </div>
    );
}
