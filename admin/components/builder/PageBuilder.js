import React from 'react';
import { useBuilder } from './BuilderContext';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Section from './Section';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default function PageBuilder() {
    const { sections, addSection, reorderBlocks } = useBuilder();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;
        if (active.id !== over.id) {
            reorderBlocks(active.id, over.id);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="space-y-6 pb-20">
                {sections.map((section, index) => (
                    <Section key={section.id} section={section} index={index} />
                ))}

                <button
                    onClick={() => addSection('1-col')}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Section
                </button>
            </div>
            {/* DragOverlay will be added inside BlockRenderer or here if strictly needed for cross-column visual */}
        </DndContext>
    );
}
