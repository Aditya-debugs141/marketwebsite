import { GoogleGenAI } from '@google/genai';
import { DealData } from '../cache/deal-cache';

export interface SentimentResult {
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    score: number;
    targetPrice?: number;
    reasoning?: string;
}

export type DealSentimentTier = 'Super Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Super Bearish';

export interface DealSentimentResult {
    sentiment: DealSentimentTier;
    confScore: number;
}

export class SentimentEngine {
    private static instance: SentimentEngine;
    private ai: GoogleGenAI | null = null;
    private isReady: boolean = false;

    private constructor() { }

    public static getInstance(): SentimentEngine {
        if (!SentimentEngine.instance) {
            SentimentEngine.instance = new SentimentEngine();
        }
        return SentimentEngine.instance;
    }

    public async init() {
        if (this.isReady) return;

        console.log('Initializing Google Gemini API...');
        try {
            if (process.env.GEMINI_API_KEY) {
                this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                console.log('Google Gemini API Initialized Successfully!');
            } else {
                console.warn('GEMINI_API_KEY not found in environment. Falling back to offline NLP mode.');
            }
        } catch (e) {
            console.error('Failed to initialize Google Gemini API:', e);
        }
        this.isReady = true;
    }

    // -- DEAL SENTIMENT LOGIC (Rules Based as requested) --
    public analyzeDeal(deal: DealData, currentMarketPrice: number): DealSentimentResult {
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


    // -- NEWS SENTIMENT LOGIC (Existing) --
    private extractTargetPrice(text: string): number | undefined {
        const patterns = [
            /target\s*price\s*(?:of|is|at)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i,
            /target\s*(?:of|is|at)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i,
            /tp\s*(?:of|is|at)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/i,
            /(?:rs\.?|₹|inr)\s*(\d+(?:\.\d+)?)\s*per\s*share/i
        ];
        for (const regex of patterns) {
            const match = text.match(regex);
            if (match && match[1]) {
                const num = parseFloat(match[1]);
                if (!isNaN(num) && num > 0) return num;
            }
        }
        return undefined;
    }

    public async analyze(text: string): Promise<SentimentResult> {
        if (!this.isReady) await this.init();

        const extractedTarget = this.extractTargetPrice(text);

        if (!this.ai) {
            return this.fallbackAnalysis(text, extractedTarget);
        }

        try {
            const prompt = `Analyze the following Indian stock market news headline and extract the sentiment data.\nNews: "${text}"\n\nRespond ONLY with a valid JSON strictly matching this schema:\n{\n  "sentiment": "Bullish" | "Bearish" | "Neutral",\n  "score": <number between 0 and 1 representing confidence>,\n  "targetPrice": <optional target price numeric value if mentioned, else null>,\n  "reasoning": "<1 sentence explanation>"\n}`;

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.1,
                }
            });

            let responseText = response.text || '';
            // Strip markdown JSON wrapping if present
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            const result = JSON.parse(responseText);

            return {
                sentiment: ['Bullish', 'Bearish', 'Neutral'].includes(result.sentiment) ? result.sentiment : 'Neutral',
                score: result.score || 0.5,
                targetPrice: result.targetPrice || extractedTarget,
                reasoning: `Gemini AI: ${result.reasoning || 'Analyzed'}`
            };
        } catch (e) {
            console.error('Gemini API analysis failed, using fallback:', e);
            return this.fallbackAnalysis(text, extractedTarget);
        }
    }

    private fallbackAnalysis(text: string, extractedTarget?: number): SentimentResult {
        const lower = text.toLowerCase();
        const reasoning = extractedTarget ? `Offline NLP: Target ₹${extractedTarget} detected.` : "Offline keywords analysis.";

        if (lower.includes('profit') || lower.includes('gain') || lower.includes('up') || lower.includes('buy') || lower.includes('bull')) {
            return { sentiment: 'Bullish', score: 0.8, targetPrice: extractedTarget, reasoning };
        }
        if (lower.includes('loss') || lower.includes('down') || lower.includes('sell') || lower.includes('bear') || lower.includes('crash')) {
            return { sentiment: 'Bearish', score: 0.8, targetPrice: extractedTarget, reasoning };
        }
        return { sentiment: 'Neutral', score: 0.5, targetPrice: extractedTarget, reasoning };
    }
}
