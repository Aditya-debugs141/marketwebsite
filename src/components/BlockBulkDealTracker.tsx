'use client';

import React, { useEffect, useState } from 'react';
import { DealDataProps, DealCard } from './DealCard';
import { DealFilters } from './DealFilters';
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react';

export const BlockBulkDealTracker = () => {
    const [deals, setDeals] = useState<DealDataProps['deal'][]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    const fetchDeals = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/deals');
            const data = await res.json();
            if (data.success) {
                setDeals(data.deals);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error("Failed to fetch deals", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchDeals();
        // Refresh every 10 seconds for real-time feel
        const interval = setInterval(fetchDeals, 10 * 1000);
        return () => clearInterval(interval);
    }, []);

    const filteredDeals = deals.filter(deal => {
        if (filter === 'all') return true;
        if (filter === 'bullish') return deal.sentiment.sentiment.includes('Bullish');
        if (filter === 'bearish') return deal.sentiment.sentiment.includes('Bearish');
        if (filter === 'block') return deal.dealType === 'Block';
        if (filter === 'bulk') return deal.dealType === 'Bulk';
        if (filter === 'large') return deal.valueCr > 50;
        return true;
    });

    const alerts = deals.filter(d => d.alert); // Highest priority smart alerts

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Activity className="text-electric" /> Block & Bulk Tracker
                </h2>
                <button
                    onClick={fetchDeals}
                    disabled={loading}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    {mounted ? (lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...') : 'Loading...'}
                </button>
            </div>

            {/* Smart Alerts Banner */}
            {alerts.length > 0 && filter === 'all' && (
                <div className="mb-2 max-h-40 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent">
                    {alerts.map((a, i) => (
                        <div key={i} className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-yellow-500">⚡ ALERT</p>
                                <p className="text-xs text-gray-300 mt-1">{a.alert}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DealFilters currentFilter={filter} onFilterChange={setFilter} />

            <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col min-h-[500px] max-h-[700px]">
                {loading && deals.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-electric border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {filteredDeals.length > 0 ? (
                            filteredDeals.map(deal => (
                                <DealCard key={deal.id} deal={deal} />
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No deals match this filter.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
