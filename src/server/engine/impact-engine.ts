import { DealData } from '../cache/deal-cache';

export interface ImpactResult {
    score: number;
    category: 'Noise' | 'Weak' | 'Moderate' | 'Strong' | 'Institutional Move';
}

export function calculateImpactScore(deal: DealData): ImpactResult {
    let score = 0;

    // 1. 40% Deal Size vs Avg Volume (Proxy: absolute size in Cr for now)
    // Assuming > 100Cr is huge (max 40 pts)
    const sizePts = Math.min(40, (deal.valueCr / 100) * 40);
    score += sizePts;

    // 2. 30% Stake Percentage
    // Assuming > 1.5% is huge (max 30 pts)
    const stakePts = Math.min(30, (deal.stakePercent / 1.5) * 30);
    score += stakePts;

    // 3. 20% Buyer Credibility
    let buyerPts = 5; // retail / unknown base
    const buyerLower = deal.buyer.toLowerCase();
    if (buyerLower.includes('promoter')) {
        buyerPts = 20;
    } else if (buyerLower.includes('fund') || buyerLower.includes('amc') || buyerLower.includes('morgan') || buyerLower.includes('blackrock') || buyerLower.includes('fii')) {
        buyerPts = 15;
    }
    score += buyerPts;

    // 4. 10% Price Premium
    // Assuming a 2% premium gives max 10 pts. For now we mock it as random (0-10) 
    // since we don't have real-time market price at exact deal second synced here perfectly.
    // In real implementation: `(deal.price / currentMarketPrice) - 1`
    const diffMock = Math.random() * 10;
    score += diffMock;

    score = Math.floor(Math.min(100, Math.max(0, score)));

    let category: ImpactResult['category'] = 'Noise';
    if (score >= 80) category = 'Institutional Move';
    else if (score >= 60) category = 'Strong';
    else if (score >= 40) category = 'Moderate';
    else if (score >= 20) category = 'Weak';

    return {
        score,
        category
    };
}
