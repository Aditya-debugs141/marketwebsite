import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

// Define a local interface for the expected Yahoo Finance response
// preventing deep import issues with the library
interface YahooQuote {
    symbol: string;
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    currency?: string;
}

export interface StockPrice {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    targetPrice?: number;
    potentialUpside?: number; // Percentage
    recommendation?: string;
}

export async function getStockPrice(symbol: string): Promise<StockPrice | null> {
    try {
        // Ensure symbol has .NS (NSE) or .BO (BSE) suffix if not present
        // Defaulting to NSE for Indian stocks
        // SKip indices which start with ^
        const formattedSymbol = symbol.startsWith('^') || symbol.endsWith('.NS') || symbol.endsWith('.BO')
            ? symbol
            : `${symbol}.NS`;

        // Fetch both quote (for real-time price) and financialData (for target price)
        // Indices (starting with ^) don't have financialData/targets, so skip for them
        const isIndex = formattedSymbol.startsWith('^');

        // Fetch both quote and summary safely
        const quotePromise = yahooFinance.quote(formattedSymbol).catch(e => {
            console.warn(`Failed to fetch quote for ${formattedSymbol}: ${e.message}`);
            return null;
        });

        const summaryPromise = !isIndex
            ? yahooFinance.quoteSummary(formattedSymbol, { modules: ['financialData'] }).catch(e => {
                console.warn(`Failed to fetch summary for ${formattedSymbol}: ${e.message}`);
                return null;
            })
            : Promise.resolve(null);

        const [quote, summary] = await Promise.all([quotePromise, summaryPromise]);

        // console.log(`[${new Date().toISOString()}] Fetched ${formattedSymbol}`);

        if (!quote) return null;

        // Yahoo Finance 2 types can be tricky, safe casting
        // We expect a Quote object with price-related properties
        const stockQuote = quote as unknown as YahooQuote;

        let targetPrice: number | undefined;
        let recommendation: string | undefined;
        let potentialUpside: number | undefined;

        if (summary) {
            targetPrice = summary.financialData?.targetMeanPrice;
            recommendation = summary.financialData?.recommendationKey;

            console.log(`Fetched Data for ${formattedSymbol}: Price=${stockQuote.regularMarketPrice}, Target=${targetPrice}`);

            if (targetPrice && stockQuote.regularMarketPrice) {
                potentialUpside = ((targetPrice - stockQuote.regularMarketPrice) / stockQuote.regularMarketPrice) * 100;
            }
        }

        return {
            symbol: stockQuote.symbol,
            price: stockQuote.regularMarketPrice || 0,
            change: stockQuote.regularMarketChange || 0,
            changePercent: stockQuote.regularMarketChangePercent || 0,
            currency: stockQuote.currency || 'INR',
            targetPrice,
            potentialUpside,
            recommendation
        };
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return null; // Return null gracefully so UI can still render without stock data
    }
}

export async function getMarketIndices(): Promise<StockPrice[]> {
    // Added Stocks to ensure ticker isn't empty if indices fail
    const symbols = ['^NSEI', '^BSESN', 'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS'];
    const promises = symbols.map(s => getStockPrice(s));
    const results = await Promise.all(promises);
    return results.filter((r): r is StockPrice => r !== null);
}
