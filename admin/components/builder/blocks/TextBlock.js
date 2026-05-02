import React from 'react';
import { useBuilder } from '../BuilderContext';
import RichTextEditor from '../RichTextEditor';

export default function TextBlock({ block }) {
    const { updateBlock } = useBuilder();

    return (
        <div className="text-editor-wrapper" onPointerDown={(e) => e.stopPropagation()}>
            <RichTextEditor
                value={block.content}
                onChange={(content) => updateBlock(block.id, { content })}
            />
        </div>
    );
}
