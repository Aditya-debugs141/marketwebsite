import Parser from 'rss-parser';
import { analyzeImpact, ImpactAnalysis } from './impact-analyzer';
import { getStockPrice, resolveIndianTicker, StockPrice } from './stock-service';

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    contentSnippet: string;
    source: 'Economic Times' | 'MoneyControl' | 'LiveMint' | 'CNBC TV18' | 'Business Standard' | 'Reuters';
    guid?: string;
    impact: ImpactAnalysis;
    ai_sentiment?: {
        sentiment: 'Bullish' | 'Bearish' | 'Neutral';
        score: number;
        targetPrice?: number;
        reasoning?: string;
    };
    relatedStock?: StockPrice | null;
    relatedSymbol?: string | null;
}

const parser = new Parser();

const ET_RSS_URL = 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms';
const MONEYCONTROL_RSS_URL = 'https://www.moneycontrol.com/rss/marketreports.xml';
// const LIVEMINT_RSS_URL = 'https://www.livemint.com/rss/money/markets'; // Not currently used
const CNBC_RSS_URL = 'https://www.cnbctv18.com/commonfeeds/v1/cns/market.xml';
// const BS_RSS_URL = 'https://www.business-standard.com/rss/markets-106.rss'; // Not currently used
const REUTERS_RSS_URL = 'https://news.google.com/rss/search?q=source:reuters+market+india&hl=en-IN&gl=IN&ceid=IN:en';

// Common Indian stock tickers mapping (Expanded for better coverage)
const TICKER_MAP: Record<string, string> = {
    // IT Services
    'TCS': 'TCS', 'Tata Consultancy': 'TCS',
    'Infosys': 'INFY',
    'HCL': 'HCLTECH', 'HCL Tech': 'HCLTECH',
    'Wipro': 'WIPRO',
    'Tech Mahindra': 'TECHM',
    'LTIMindtree': 'LTIM',
    'Persistent': 'PERSISTENT',
    'Coforge': 'COFORGE',
    'Mphasis': 'MPHASIS',

    // Banking & Finance
    'Indian Bank': 'INDIANB',
    'HDFC Bank': 'HDFCBANK', 'HDFC': 'HDFCBANK',
    'ICICI': 'ICICIBANK', 'ICICI Bank': 'ICICIBANK',
    'SBI': 'SBIN', 'State Bank': 'SBIN',
    'Kotak': 'KOTAKBANK', 'Kotak Mahindra': 'KOTAKBANK',
    'Axis Bank': 'AXISBANK', 'Axis': 'AXISBANK',
    'IndusInd': 'INDUSINDBK',
    'Bajaj Finance': 'BAJFINANCE',
    'Bajaj Finserv': 'BAJAJFINSV',
    'Jio Financial': 'JIOFIN', 'Jio': 'JIOFIN',
    'LIC': 'LICI',
    'PFC': 'PFC', 'Power Finance': 'PFC',
    'REC': 'REC',
    'Shriram Finance': 'SHRIRAMFIN',
    'Muthoot': 'MUTHOOTFIN',
    'Cholamandalam': 'CHOLAFIN',

    // Oil, Gas & Energy
    'Reliance': 'RELIANCE', 'RIL': 'RELIANCE', // 'Jio': 'RELIANCE' removed to avoid duplicate key
    'ONGC': 'ONGC',
    'NTPC': 'NTPC',
    'Power Grid': 'POWERGRID',
    'Adani Green': 'ADANIGREEN',
    'Adani Power': 'ADANIPOWER',
    'Tata Power': 'TATAPOWER',
    'Coal India': 'COALINDIA',
    'BPCL': 'BPCL',
    'IOC': 'IOC', 'Indian Oil': 'IOC',
    'GAIL': 'GAIL',

    // Auto
    'Tata Motors': 'TATAMOTORS',
    'Maruti': 'MARUTI', 'Maruti Suzuki': 'MARUTI',
    'Mahindra': 'M&M', 'Mahindra & Mahindra': 'M&M',
    'Bajaj Auto': 'BAJAJ-AUTO',
    'Eicher': 'EICHERMOT', 'Royal Enfield': 'EICHERMOT',
    'Hero MotoCorp': 'HEROMOTOCO',
    'TVS Motor': 'TVSMOTOR',
    'Bharat Forge': 'BHARATFORG',

    // Consumer Goods (FMCG)
    'ITC': 'ITC',
    'HUL': 'HINDUNILVR', 'Hindustan Unilever': 'HINDUNILVR',
    'Nestle': 'NESTLEIND',
    'Britannia': 'BRITANNIA',
    'Titan': 'TITAN',
    'Asian Paints': 'ASIANPAINT',
    'Dabur': 'DABUR',
    'Godrej CP': 'GODREJCP',
    'Marico': 'MARICO',
    'Varun Beverages': 'VBL',

    // Infrastructure & Materials
    'L&T': 'LT', 'Larsen': 'LT', 'Larsen & Toubro': 'LT',
    'UltraTech': 'ULTRACEMCO',
    'Tata Steel': 'TATASTEEL',
    'JSW Steel': 'JSWSTEEL',
    'Hindalco': 'HINDALCO',
    'Adani Ent': 'ADANIENT', 'Adani Enterprises': 'ADANIENT',
    'Adani Ports': 'ADANIPORTS',
    'Ambuja': 'AMBUJACEM',
    'Shree Cement': 'SHREECEM',
    'Grasim': 'GRASIM',
    'Siemens': 'SIEMENS',
    'ABB': 'ABB',
    'HAL': 'HAL', 'Hindustan Aeronautics': 'HAL',
    'BEL': 'BEL', 'Bharat Electronics': 'BEL',

    // Pharma
    'Sun Pharma': 'SUNPHARMA',
    'Dr Reddy': 'DRREDDY', 'Dr. Reddy': 'DRREDDY',
    'Cipla': 'CIPLA',
    'Apollo Hospitals': 'APOLLOHOSP',
    'Divis': 'DIVISLAB', 'Divi\'s': 'DIVISLAB',
    'Lupin': 'LUPIN',
    'Torrent Pharma': 'TORNTPHARM',
    'Zydus': 'ZYDUSLIFE',

    // Telecom
    'Bharti Airtel': 'BHARTIARTL', 'Airtel': 'BHARTIARTL',
    'Vodafone Idea': 'IDEA', 'Vi': 'IDEA',
    'Indus Towers': 'INDUSTOWER',

    // New Age / Tech
    'Zomato': 'ZOMATO',
    'Paytm': 'PAYTM',
    'Nykaa': 'NYKAA',
    'PolicyBazaar': 'POLICYBZR', 'PB Fintech': 'POLICYBZR',
    'Delhivery': 'DELHIVERY',

    // Others
    'IRCTC': 'IRCTC',
    'Indigo': 'INDIGO', 'Interglobe': 'INDIGO',
    'Berger Paints': 'BERGERPAINT',
    'Pidilite': 'PIDILITIND',
    'Havells': 'HAVELLS',
    'DLF': 'DLF',
    'Godrej Properties': 'GODREJPROP',
    'Oberoi Realty': 'OBEROIRLTY',
    // Additional User Requested Stocks
    'IRFC': 'IRFC', 'Indian Railway Finance': 'IRFC',
    'PNB': 'PNB', 'Punjab National Bank': 'PNB',
    'OFSS': 'OFSS', 'Oracle Financial': 'OFSS',
    'Schaeffler': 'SCHAEFFLER', 'Schaeffler India': 'SCHAEFFLER'
};

function extractTicker(text: string): string | null {
    // We sort keys by length descending so "HDFC Bank" matches before "HDFC"
    const keys = Object.keys(TICKER_MAP).sort((a, b) => b.length - a.length);

    for (const key of keys) {
        // Use word boundaries for stricter matching to avoid partial word triggers
        // Escape special characters in key like '&' in 'M&M'
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');

        if (regex.test(text)) {
            return TICKER_MAP[key];
        }
    }
    return null;
}

function extractCompanyHint(title: string): string | null {
    // Try to capture company name before action verbs/common connectors
    const splitRegex = /\b(to|will|on|as|after|amid|in|for|says|plans|launch|raises|cuts|buys|sells|stake|deal)\b/i;
    const head = title.split(splitRegex)[0]?.trim() || title.trim();

    const cleaned = head
        .replace(/[^A-Za-z0-9&.\-\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (cleaned.length < 3) return null;
    return cleaned;
}

const BLACKLIST_KEYWORDS = [
    'us stocks', 'wall street', 'dow jones', 'nasdaq', 's&p 500',
    'global markets', 'asia stocks', 'bitcoin', 'crypto', 'ethereum',
    'dollar', 'fed', 'federal reserve', 'hong kong', 'china'
];

const WHITELIST_KEYWORDS = [
    'sensex', 'nifty', 'bse', 'nse', 'rbi', 'sebi', 'rupee',
    'india', 'indian', 'mumbai', 'dalal street',
    'market', 'markets', 'economy', 'finance', 'sector',
    'bank', 'auto', 'it', 'metal', 'power', 'gain', 'loss', 'surge', 'plunge',
    'stocks', 'shares', 'trading', 'investor', 'bull', 'bear'
];

function isRelevantNews(text: string): boolean {
    const lower = text.toLowerCase();

    // 1. Strict Reject
    if (BLACKLIST_KEYWORDS.some(word => lower.includes(word))) {
        return false;
    }

    // 2. Auto-Accept if it matches a known Ticker
    if (extractTicker(text)) {
        return true;
    }

    // 3. Accept if it contains specific Indian market keywords
    if (WHITELIST_KEYWORDS.some(word => lower.includes(word))) {
        return true;
    }

    // 4. Default Accept
    // Since we are scraping Indian financial RSS feeds, assume everything else is relevant
    // unless it hits the global markets blacklist.
    return true;
}

async function fetchFromSource(url: string, sourceName: NewsItem['source']): Promise<NewsItem[]> {
    try {
        const feed = await parser.parseURL(url);

        const newsItems = await Promise.all(feed.items.map(async (item) => {
            const title = item.title || 'No Title';
            const contentSnippet = item.contentSnippet || item.content || '';

            // STRICT FILTERING
            if (!isRelevantNews(title + ' ' + contentSnippet)) {
                return null;
            }

            const impact = analyzeImpact(title, contentSnippet);

            let relatedStock: StockPrice | null = null;
            let ticker = extractTicker(`${title} ${contentSnippet}`);

            // Fallback: resolve via Yahoo symbol search when map-based match is missing
            if (!ticker) {
                const companyHint = extractCompanyHint(title);
                if (companyHint) {
                    ticker = await resolveIndianTicker(companyHint);
                }
            }

            // Fetch live price if a ticker is found
            if (ticker) {
                relatedStock = await getStockPrice(ticker);
            }

            return {
                title,
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                contentSnippet,
                source: sourceName,
                guid: item.guid || item.link,
                impact,
                relatedStock,
                relatedSymbol: ticker
            } as NewsItem;
        }));

        // Filter out nulls (rejected items)
        return newsItems.filter((item): item is NewsItem => item !== null);
    } catch (error) {
        console.error(`Error fetching news from ${sourceName}:`, error);
        return [];
    }
}

export async function fetchNews(): Promise<NewsItem[]> {
    const [etNews, mcNews, cnbcNews, reutersNews] = await Promise.all([
        fetchFromSource(ET_RSS_URL, 'Economic Times'),
        fetchFromSource(MONEYCONTROL_RSS_URL, 'MoneyControl'),
        fetchFromSource(CNBC_RSS_URL, 'CNBC TV18'),
        fetchFromSource(REUTERS_RSS_URL, 'Reuters')
    ]);

    const allNews = [...etNews, ...mcNews, ...cnbcNews, ...reutersNews];

    // Sort by Date (Desc)
    return allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}
