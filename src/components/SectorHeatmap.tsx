'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';

interface Sector {
    name: string;
    change: number;
    weight: number;
}

export function SectorHeatmap() {
    const { socket } = useSocket();
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!socket) return;

        socket.on('sector_update', (data: Sector[]) => {
            setSectors(data);
            setLoading(false);
        });

        return () => {
            socket.off('sector_update');
        };
    }, [socket]);

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 h-full">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex justify-between items-center">
                <span>Sector Heatmap</span>
                {loading && <span className="text-[10px] text-blue-400 animate-pulse">Live Updating...</span>}
            </h3>

            {loading && sectors.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 h-[200px] animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white/5 rounded-lg"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 h-[200px]">
                    {sectors.map((sector, i) => (
                        <motion.div
                            key={sector.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`rounded-lg p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:brightness-105 active:scale-95
                                ${sector.change >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20'}
                                border
                            `}
                        >
                            <span className="text-[10px] font-bold text-gray-400 tracking-wider truncate" title={sector.name}>
                                {sector.name.replace('NIFTY ', '')}
                            </span>
                            <div className="text-right">
                                <span className={`text-lg font-bold tabular-nums tracking-tight ${(sector.change || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {(sector.change || 0) > 0 ? '+' : ''}{(sector.change || 0).toFixed(2)}%
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
