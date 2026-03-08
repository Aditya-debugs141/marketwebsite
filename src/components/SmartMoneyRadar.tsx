'use client';

import React, { useEffect, useState } from 'react';
import { Target, TrendingUp } from 'lucide-react';

interface RadarItem {
    ticker: string;
    totalBuyingCr: number;
    sentiment: string;
    dealsCount: number;
}

export const SmartMoneyRadar = () => {
    const [radar, setRadar] = useState<RadarItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRadar = async () => {
            try {
                const res = await fetch('/api/radar');
                const data = await res.json();
                if (data.success) {
                    setRadar(data.radar);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRadar();
        // Refresh every 10 seconds for real-time tracking
        const interval = setInterval(fetchRadar, 10 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading && radar.length === 0) {
        return <div className="animate-pulse bg-white/5 h-40 rounded-xl mt-6"></div>;
    }

    if (radar.length === 0) {
        return null; // Return nothing if no accumulation found yet to save space.
    }

    return (
        <div className="mt-8 p-5 bg-gradient-to-br from-electric/10 to-transparent border border-electric/20 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-electric/20 blur-3xl rounded-full" />

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <Target className="w-5 h-5 text-electric" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Smart Money Radar</h3>
                <span className="ml-2 text-[10px] bg-electric/20 text-electric px-2 py-0.5 rounded font-bold uppercase">Daily Accumulation</span>
            </div>

            <div className="space-y-3 relative z-10">
                {radar.map((item, index) => (
                    <div key={item.ticker} className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-mono font-bold text-sm">{(index + 1).toString().padStart(2, '0')}</span>
                            <div>
                                <p className="text-white font-bold">{item.ticker}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.sentiment === 'Super Bullish' ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-300'
                                        }`}>
                                        {item.sentiment}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">{item.dealsCount} deals</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-electric font-bold flex items-center justify-end gap-1">
                                <TrendingUp className="w-3 h-3" />
                                ₹{item.totalBuyingCr.toFixed(0)}Cr
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase mt-0.5">Buying Impact</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
