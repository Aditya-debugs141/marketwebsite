'use client';

import { StockPrice } from '@/lib/stock-service';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useSocket } from '@/hooks/use-socket';
import { useEffect, useState } from 'react';

interface MarketTickerProps {
    indices: StockPrice[];
}

export function MarketTicker({ indices }: MarketTickerProps) {
    const { socket } = useSocket();
    const [liveIndices, setLiveIndices] = useState(indices);

    useEffect(() => {
        if (!socket) return;

        socket.on('price_update', (data: { symbol: string, price: string }) => {
            setLiveIndices(prev => prev.map(item => {
                // Approximate matching for Demo purposes
                // Ideally, backend sends full object or we fetch it
                if (item.symbol === data.symbol || (item.symbol === '^NSEI' && data.symbol === '^NSEI')) {
                    const newPrice = parseFloat(data.price);
                    // Simple change calc if not provided

                    return {
                        ...item,
                        price: newPrice,
                        // change: change, // Update change if we had reference
                    };
                }
                return item;
            }));
        });

        return () => {
            socket.off('price_update');
        };
    }, [socket]);

    // Helper to format names
    const getDisplayName = (symbol: string) => {
        if (symbol === '^NSEI') return 'NIFTY 50';
        if (symbol === '^BSESN') return 'SENSEX';
        if (symbol === 'NIFTY_BANK') return 'BANK NIFTY';
        return symbol.replace('.NS', '').replace('.BO', '');
    };

    // Quadruple the list to ensure seamless looping for larger screens
    const duplicatedIndices = [...liveIndices, ...liveIndices, ...liveIndices, ...liveIndices];

    return (
        <div className="w-full bg-[#0a0a0a] border-b border-white/5 overflow-hidden py-2.5 z-50 relative">
            {/* Gradient Masks for smooth fade in/out */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>

            <motion.div
                className="flex gap-12 whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 40, // Slower, smoother scroll
                }}
            >
                {duplicatedIndices.map((index, i) => (
                    <div key={`${index.symbol}-${i}`} className="flex items-center gap-3 text-sm font-medium tabular-nums shrink-0">
                        <span className="text-gray-400 tracking-wide font-semibold text-xs uppercase">
                            {getDisplayName(index.symbol)}
                        </span>

                        <div className="flex items-center gap-2">
                            <span className="text-gray-200">
                                {index.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                            <span className={`flex items-center text-xs ml-1 ${index.change >= 0 ? 'text-neon drop-shadow-[0_0_5px_rgba(0,255,136,0.3)]' : 'text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]'}`}>
                                {index.change >= 0 ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                                {Math.abs(index.changePercent).toFixed(2)}%
                            </span>
                        </div>

                        {/* Separator dot */}
                        <div className="w-1 h-1 rounded-full bg-white/10 ml-4"></div>
                    </div>
                ))}

                {indices.length === 0 && (
                    <div className="text-gray-500 italic pl-10">Waiting for market data...</div>
                )}
            </motion.div>
        </div>
    );
}
