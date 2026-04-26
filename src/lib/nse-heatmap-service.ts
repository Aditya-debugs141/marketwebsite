import type { MarketHierarchy, StockData } from './market-service';

interface NseIndexStock {
    symbol?: string;
    pChange?: number;
    lastPrice?: number;
    totalTradedValue?: number;
}

const NSE_SECTOR_INDICES: Record<string, string> = {
    Financials: 'NIFTY BANK',
    Technology: 'NIFTY IT',
    Energy: 'NIFTY ENERGY',
    Consumer: 'NIFTY FMCG',
    Automobile: 'NIFTY AUTO'
};

function toStockData(row: NseIndexStock): StockData | null {
    if (!row.symbol) return null;

    const price = typeof row.lastPrice === 'number' && Number.isFinite(row.lastPrice) ? row.lastPrice : 0;
    const change = typeof row.pChange === 'number' && Number.isFinite(row.pChange) ? row.pChange : 0;
    const tradedValue = typeof row.totalTradedValue === 'number' && Number.isFinite(row.totalTradedValue) ? row.totalTradedValue : 0;

    const safePrice = Math.max(price, 1);
    const value = tradedValue > 0 ? tradedValue : safePrice * 1000;

    return {
        name: row.symbol,
        value,
        price,
        change,
        volume: 0
    };
}

export async function fetchNseHeatmapData(): Promise<MarketHierarchy[]> {
    const sectors: MarketHierarchy[] = [];

    for (const [sectorName, indexName] of Object.entries(NSE_SECTOR_INDICES)) {
        try {
            const endpoint = `https://www.nseindia.com/api/equity-stockIndices?index=${encodeURIComponent(indexName)}`;
            const response = await fetch(endpoint, {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'referer': 'https://www.nseindia.com/',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                continue;
            }

            const payload = await response.json() as { data?: NseIndexStock[] };

            const rows = Array.isArray(payload?.data) ? payload.data : [];
            const children = rows
                .map(toStockData)
                .filter((x): x is StockData => Boolean(x))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);

            if (children.length === 0) continue;

            sectors.push({
                name: sectorName,
                value: children.reduce((acc, child) => acc + child.value, 0),
                children
            });
        } catch {
            // Keep provider resilient; failure on one sector should not fail all.
            continue;
        }
    }

    return sectors;
}
