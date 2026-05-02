import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useBuilder } from './BuilderContext';
import BlockRenderer from './BlockRenderer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default function Column({ column }) {
    const { addBlock } = useBuilder();
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div ref={setNodeRef} className="flex flex-col h-full">
            <div className="flex-1 bg-gray-50/50 border border-dashed border-gray-200 rounded-lg p-2 space-y-3 min-h-[100px]">
                <SortableContext items={column.blocks} strategy={verticalListSortingStrategy}>
                    {column.blocks.map(block => (
                        <BlockRenderer key={block.id} block={block} />
                    ))}
                </SortableContext>
            </div>

            {/* Add Block Controls */}
            <div className="mt-2 grid grid-cols-5 gap-1">
                <button onClick={() => addBlock(column.id, 'header')} className="text-[10px] bg-gray-100 hover:bg-white border border-transparent hover:border-gray-200 py-1 rounded text-gray-600 font-bold">H</button>
                <button onClick={() => addBlock(column.id, 'text')} className="text-[10px] bg-gray-100 hover:bg-white border border-transparent hover:border-gray-200 py-1 rounded text-gray-600 font-bold">T</button>
                <button onClick={() => addBlock(column.id, 'list')} className="text-[10px] bg-gray-100 hover:bg-white border border-transparent hover:border-gray-200 py-1 rounded text-gray-600 font-bold">List</button>
                <button onClick={() => addBlock(column.id, 'image')} className="text-[10px] bg-gray-100 hover:bg-white border border-transparent hover:border-gray-200 py-1 rounded text-gray-600 font-bold">Img</button>
                <button onClick={() => addBlock(column.id, 'video')} className="text-[10px] bg-gray-100 hover:bg-white border border-transparent hover:border-gray-200 py-1 rounded text-gray-600 font-bold">Vid</button>
            </div>
        </div>
    );
}
