import { createContext, useState, useCallback } from 'react';

export const FilterContext = createContext();

const initialFilters = {
    search: '',
    status: '',
    priority: '',
    type: '',
    assignee: ''
};

export const FilterProvider = ({ children }) => {
    const [filters, setFilters] = useState(initialFilters);

    const resetFilters = useCallback(() => {
        setFilters(initialFilters);
    }, []);

    return (
        <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
            {children}
        </FilterContext.Provider>
    );
};