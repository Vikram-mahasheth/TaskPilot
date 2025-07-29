import { createContext, useState, useCallback } from 'react';

export const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        priority: ''
    });

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({ search: '', status: '', priority: '' });
    }, []);

    return (
        <FilterContext.Provider value={{ filters, updateFilter, resetFilters }}>
            {children}
        </FilterContext.Provider>
    );
};