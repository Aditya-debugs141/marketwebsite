'use client';

import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';
import { useState } from 'react';

export function RefreshButton() {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1000); // Visual feedback
    };

    return (
        <button
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh Data"
            disabled={isRefreshing}
        >
            <RefreshCcw className="w-5 h-5" />
        </button>
    );
}
