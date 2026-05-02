import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faTrash, faImage, faFont } from '@fortawesome/free-solid-svg-icons';

function SortableBlock({ block, index, updateBlock, removeBlock, onUpload }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-white border text-gray-800 border-gray-200 rounded-xl mb-4 shadow-sm overflow-hidden group">
            <div className="bg-gray-50 border-b border-gray-100 p-2 flex items-center justify-between">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 px-2 active:cursor-grabbing">
                    <FontAwesomeIcon icon={faGripVertical} />
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{block.type} BLOCK</div>
                <button onClick={() => removeBlock(block.id)} className="text-red-400 hover:text-red-600 px-2 transition-colors">
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>

            <div className="p-4">
                {block.type === 'text' && (
                    <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-y text-gray-700"
                        placeholder="Type your content here..."
                    />
                )}

                {block.type === 'image' && (
                    <div className="flex flex-col gap-4">
                        {block.url ? (
                            <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 min-h-[200px]">
                                <Image 
                                    src={block.url} 
                                    alt={block.alt || "Uploaded"} 
                                    fill
                                    className="object-contain" 
                                    sizes="(max-width: 768px) 100vw, 400px"
                                />
                                <button
                                    onClick={() => updateBlock(block.id, { url: '' })}
                                    className="absolute top-2 right-2 bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-50"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => document.getElementById(`file-${block.id}`).click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faImage} className="text-3xl mb-2" />
                                <span className="text-sm font-medium">Click to upload image</span>
                                <input
                                    id={`file-${block.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => onUpload(e, block.id)}
                                />
                            </div>
                        )}
                        <input
                            value={block.alt || ''}
                            onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                            className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none"
                            placeholder="Image caption / Alt text (optional)"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BlockEditor({ blocks, setBlocks, onUpload }) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const updateBlock = (id, updates) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const removeBlock = (id) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                {blocks.map((block, index) => (
                    <SortableBlock
                        key={block.id}
                        block={block}
                        index={index}
                        updateBlock={updateBlock}
                        removeBlock={removeBlock}
                        onUpload={onUpload}
                    />
                ))}
            </SortableContext>

            {blocks.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                    <p>No content blocks yet. Add one below!</p>
                </div>
            )}
        </DndContext>
    );
}
