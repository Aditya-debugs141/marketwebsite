import { fetchSimulatedDeals } from '../data-sources/simulated-deals';
import { dealCache, DealData } from '../cache/deal-cache';
import { calculateImpactScore, ImpactResult } from './impact-engine';
import { analyzeDealSentiment, DealSentimentResult } from './deal-sentiment-rules';

export interface ProcessedDeal extends DealData {
    impact: ImpactResult;
    sentiment: DealSentimentResult;
    alert?: string;
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

    private constructor() { }

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

            return this.getProcessedFeed();
        } catch (e) {
            console.error("Error refreshing deals:", e);
            return this.getProcessedFeed();
        } finally {
            this.isFetching = false;
        }
    }

    public getProcessedFeed(): ProcessedDeal[] {
        const rawDeals = dealCache.getRecentDeals(100);
        return rawDeals.map(deal => {
            // Mocking current market price matching deal price for offline proxy
            // Ideally map to real-time socket price 
            const cmp = deal.price;
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
