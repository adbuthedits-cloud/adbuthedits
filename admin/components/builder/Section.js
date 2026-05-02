import React from 'react';
import { useBuilder } from './BuilderContext';
import Column from './Column';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faColumns } from '@fortawesome/free-solid-svg-icons';

export default function Section({ section }) {
    const { removeSection, updateSectionLayout } = useBuilder();

    // Map layouts to Tailwind grid classes
    const getGridClass = () => {
        switch (section.layout) {
            case '2-col': return 'grid-cols-1 md:grid-cols-2';
            case '2-col-30-70': return 'grid-cols-1 md:grid-cols-[30%_70%]'; // Custom arbitrary value
            case '2-col-70-30': return 'grid-cols-1 md:grid-cols-[70%_30%]';
            case '3-col': return 'grid-cols-1 md:grid-cols-3';
            default: return 'grid-cols-1';
        }
    };

    return (
        <div className="bg-white border text-gray-800 border-gray-200 rounded-xl shadow-sm overflow-hidden group">
            {/* Section Header / Controls */}
            <div className="bg-gray-50 border-b border-gray-100 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Row</span>

                    {/* Layout Selector */}
                    <select
                        value={section.layout}
                        onChange={(e) => updateSectionLayout(section.id, e.target.value)}
                        className="text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-purple-500"
                    >
                        <option value="1-col">1 Column (100%)</option>
                        <option value="2-col">2 Columns (50/50)</option>
                        <option value="2-col-30-70">2 Columns (30/70)</option>
                        <option value="2-col-70-30">2 Columns (70/30)</option>
                        <option value="3-col">3 Columns (33/33/33)</option>
                    </select>
                </div>

                <button onClick={() => removeSection(section.id)} className="text-red-400 hover:text-red-600 px-2">
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>

            {/* Section Body (Grid) */}
            <div className={`grid ${getGridClass()} gap-4 p-4 min-h-[100px]`}>
                {section.columns.map(col => (
                    <Column key={col.id} column={col} />
                ))}
            </div>
        </div>
    );
}
