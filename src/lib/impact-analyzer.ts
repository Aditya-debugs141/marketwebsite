
export interface ImpactAnalysis {
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    impactScore: number; // 0-10
    keywords: string[];
    reasoning: string;
}

const POSITIVE_KEYWORDS = [
    'profit jumps', 'net profit rises', 'revenue grows', 'buy rating', 'target raised',
    'won order', 'bagged order', 'acquisition', 'stake sale', 'dividend declared',
    'bonus issue', 'stock split', 'merger', 'expansion', 'new plant', 'partnership',
    'record high', 'surges', 'rally', 'upper circuit', 'outcome positive',
    'us fda approval', 'pli scheme', 'debt reduction', 'promoter buying',
    'strong q3', 'strong q4', 'strong q1', 'strong q2', 'beating estimates'
];

const NEGATIVE_KEYWORDS = [
    'loss widens', 'profit falls', 'revenue declines', 'sell rating', 'target cut',
    'regulatory action', 'fraud', 'scam', 'default', 'bankruptcy', 'downgrade',
    'weak guidance', 'margin pressure', 'layoffs', 'strike', 'shutdown',
    'lower circuit', 'crashes', 'plunges', 'sebi notice', 'gst raid',
    'income tax raid', 'promoter selling', 'pledged shares', 'audit qualification',
    'misses estimates', 'weak q3', 'weak q4', 'weak q1', 'weak q2'
];

export function analyzeImpact(title: string, contentSnippet: string): ImpactAnalysis {
    const text = `${title} ${contentSnippet}`.toLowerCase();
    const foundAcc: string[] = [];

    let positiveScore = 0;
    let negativeScore = 0;

    POSITIVE_KEYWORDS.forEach(keyword => {
        if (text.includes(keyword)) {
            positiveScore += 2; // Weighting key terms higher
            foundAcc.push(keyword);
        }
    });

    NEGATIVE_KEYWORDS.forEach(keyword => {
        if (text.includes(keyword)) {
            negativeScore += 2;
            foundAcc.push(keyword);
        }
    });

    // Contextual checks (simplified)
    if (text.includes('crore') && (text.includes('profit') || text.includes('order'))) {
        positiveScore += 1;
    }

    let sentiment: ImpactAnalysis['sentiment'] = 'NEUTRAL';
    let impactScore = 5; // Baseline
    let reasoning = 'No significant keywords found.';

    if (positiveScore > negativeScore) {
        sentiment = 'POSITIVE';
        impactScore = Math.min(10, 5 + positiveScore);
        reasoning = `Bullish indicators: ${foundAcc.join(', ')}`;
    } else if (negativeScore > positiveScore) {
        sentiment = 'NEGATIVE';
        impactScore = Math.max(1, 5 - negativeScore);
        reasoning = `Bearish indicators: ${foundAcc.join(', ')}`;
    } else if (positiveScore > 0 && negativeScore > 0) {
        sentiment = 'NEUTRAL';
        impactScore = 5;
        reasoning = `Mixed signals: ${foundAcc.join(', ')}`;
    }

    // Normalize bounds
    if (impactScore > 10) impactScore = 10;
    if (impactScore < 0) impactScore = 0;

    return {
        sentiment,
        impactScore,
        keywords: foundAcc,
        reasoning
    };
}
