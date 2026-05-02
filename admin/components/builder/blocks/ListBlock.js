import React from 'react';
import { useBuilder } from '../BuilderContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function ListBlock({ block }) {
    const { updateBlock } = useBuilder();
    // Ensure content is an array
    const items = Array.isArray(block.content) ? block.content : [];

    const addItem = () => {
        updateBlock(block.id, { content: [...items, ''] });
    };

    const updateItem = (index, val) => {
        const newItems = [...items];
        newItems[index] = val;
        updateBlock(block.id, { content: newItems });
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        updateBlock(block.id, { content: newItems });
    };

    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <input
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="flex-1 outline-none border-b border-gray-100 focus:border-purple-300 text-gray-700 py-1"
                        placeholder="List item..."
                    />
                    <button onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-400">
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                </div>
            ))}
            <button onClick={addItem} className="text-xs text-purple-500 hover:text-purple-700 font-bold flex items-center gap-1 mt-2">
                <FontAwesomeIcon icon={faPlus} /> Add Item
            </button>
        </div>
    );
}
