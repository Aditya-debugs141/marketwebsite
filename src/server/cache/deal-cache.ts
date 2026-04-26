import crypto from 'crypto';

export interface DealData {
    id: string; // hash
    companyName: string;
    ticker: string;
    buyer: string;
    seller: string;
    dealType: 'Block' | 'Bulk';
    quantity: number;
    price: number;
    valueCr: number;
    stakePercent: number;
    marketTimestamp?: number;
    timestamp: number;
    source: 'NSE' | 'BSE';
}

class DealCache {
    private static instance: DealCache;
    private deals: Map<string, DealData> = new Map();
    private readonly SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    private constructor() { }

    public static getInstance(): DealCache {
        if (!DealCache.instance) {
            DealCache.instance = new DealCache();
        }
        return DealCache.instance;
    }

    public generateHash(ticker: string, price: number, quantity: number, buyer: string, seller: string, timestamp: number): string {
        // We round down timestamp to nearest hour perhaps? Or just use raw date from exchange.
        // Assuming timestamp is in ms, exchange deals usually share exact same minute/second.
        const input = `${ticker}_${price}_${quantity}_${buyer}_${seller}_${timestamp}`;
        return crypto.createHash('md5').update(input).digest('hex');
    }

    public addDeals(newDeals: DealData[]): DealData[] {
        const added: DealData[] = [];
        const now = Date.now();

        // Cleanup old deals
        for (const [key, deal] of this.deals.entries()) {
            const effectiveTs = deal.marketTimestamp ?? deal.timestamp;
            if (now - effectiveTs > this.SEVEN_DAYS_MS) {
                this.deals.delete(key);
            }
        }

        for (const deal of newDeals) {
            if (!this.deals.has(deal.id)) {
                this.deals.set(deal.id, deal);
                added.push(deal);
            }
        }
        return added;
    }

    public getRecentDeals(count: number = 50): DealData[] {
        return Array.from(this.deals.values())
            .sort((a, b) => (b.marketTimestamp ?? b.timestamp) - (a.marketTimestamp ?? a.timestamp))
            .slice(0, count);
    }

    public getAllDealsIterator(): IterableIterator<DealData> {
        return this.deals.values();
    }
}

export const dealCache = DealCache.getInstance();
