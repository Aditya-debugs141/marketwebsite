import { fetchSimulatedDeals } from '../data-sources/simulated-deals';
import { dealCache, DealData } from '../cache/deal-cache';
import { calculateImpactScore, ImpactResult } from './impact-engine';
import { analyzeDealSentiment, DealSentimentResult } from './deal-sentiment-rules';
import { getStockPrice } from '../../lib/stock-service';

export interface ProcessedDeal extends DealData {
    impact: ImpactResult;
    sentiment: DealSentimentResult;
    alert?: string;
    cmp?: number;
    cmpChangePercent?: number;
}

export interface RadarData {
    ticker: string;
    totalBuyingCr: number;
    sentiment: string;
    dealsCount: number;
}

class DealEngine {
    private static instance: DealEngine;
    private isFetching = false;
    private liveQuoteCache = new Map<string, { price: number; changePercent: number; ts: number }>();
    private inFlightQuotePromises = new Map<string, Promise<{ price: number; changePercent: number } | null>>();
    private readonly quoteCacheTtlMs = 20_000;
    private angelOneService: any = null;

    private constructor() { 
        this.initAngelOneService();
    }

    private async initAngelOneService() {
        try {
            const { AngelOneService } = await import('../angel-one-service');
            this.angelOneService = new AngelOneService();
            console.log('✅ AngelOne service initialized for real-time pricing');
        } catch (error) {
            console.warn('⚠️ AngelOne service failed to initialize:', error);
        }
    }

    public static getInstance() {
        if (!DealEngine.instance) {
            DealEngine.instance = new DealEngine();
        }
        return DealEngine.instance;
    }

    public async refreshDeals(): Promise<ProcessedDeal[]> {
        if (this.isFetching) return this.getProcessedFeed();
        this.isFetching = true;

        try {
            // Fetch from data sources
            // Rely exclusively on the authentic MoneyControl Python Scraper
            const allRaw = await fetchSimulatedDeals();

            // Assign IDs (Hashes)
            const newDeals: DealData[] = allRaw.map(d => ({
                ...d,
                id: dealCache.generateHash(d.ticker, d.price, d.quantity, d.buyer, d.seller, d.timestamp)
            }));

            // Deduplicate via cache
            dealCache.addDeals(newDeals);

            return await this.getProcessedFeed();
        } catch (e) {
            console.error("Error refreshing deals:", e);
            return await this.getProcessedFeed();
        } finally {
            this.isFetching = false;
        }
    }

    private async getLiveQuote(ticker: string): Promise<{ price: number; changePercent: number } | null> {
        const now = Date.now();
        const cached = this.liveQuoteCache.get(ticker);

        if (cached && now - cached.ts < this.quoteCacheTtlMs) {
            return { price: cached.price, changePercent: cached.changePercent };
        }

        const inFlight = this.inFlightQuotePromises.get(ticker);
        if (inFlight) return inFlight;

        const quotePromise = (async () => {
            try {
                // Try AngelOne first for real-time NSE data (if available)
                if (this.angelOneService) {
                    try {
                        const angelData = await this.angelOneService.getStockLtp(ticker);
                        if (angelData) {
                            console.log(`✅ AngelOne real-time: ${ticker} = ₹${angelData.price}`);
                            const payload = {
                                price: angelData.price,
                                changePercent: angelData.changePercent
                            };
                            this.liveQuoteCache.set(ticker, { ...payload, ts: Date.now() });
                            return payload;
                        }
                    } catch (angelError) {
                        console.warn(`AngelOne failed for ${ticker}:`, angelError);
                    }
                }

                // Fallback to Yahoo Finance via stock service
                console.log(`📊 Using stock service fallback for ${ticker}`);
                const live = await getStockPrice(ticker);
                if (!live) return null;

                const payload = {
                    price: live.price,
                    changePercent: live.changePercent
                };

                this.liveQuoteCache.set(ticker, { ...payload, ts: Date.now() });
                return payload;
            } catch (e) {
                console.warn(`Live quote fetch failed for ${ticker}:`, e);
                return null;
            } finally {
                this.inFlightQuotePromises.delete(ticker);
            }
        })();

        this.inFlightQuotePromises.set(ticker, quotePromise);
        return quotePromise;
    }

    public async getProcessedFeed(): Promise<ProcessedDeal[]> {
        const rawDeals = dealCache.getRecentDeals(100);
        const uniqueTickers = Array.from(new Set(rawDeals.map((d) => d.ticker)));
        const quoteEntries = await Promise.all(
            uniqueTickers.map(async (ticker) => [ticker, await this.getLiveQuote(ticker)] as const)
        );
        const quoteMap = new Map<string, { price: number; changePercent: number } | null>(quoteEntries);

        return rawDeals.map((deal) => {
            const liveQuote = quoteMap.get(deal.ticker) || null;
            const cmp = liveQuote?.price ?? deal.price;
            const sentiment = analyzeDealSentiment(deal, cmp);
            const impact = calculateImpactScore(deal);

            let alert;
            const buyerLower = deal.buyer.toLowerCase();
            const isPromoterBuying = buyerLower.includes('promoter');
            if (deal.valueCr > 100 && (sentiment.sentiment === 'Super Bullish' || sentiment.sentiment === 'Bullish')) {
                alert = `Massive ${deal.valueCr.toFixed(2)}Cr Institution Accumulation in ${deal.ticker} !`;
            }
            if (isPromoterBuying) {
                alert = `Promoter accumulation detected in ${deal.ticker} (${deal.stakePercent}%) !`;
            }

            return {
                ...deal,
                impact,
                sentiment,
                cmp: liveQuote?.price,
                cmpChangePercent: liveQuote?.changePercent,
                alert
            };
        });
    }

    public getSmartMoneyRadar(): RadarData[] {
        const rawDeals = dealCache.getRecentDeals(500);
        const accumulationMap = new Map<string, { total: number, sentiment: string, count: number }>();

        for (const deal of rawDeals) {
            const sentimentObj = analyzeDealSentiment(deal, deal.price);
            if (['Super Bullish', 'Bullish'].includes(sentimentObj.sentiment)) {
                const existing = accumulationMap.get(deal.ticker) || { total: 0, sentiment: sentimentObj.sentiment, count: 0 };
                existing.total += deal.valueCr;
                existing.count += 1;
                // Upgrade sentiment if it was Bullish and we got a Super Bullish
                if (sentimentObj.sentiment === 'Super Bullish') existing.sentiment = 'Super Bullish';
                accumulationMap.set(deal.ticker, existing);
            }
        }

        const sorted = Array.from(accumulationMap.entries())
            .map(([ticker, data]) => ({
                ticker,
                totalBuyingCr: data.total,
                sentiment: data.sentiment,
                dealsCount: data.count
            }))
            .sort((a, b) => b.totalBuyingCr - a.totalBuyingCr)
            .slice(0, 5); // Top 5

        return sorted;
    }
}

export const dealEngine = DealEngine.getInstance();
