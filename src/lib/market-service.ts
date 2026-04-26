import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

interface YahooLiteQuote {
    symbol: string;
    shortName?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
    marketCap?: number;
    regularMarketVolume?: number;
}

export interface SectorData {
    name: string;
    change: number;
    weight: number;
    value: number;
}

export interface MarketHierarchy {
    name: string; // Sector Name
    value: number; // Total Market Cap (approx)
    children: StockData[];
}

export interface StockData {
    name: string; // Symbol
    value: number; // Market Cap / Weight
    price: number;
    change: number;
    volume: number;
}

// Hardcoded top Nifty constituents by sector for reliable Heatmap generation
const SECTOR_STOCKS: Record<string, string[]> = {
    'Financials': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
    'Technology': ['TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS'],
    'Energy': ['RELIANCE.NS', 'ONGC.NS', 'POWERGRID.NS', 'NTPC.NS', 'TATAPOWER.NS'],
    'Consumer': ['ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'TITAN.NS'],
    'Automobile': ['TATAMOTORS.NS', 'M&M.NS', 'MARUTI.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS']
};

export async function fetchSectorData(): Promise<SectorData[]> {
    try {
        // Provide standard index values as fallback
        const indexSymbols = ['^NSEI', '^NSEBANK', '^CNXIT'];
        const quotes = await yahooFinance.quote(indexSymbols) as YahooLiteQuote[];

        return quotes.map((q: YahooLiteQuote) => ({
            name: q.shortName || q.symbol,
            change: q.regularMarketChangePercent || 0,
            value: q.regularMarketPrice || 0,
            weight: 10
        }));
    } catch (error) {
        console.error("Error fetching sector data from Yahoo:", error);
        return [];
    }
}

export async function fetchDeepMarketData(): Promise<MarketHierarchy[]> {
    try {
        const results: MarketHierarchy[] = [];
        const allSymbols = Object.values(SECTOR_STOCKS).flat();

        // Single batch request to avoid Rate Limits (429)
        const allQuotes = await yahooFinance.quote(allSymbols) as YahooLiteQuote[];
        const quoteMap = new Map(allQuotes.map(q => [q.symbol, q]));

        for (const [sector, symbols] of Object.entries(SECTOR_STOCKS)) {
            try {
                const quotes = symbols.map(sym => quoteMap.get(sym)).filter((q): q is YahooLiteQuote => q !== undefined);

                const children: StockData[] = quotes.map((s: YahooLiteQuote) => ({
                    name: s.symbol.replace('.NS', ''),
                    value: s.marketCap || (s.regularMarketPrice || 0) * (s.regularMarketVolume || 0),
                    price: s.regularMarketPrice || 0,
                    change: s.regularMarketChangePercent || 0,
                    volume: s.regularMarketVolume || 0
                })).filter((s: StockData) => s.value > 0);

                const topChildren = children.sort((a, b) => b.value - a.value);

                results.push({
                    name: sector,
                    value: topChildren.reduce((acc, c) => acc + c.value, 0),
                    children: topChildren
                });

            } catch (err) {
                console.error(`Failed to fetch constituents for ${sector}:`, err);
            }
        }

        console.log(`[DEBUG] Deep Market Data Fetched from Yahoo: ${results.length} sectors`);
        return results;
    } catch (error) {
        console.error("Error fetching deep market data:", error);
        return [];
    }
}
