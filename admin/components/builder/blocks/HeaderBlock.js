import React from 'react';
import { useBuilder } from '../BuilderContext';

export default function HeaderBlock({ block }) {
    const { updateBlock } = useBuilder();

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <select
                    value={block.level}
                    onChange={(e) => updateBlock(block.id, { level: e.target.value })}
                    className="text-xs bg-gray-50 border border-gray-200 rounded px-1 outline-none font-bold text-gray-600"
                >
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                    <option value="h4">H4</option>
                </select>
            </div>
            <input
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                className={`w-full outline-none border-b border-transparent hover:border-gray-200 focus:border-purple-500 transition-colors font-bold text-gray-800
                    ${block.level === 'h1' ? 'text-3xl' : ''}
                    ${block.level === 'h2' ? 'text-2xl' : ''}
                    ${block.level === 'h3' ? 'text-xl' : ''}
                    ${block.level === 'h4' ? 'text-lg' : ''}
                `}
                placeholder="Heading Text"
            />
        </div>
    );
}
