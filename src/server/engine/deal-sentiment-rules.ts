import { DealData } from '../cache/deal-cache';

export type DealSentimentTier = 'Super Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Super Bearish';

export interface DealSentimentResult {
    sentiment: DealSentimentTier;
    confScore: number;
}

/**
 * Analyzes deal sentiment using purely rules-based logic (no API calls).
 * Evaluates promoter/institutional activity and price ratios to determine sentiment.
 */
export function analyzeDealSentiment(deal: DealData, currentMarketPrice: number): DealSentimentResult {
    const buyer = deal.buyer.toLowerCase();
    const seller = deal.seller.toLowerCase();

    const isPromoterBuying = buyer.includes('promoter');
    const isPromoterSelling = seller.includes('promoter');

    // Comprehensive list of institutional keywords
    const instiKeywords = [
        'fund', 'amc', 'morgan', 'blackrock', 'fii', 'nomura', 'societe',
        'goldman', 'sachs', 'citigroup', 'merrill', 'lynch', 'icici',
        'hdfc', 'sbi', 'kotak', 'nippon', 'vanguard', 'fidelity', 'state street',
        'bank', 'capital', 'investment', 'asset', 'wealth', 'insurance',
        'lic', 'pension', 'trust', 'endowment', 'sovereign'
    ];

    const isInstiBuying = instiKeywords.some(kw => buyer.includes(kw));
    const isInstiSelling = instiKeywords.some(kw => seller.includes(kw));

    const priceDiffRatio = currentMarketPrice > 0 ? (deal.price / currentMarketPrice) : 1;

    if (isPromoterBuying || (deal.valueCr > 100 && isInstiBuying)) {
        return { sentiment: 'Super Bullish', confScore: 0.95 };
    }

    if (isPromoterSelling || (deal.valueCr > 100 && isInstiSelling && deal.stakePercent > 1.0)) {
        return { sentiment: 'Super Bearish', confScore: 0.92 };
    }

    if (isInstiBuying && isInstiSelling) {
        return { sentiment: 'Neutral', confScore: 0.5 };
    }

    if (isInstiBuying || priceDiffRatio > 1.02) {
        return { sentiment: 'Bullish', confScore: 0.75 };
    }

    if (isInstiSelling || priceDiffRatio < 0.98) {
        return { sentiment: 'Bearish', confScore: 0.75 };
    }

    return { sentiment: 'Neutral', confScore: 0.5 };
}
