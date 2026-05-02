import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const BuilderContext = createContext();

export const useBuilder = () => useContext(BuilderContext);

export const BuilderProvider = ({ children, initialData = [] }) => {
    // Structure: Array of Sections
    // Section: { id, type: 'section', layout: '1-col', columns: [ { id, blocks: [] } ] }
    const [sections, setSections] = useState(initialData);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    // --- SECTIONS ---
    const addSection = (layout = '1-col') => {
        const newSection = {
            id: `sec-${generateId()}`,
            type: 'section',
            layout,
            columns: []
        };

        // Create columns based on layout
        let colCount = 1;
        if (layout.startsWith('2-col')) colCount = 2;
        if (layout.startsWith('3-col')) colCount = 3;

        for (let i = 0; i < colCount; i++) {
            newSection.columns.push({
                id: `col-${generateId()}`,
                blocks: []
            });
        }

        setSections([...sections, newSection]);
    };

    const removeSection = (sectionId) => {
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const updateSectionLayout = (sectionId, newLayout) => {
        setSections(sections.map(sec => {
            if (sec.id !== sectionId) return sec;

            let newCols = [...sec.columns];
            let targetCount = 1;
            if (newLayout.startsWith('2-col')) targetCount = 2;
            if (newLayout.startsWith('3-col')) targetCount = 3;

            if (newCols.length < targetCount) {
                while (newCols.length < targetCount) {
                    newCols.push({ id: `col-${generateId()}`, blocks: [] });
                }
            } else if (newCols.length > targetCount) {
                newCols = newCols.slice(0, targetCount);
            }

            return { ...sec, layout: newLayout, columns: newCols };
        }));
    };

    // --- BLOCKS ---
    const addBlock = (columnId, type) => {
        setSections(prev => prev.map(sec => ({
            ...sec,
            columns: sec.columns.map(col => {
                if (col.id !== columnId) return col;

                let content = '';
                if (type === 'list') content = [];

                return {
                    ...col,
                    blocks: [...col.blocks, {
                        id: `blk-${generateId()}`,
                        type,
                        content,
                        url: '',
                        level: 'h2'
                    }]
                };
            })
        })));
    };

    const updateBlock = (blockId, updates) => {
        setSections(prev => prev.map(sec => ({
            ...sec,
            columns: sec.columns.map(col => ({
                ...col,
                blocks: col.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
            }))
        })));
    };

    const removeBlock = async (blockId) => {
        let blockToDelete = null;
        for (const sec of sections) {
            for (const col of sec.columns) {
                const found = col.blocks.find(b => b.id === blockId);
                if (found) blockToDelete = found;
            }
        }

        if (blockToDelete && blockToDelete.type === 'image' && blockToDelete.url) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const token = localStorage.getItem('admin_token');
                await axios.delete(`${apiUrl}/api/admin/delete-blog-image`, {
                    data: { fileUrl: blockToDelete.url },
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error('Failed to delete image from cloud', err);
            }
        }

        setSections(prev => prev.map(sec => ({
            ...sec,
            columns: sec.columns.map(col => ({
                ...col,
                blocks: col.blocks.filter(b => b.id !== blockId)
            }))
        })));
    };

    // --- REORDERING (Drag & Drop) ---
    const reorderBlocks = (activeId, overId) => {
        let sourceCol = null;
        let destCol = null;
        let sourceBlockIndex = -1;
        let destBlockIndex = -1;

        // Clone sections to mutate
        const newSections = JSON.parse(JSON.stringify(sections));

        // Find Source
        for (const sec of newSections) {
            for (const col of sec.columns) {
                const idx = col.blocks.findIndex(b => b.id === activeId);
                if (idx !== -1) {
                    sourceCol = col;
                    sourceBlockIndex = idx;
                    break;
                }
            }
        }

        // Find Destination
        // overId could be a block ID or a column ID
        for (const sec of newSections) {
            for (const col of sec.columns) {
                if (col.id === overId) {
                    destCol = col;
                    destBlockIndex = col.blocks.length; // Append to end
                    break;
                }
                const idx = col.blocks.findIndex(b => b.id === overId);
                if (idx !== -1) {
                    destCol = col;
                    destBlockIndex = idx;
                    break;
                }
            }
        }

        if (sourceCol && destCol) {
            const [movedBlock] = sourceCol.blocks.splice(sourceBlockIndex, 1);
            destCol.blocks.splice(destBlockIndex, 0, movedBlock);
            setSections(newSections);
        }
    };


    const value = {
        sections,
        setSections, // For full resets
        addSection,
        removeSection,
        updateSectionLayout,
        addBlock,
        updateBlock,
        removeBlock,
        reorderBlocks
    };

    return (
        <BuilderContext.Provider value={value}>
            {children}
        </BuilderContext.Provider>
    );
};
