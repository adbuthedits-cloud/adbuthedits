import { useState, useMemo } from 'react';

export const useSortableData = (items, config = null) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        if (!items) return [];
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                // Support nested properties (e.g., 'user.email')
                const getKey = (obj, path) => path.split('.').reduce((o, i) => (o ? o[i] : null), obj);

                let aKey = getKey(a, sortConfig.key);
                let bKey = getKey(b, sortConfig.key);

                // Handle null/undefined
                if (aKey === null || aKey === undefined) aKey = '';
                if (bKey === null || bKey === undefined) bKey = '';

                if (aKey < bKey) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aKey > bKey) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'ascending'
        ) {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig, setSortConfig };
};
