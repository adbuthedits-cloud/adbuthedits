import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useBuilder } from './BuilderContext';

// Import individual blocks
import HeaderBlock from './blocks/HeaderBlock';
import TextBlock from './blocks/TextBlock';
import ListBlock from './blocks/ListBlock';
import ImageBlock from './blocks/ImageBlock';
import VideoBlock from './blocks/VideoBlock';

export default function BlockRenderer({ block }) {
    const { removeBlock } = useBuilder();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const renderContent = () => {
        switch (block.type) {
            case 'header': return <HeaderBlock block={block} />;
            case 'text': return <TextBlock block={block} />;
            case 'list': return <ListBlock block={block} />;
            case 'image': return <ImageBlock block={block} />;
            case 'video': return <VideoBlock block={block} />;
            default: return <div>Unknown Block</div>;
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-white border text-gray-800 border-gray-200 rounded-lg shadow-sm group relative">
            {/* Drag Handle & Delete */}
            <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-gray-50 rounded-l-lg border-r border-transparent hover:border-gray-100" {...attributes} {...listeners}>
                <FontAwesomeIcon icon={faGripVertical} className="text-gray-300" />
            </div>

            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => removeBlock(block.id)} className="text-red-300 hover:text-red-500 bg-white rounded-full p-1 shadow-sm">
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </button>
            </div>

            {/* Block Content */}
            <div className="pl-6 p-3">
                {renderContent()}
            </div>
        </div>
    );
}
