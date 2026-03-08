'use client';

import React, { useState, useEffect, memo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useSocket } from '@/hooks/use-socket';

interface StockData {
    name: string;
    value: number;
    price: number;
    change: number;
    volume: number;
}

interface MarketHierarchy {
    name: string;
    value: number;
    children: StockData[];
}

// Custom specialized Treemap Cell
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedContent = (props: any) => {
    const { depth, x, y, width, height, index, name, change, price } = props;

    // Failsafe for uncalculated zero-width blocks
    if (width == null || height == null || width <= 0 || height <= 0) return null;

    if (depth === 1) {
        // Sector Level - Draw a boundary
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: 'rgba(0,0,0,0.4)',
                        stroke: 'rgba(255,255,255,0.1)',
                        strokeWidth: 2,
                    }}
                    rx={4}
                    ry={4}
                />
                <text x={x + 6} y={y + 16} fill="rgba(255,255,255,0.7)" fontSize={13} fontWeight="bold" style={{ textShadow: "1px 1px 2px black" }}>
                    {name}
                </text>
            </g>
        );
    }

    if (depth === 2) {
        // Stock Level - Draw the heat block
        const isPositive = change > 0;
        const color = isPositive ? '#00FF88' : '#f43f5e'; // premium neon green and rose

        // Only render text if the block is big enough
        const showText = width > 45 && height > 35;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: color,
                        stroke: 'rgba(0,0,0,0.8)',
                        strokeWidth: 1.5,
                        opacity: 0.9,
                        cursor: 'pointer'
                    }}
                    rx={2}
                    ry={2}
                    onClick={() => {
                        window.open(`https://in.tradingview.com/chart/?symbol=NSE:${name}`, '_blank');
                    }}
                />
                {showText && (
                    <>
                        <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={13} fontWeight="bold" dominantBaseline="middle" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                            {name}
                        </text>
                        <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="#fff" fontSize={11} dominantBaseline="middle" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                            {change > 0 ? '+' : ''}{change?.toFixed(2)}%
                        </text>
                    </>
                )}
            </g>
        );
    }
    return null;
};

// Custom Tooltip for hovering over the tiny blocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        // Ensure tooltip only shows for inner stock nodes
        if (data.depth !== 2) return null;

        return (
            <div className="glass-panel p-4 rounded-xl shadow-2xl text-white z-50 min-w-[150px]">
                <p className="font-bold text-xl mb-1 border-b border-white/10 pb-2 flex justify-between items-center">
                    {data.name}
                    <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-white/10 rounded">NSE</span>
                </p>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-sm font-mono">₹{(data.price || 0).toFixed(2)}</span>
                    <span className={data.change >= 0 ? 'text-neon font-bold ml-4 text-lg drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'text-rose-400 font-bold ml-4 text-lg drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'}>
                        {data.change >= 0 ? '▲' : '▼'} {Math.abs(data.change || 0).toFixed(2)}%
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

function MarketHeatmap() {
    const { socket } = useSocket();
    const [data, setData] = useState<MarketHierarchy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!socket) return;

        socket.on('heatmap_update', (incomingData: MarketHierarchy[]) => {
            if (incomingData && incomingData.length > 0) {
                setData(incomingData);
                setLoading(false);
            }
        });

        return () => {
            socket.off('heatmap_update');
        };
    }, [socket]);

    const formattedData = {
        name: 'Indian Market',
        value: data.reduce((acc, curr) => acc + (curr.value || 0), 0),
        children: data
    };

    return (
        <div className="w-full glass-panel flex flex-col h-[600px] lg:h-[700px] p-5">

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-bold text-xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-electric shadow-glow-blue animate-pulse-slow"></span>
                    Market Sectors Heatmap
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-electric/70 hidden sm:inline-block font-mono bg-electric/10 px-2 py-1 rounded">Interactive Tracker</span>
                    {loading && <span className="text-electric text-sm animate-pulse font-semibold border border-electric/30 px-3 py-1 rounded-full bg-electric/10 shadow-glow-blue">Scanning Live NSE Data...</span>}
                </div>
            </div>

            <div className="flex-1 w-full h-full relative border border-white/10 rounded-lg overflow-hidden bg-[#0d1117] p-1">
                {!loading && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={[formattedData]}
                            dataKey="value"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomizedContent />}
                            isAnimationActive={false}
                        >
                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 100 }} />
                        </Treemap>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-gray-400 animate-pulse font-semibold">Compiling Indian Market Structure...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(MarketHeatmap);
