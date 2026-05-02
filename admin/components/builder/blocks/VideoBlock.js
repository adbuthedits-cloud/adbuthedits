import React from 'react';
import { useBuilder } from '../BuilderContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo } from '@fortawesome/free-solid-svg-icons';

export default function VideoBlock({ block }) {
    const { updateBlock } = useBuilder();

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50 focus-within:ring-2 focus-within:ring-purple-200">
                <FontAwesomeIcon icon={faVideo} className="text-gray-400" />
                <input
                    value={block.url || ''}
                    onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                    placeholder="Paste YouTube URL here..."
                />
            </div>
            {block.url && (
                <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
                    {/* Basic Embed Logic - For robust use, parse ID */}
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={block.url.replace('watch?v=', 'embed/')}
                        title="Video"
                        frameBorder="0"
                        allowFullScreen
                    />
                </div>
            )}
        </div>
    );
}
