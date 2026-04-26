import { fetchDeepMarketData, MarketHierarchy } from '@/lib/market-service';
import { fetchNseHeatmapData } from '@/lib/nse-heatmap-service';
import { AngelOneService } from './angel-one-service';

type HeatmapSource = 'angel' | 'nse' | 'yahoo' | 'cache' | 'cache-stale' | 'none';

interface HeatmapResult {
    data: MarketHierarchy[];
    source: HeatmapSource;
    stale: boolean;
}

interface ProviderResult {
    source: 'angel' | 'nse' | 'yahoo';
    data: MarketHierarchy[];
}

const HEATMAP_CACHE_TTL_MS = 12_000;
const ANGEL_TIMEOUT_MS = 1_800;
const NSE_TIMEOUT_MS = 2_200;
const YAHOO_TIMEOUT_MS = 3_500;

const angelService = new AngelOneService();

let cachedData: MarketHierarchy[] = [];
let cacheTime = 0;
let inFlight: Promise<ProviderResult | null> | null = null;

function isValidHeatmap(data: unknown): data is MarketHierarchy[] {
    return Array.isArray(data) && data.length > 0;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

function firstNonEmptyProvider(promises: Array<Promise<ProviderResult>>): Promise<ProviderResult | null> {
    return new Promise((resolve) => {
        let pending = promises.length;
        let settled = false;

        for (const promise of promises) {
            promise
                .then((result) => {
                    if (settled) return;

                    if (isValidHeatmap(result.data)) {
                        settled = true;
                        resolve(result);
                        return;
                    }

                    pending -= 1;
                    if (pending === 0 && !settled) {
                        settled = true;
                        resolve(null);
                    }
                })
                .catch(() => {
                    pending -= 1;
                    if (pending === 0 && !settled) {
                        settled = true;
                        resolve(null);
                    }
                });
        }
    });
}

async function fetchFromProviders(): Promise<ProviderResult | null> {
    const angelPromise = withTimeout(angelService.getHeatmapData(), ANGEL_TIMEOUT_MS, 'Angel heatmap')
        .then((data) => ({ source: 'angel' as const, data }))
        .catch(() => ({ source: 'angel' as const, data: [] }));

    const yahooPromise = withTimeout(fetchDeepMarketData(), YAHOO_TIMEOUT_MS, 'Yahoo heatmap')
        .then((data) => ({ source: 'yahoo' as const, data }))
        .catch(() => ({ source: 'yahoo' as const, data: [] }));

    const nsePromise = withTimeout(fetchNseHeatmapData(), NSE_TIMEOUT_MS, 'NSE heatmap')
        .then((data) => ({ source: 'nse' as const, data }))
        .catch(() => ({ source: 'nse' as const, data: [] }));

    return firstNonEmptyProvider([angelPromise, nsePromise, yahooPromise]);
}

export async function getFastHeatmapData(options?: { forceRefresh?: boolean; allowStaleWhileRefreshing?: boolean }): Promise<HeatmapResult> {
    const now = Date.now();
    const forceRefresh = options?.forceRefresh === true;
    const allowStaleWhileRefreshing = options?.allowStaleWhileRefreshing !== false;

    if (!forceRefresh && cachedData.length > 0 && now - cacheTime < HEATMAP_CACHE_TTL_MS) {
        return { data: cachedData, source: 'cache', stale: false };
    }

    if (inFlight) {
        if (allowStaleWhileRefreshing && cachedData.length > 0) {
            return { data: cachedData, source: 'cache-stale', stale: true };
        }

        const pending = await inFlight;
        if (pending?.data?.length) {
            return { data: pending.data, source: pending.source, stale: false };
        }

        if (cachedData.length > 0) {
            return { data: cachedData, source: 'cache-stale', stale: true };
        }

        return { data: [], source: 'none', stale: true };
    }

    inFlight = fetchFromProviders();

    try {
        const providerResult = await inFlight;

        if (providerResult && providerResult.data.length > 0) {
            cachedData = providerResult.data;
            cacheTime = Date.now();
            return {
                data: providerResult.data,
                source: providerResult.source,
                stale: false
            };
        }

        if (cachedData.length > 0) {
            return { data: cachedData, source: 'cache-stale', stale: true };
        }

        return { data: [], source: 'none', stale: true };
    } finally {
        inFlight = null;
    }
}
