import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
const symbolLookupCache = new Map<string, string | null>();

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
    consensusRating?: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    recommendationMean?: number;
    analystCount?: number;
    targetConsensusScore?: number; // 0-100 reliability based on coverage + dispersion
    predictedDirection?: 'Bullish' | 'Bearish' | 'Neutral';
    predictionConfidence?: number; // 0-100
}

function mapRecommendationMeanToConsensus(mean?: number): StockPrice['consensusRating'] {
    if (mean === undefined || Number.isNaN(mean)) return undefined;
    if (mean <= 1.5) return 'STRONG_BUY';
    if (mean <= 2.25) return 'BUY';
    if (mean <= 3.0) return 'HOLD';
    if (mean <= 3.75) return 'SELL';
    return 'STRONG_SELL';
}

function toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return undefined;
}

function getPredictionDirection(
    consensus: StockPrice['consensusRating'],
    upside?: number
): StockPrice['predictedDirection'] {
    if (upside === undefined) {
        if (consensus === 'STRONG_BUY' || consensus === 'BUY') return 'Bullish';
        if (consensus === 'STRONG_SELL' || consensus === 'SELL') return 'Bearish';
        return 'Neutral';
    }

    if (upside >= 8 || consensus === 'STRONG_BUY') return 'Bullish';
    if (upside <= -8 || consensus === 'STRONG_SELL') return 'Bearish';
    return 'Neutral';
}

function calcPredictionConfidence(
    consensus: StockPrice['consensusRating'],
    recommendationMean: number | undefined,
    upside: number | undefined,
    analystCount: number | undefined,
    targetHigh: number | undefined,
    targetLow: number | undefined,
    targetMean: number | undefined
): number | undefined {
    if (!consensus && upside === undefined && !analystCount) return undefined;

    const coverageScore = analystCount ? Math.min(analystCount / 20, 1) : 0.3;
    const consensusStrength = recommendationMean !== undefined
        ? Math.min(Math.abs(3 - recommendationMean) / 2, 1)
        : (consensus === 'HOLD' ? 0.3 : 0.6);
    const upsideStrength = upside !== undefined ? Math.min(Math.abs(upside) / 20, 1) : 0.3;

    let dispersionScore = 0.6;
    if (targetHigh !== undefined && targetLow !== undefined && targetMean && targetMean > 0) {
        const spread = Math.abs(targetHigh - targetLow) / targetMean;
        dispersionScore = Math.max(0, 1 - Math.min(spread, 1));
    }

    const confidence = (0.35 * coverageScore) + (0.3 * consensusStrength) + (0.2 * upsideStrength) + (0.15 * dispersionScore);
    return Math.round(confidence * 100);
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
            ? yahooFinance.quoteSummary(formattedSymbol, { modules: ['financialData', 'recommendationTrend'] }).catch(e => {
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
        let recommendationMean: number | undefined;
        let analystCount: number | undefined;
        let targetHigh: number | undefined;
        let targetLow: number | undefined;
        let consensusRating: StockPrice['consensusRating'];
        let targetConsensusScore: number | undefined;
        let predictedDirection: StockPrice['predictedDirection'];
        let predictionConfidence: number | undefined;

        if (summary) {
            const financialData = (summary as { financialData?: Record<string, unknown> }).financialData;
            const recommendationTrend = (summary as { recommendationTrend?: { trend?: Array<Record<string, unknown>> } }).recommendationTrend;

            targetPrice = toNumber(financialData?.targetMeanPrice);
            recommendation = typeof financialData?.recommendationKey === 'string' ? String(financialData.recommendationKey) : undefined;
            recommendationMean = toNumber(financialData?.recommendationMean);
            analystCount = toNumber(financialData?.numberOfAnalystOpinions);
            targetHigh = toNumber(financialData?.targetHighPrice);
            targetLow = toNumber(financialData?.targetLowPrice);

            if (recommendationMean === undefined) {
                const firstTrend = recommendationTrend?.trend?.[0] || {};
                const strongBuy = toNumber(firstTrend.strongBuy) || 0;
                const buy = toNumber(firstTrend.buy) || 0;
                const hold = toNumber(firstTrend.hold) || 0;
                const sell = toNumber(firstTrend.sell) || 0;
                const strongSell = toNumber(firstTrend.strongSell) || 0;
                const total = strongBuy + buy + hold + sell + strongSell;
                if (total > 0) {
                    recommendationMean = (
                        (1 * strongBuy) +
                        (2 * buy) +
                        (3 * hold) +
                        (4 * sell) +
                        (5 * strongSell)
                    ) / total;
                    analystCount = analystCount ?? total;
                }
            }

            console.log(`Fetched Data for ${formattedSymbol}: Price=${stockQuote.regularMarketPrice}, Target=${targetPrice}`);

            if (targetPrice && stockQuote.regularMarketPrice) {
                potentialUpside = ((targetPrice - stockQuote.regularMarketPrice) / stockQuote.regularMarketPrice) * 100;
            }

            consensusRating = mapRecommendationMeanToConsensus(recommendationMean);
            predictedDirection = getPredictionDirection(consensusRating, potentialUpside);
            predictionConfidence = calcPredictionConfidence(
                consensusRating,
                recommendationMean,
                potentialUpside,
                analystCount,
                targetHigh,
                targetLow,
                targetPrice
            );

            if (analystCount !== undefined) {
                const coverageScore = Math.min(analystCount / 20, 1);
                let dispersionScore = 0.6;
                if (targetHigh !== undefined && targetLow !== undefined && targetPrice && targetPrice > 0) {
                    const spread = Math.abs(targetHigh - targetLow) / targetPrice;
                    dispersionScore = Math.max(0, 1 - Math.min(spread, 1));
                }
                targetConsensusScore = Math.round(((0.6 * coverageScore) + (0.4 * dispersionScore)) * 100);
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
            recommendation,
            consensusRating,
            recommendationMean,
            analystCount,
            targetConsensusScore,
            predictedDirection,
            predictionConfidence
        };
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return null; // Return null gracefully so UI can still render without stock data
    }
}

export async function resolveIndianTicker(query: string): Promise<string | null> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return null;

    if (symbolLookupCache.has(normalized)) {
        return symbolLookupCache.get(normalized) || null;
    }

    try {
        const result = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 }) as {
            quotes?: Array<{
                symbol?: string;
                exchange?: string;
                exchDisp?: string;
            }>;
        };

        const quotes = result?.quotes || [];
        const preferred = quotes.find((q) => {
            const symbol = (q.symbol || '').toUpperCase();
            const exchange = (q.exchange || '').toUpperCase();
            const exchDisp = (q.exchDisp || '').toUpperCase();

            return symbol.endsWith('.NS') ||
                symbol.endsWith('.BO') ||
                exchange.includes('NSE') ||
                exchange.includes('BSE') ||
                exchDisp.includes('NSE') ||
                exchDisp.includes('BSE');
        });

        const rawSymbol = preferred?.symbol?.toUpperCase() || '';
        let resolved: string | null = null;

        if (rawSymbol.endsWith('.NS') || rawSymbol.endsWith('.BO')) {
            resolved = rawSymbol.replace(/\.(NS|BO)$/i, '');
        } else if (/^[A-Z][A-Z0-9&-]{1,19}$/.test(rawSymbol)) {
            resolved = rawSymbol;
        }

        symbolLookupCache.set(normalized, resolved);
        return resolved;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Symbol resolution failed for "${query}": ${message}`);
        symbolLookupCache.set(normalized, null);
        return null;
    }
}

export async function getMarketIndices(): Promise<StockPrice[]> {
    // Added Stocks to ensure ticker isn't empty if indices fail
    const symbols = ['^NSEI', '^BSESN', 'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS'];
    const promises = symbols.map(s => getStockPrice(s));
    const results = await Promise.all(promises);
    return results.filter((r): r is StockPrice => r !== null);
}
