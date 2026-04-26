import { NextResponse } from 'next/server';
import { fetchDeepMarketData, MarketHierarchy } from '@/lib/market-service';
import { fetchNseHeatmapData } from '@/lib/nse-heatmap-service';

// Fallback dummy data (shown when Yahoo Finance is rate-limited)
const FALLBACK_DATA = [
    {
        name: "BANK",
        value: 42000,
        children: [
            { name: "HDFCBANK", value: 8000, price: 1620, change: 0.8, volume: 42000000 },
            { name: "ICICIBANK", value: 7000, price: 1250, change: 1.2, volume: 35000000 },
            { name: "KOTAKBANK", value: 6000, price: 1950, change: -0.4, volume: 18000000 },
            { name: "AXISBANK", value: 5000, price: 1180, change: 0.6, volume: 25000000 },
            { name: "SBIN", value: 5000, price: 780, change: 1.5, volume: 60000000 },
        ]
    },
    {
        name: "IT",
        value: 35000,
        children: [
            { name: "TCS", value: 10000, price: 4250, change: 0.3, volume: 8000000 },
            { name: "INFY", value: 8000, price: 1620, change: -0.7, volume: 18000000 },
            { name: "WIPRO", value: 6000, price: 560, change: 1.1, volume: 22000000 },
            { name: "HCLTECH", value: 5000, price: 1890, change: 0.9, volume: 10000000 },
            { name: "TECHM", value: 4000, price: 1470, change: -0.3, volume: 9000000 },
        ]
    },
    {
        name: "AUTO",
        value: 30000,
        children: [
            { name: "MARUTI", value: 8000, price: 12800, change: 1.4, volume: 3000000 },
            { name: "TATAMOTORS", value: 7000, price: 890, change: 2.1, volume: 28000000 },
            { name: "M&M", value: 6000, price: 3150, change: 0.5, volume: 7000000 },
            { name: "BAJAJ-AUTO", value: 5000, price: 9800, change: -0.8, volume: 4000000 },
        ]
    },
    {
        name: "PHARMA",
        value: 25000,
        children: [
            { name: "SUNPHARMA", value: 7000, price: 1750, change: 0.6, volume: 9000000 },
            { name: "DRREDDY", value: 6000, price: 6800, change: -1.2, volume: 4000000 },
            { name: "CIPLA", value: 5000, price: 1550, change: 0.9, volume: 7000000 },
            { name: "DIVISLAB", value: 4000, price: 5200, change: 1.8, volume: 3000000 },
        ]
    },
    {
        name: "ENERGY",
        value: 28000,
        children: [
            { name: "RELIANCE", value: 10000, price: 2950, change: 0.4, volume: 18000000 },
            { name: "ONGC", value: 6000, price: 265, change: -0.6, volume: 35000000 },
            { name: "NTPC", value: 5000, price: 355, change: 1.2, volume: 28000000 },
            { name: "POWERGRID", value: 4000, price: 310, change: 0.7, volume: 20000000 },
        ]
    },
];

let cachedData: MarketHierarchy[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min
let inFlightHeatmapFetch: Promise<{ data: MarketHierarchy[]; source: 'nse' | 'yahoo' | 'fallback' }> | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((e) => {
                clearTimeout(timer);
                reject(e);
            });
    });
}

async function getFastApiHeatmap(): Promise<{ data: MarketHierarchy[]; source: 'nse' | 'yahoo' | 'fallback' }> {
    if (inFlightHeatmapFetch) {
        return inFlightHeatmapFetch;
    }

    const nsePromise = withTimeout(fetchNseHeatmapData(), 2200).catch(() => [] as MarketHierarchy[]);
    const yahooPromise = withTimeout(fetchDeepMarketData(), 3500).catch(() => [] as MarketHierarchy[]);

    inFlightHeatmapFetch = (async () => {
        const [nseData, yahooData] = await Promise.all([nsePromise, yahooPromise]);

        if (Array.isArray(nseData) && nseData.length > 0) {
            return { data: nseData, source: 'nse' as const };
        }

        if (Array.isArray(yahooData) && yahooData.length > 0) {
            return { data: yahooData, source: 'yahoo' as const };
        }

        return { data: FALLBACK_DATA, source: 'fallback' as const };
    })().finally(() => {
        inFlightHeatmapFetch = null;
    });

    return inFlightHeatmapFetch;
}

export async function GET() {
    // Fast path: fresh cache
    if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
        return NextResponse.json({
            data: cachedData,
            source: 'cache',
            stale: false
        });
    }

    try {
        const result = await getFastApiHeatmap();

        if (result.source !== 'fallback' && result.data.length > 0) {
            cachedData = result.data;
            cacheTime = Date.now();
        }

        return NextResponse.json({
            data: result.data,
            source: result.source,
            stale: result.source === 'fallback'
        });
    } catch (e) {
        console.error('[API/heatmap] failed:', e);

        if (cachedData && cachedData.length > 0) {
            return NextResponse.json({
                data: cachedData,
                source: 'stale-cache',
                stale: true,
                warning: e instanceof Error ? e.message : 'Failed to refresh heatmap'
            });
        }
    }

    // Fallback to dummy data
    return NextResponse.json({ data: FALLBACK_DATA, source: 'fallback', stale: true });
}
