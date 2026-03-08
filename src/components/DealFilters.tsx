'use client';

import React from 'react';

interface DealFiltersProps {
    currentFilter: string;
    onFilterChange: (filter: string) => void;
}

export const DealFilters: React.FC<DealFiltersProps> = ({ currentFilter, onFilterChange }) => {
    const filters = [
        { id: 'all', label: 'All Deals' },
        { id: 'bullish', label: 'Bullish' },
        { id: 'bearish', label: 'Bearish' },
        { id: 'block', label: 'Block Only' },
        { id: 'bulk', label: 'Bulk Only' },
        { id: 'large', label: '> ₹50Cr' },
    ];

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${currentFilter === filter.id
                            ? 'bg-electric/20 border-electric text-electric shadow-glow-blue'
                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                        }`}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
};
