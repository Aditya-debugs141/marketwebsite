import { DealData } from '../cache/deal-cache';

// Expanded list of highly-liquid Indian stocks with realistic base prices
const STOCKS = [
    { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd.', basePrice: 1450, exchange: 'NSE' },
    { ticker: 'RELIANCE', name: 'Reliance Industries', basePrice: 2950, exchange: 'NSE' },
    { ticker: 'INFY', name: 'Infosys Ltd.', basePrice: 1650, exchange: 'NSE' },
    { ticker: 'TCS', name: 'Tata Consultancy Services', basePrice: 4100, exchange: 'NSE' },
    { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd.', basePrice: 1050, exchange: 'NSE' },
    { ticker: 'SBIN', name: 'State Bank of India', basePrice: 750, exchange: 'NSE' },
    { ticker: 'BHARTIARTL', name: 'Bharti Airtel', basePrice: 1150, exchange: 'NSE' },
    { ticker: 'ITC', name: 'ITC Ltd.', basePrice: 420, exchange: 'NSE' },
    { ticker: 'LT', name: 'Larsen & Toubro', basePrice: 3500, exchange: 'NSE' },
    { ticker: 'BAJFINANCE', name: 'Bajaj Finance', basePrice: 6800, exchange: 'NSE' },
    { ticker: 'MRF', name: 'MRF Ltd.', basePrice: 140000, exchange: 'BSE' },
    { ticker: 'PAGEIND', name: 'Page Industries', basePrice: 38000, exchange: 'BSE' },
    { ticker: 'ZOMATO', name: 'Zomato Ltd.', basePrice: 160, exchange: 'NSE' },
    { ticker: 'PAYTM', name: 'One97 Communications', basePrice: 400, exchange: 'NSE' },
    { ticker: 'JIOFIN', name: 'Jio Financial Services', basePrice: 350, exchange: 'NSE' }
];

const BUYERS = [
    'Morgan Stanley Asia', 'Vanguard Emerging Markets', 'BlackRock Global',
    'SBI Mutual Fund', 'LIC of India', 'HDFC AMC', 'Promoter Group',
    'Nippon India MF', 'Societe Generale', 'Nomura Singapore', 'Goldman Sachs'
];

const SELLERS = [
    'Retail Investors', 'Foreign Portfolio Investor', 'Venture Capital Fund',
    'Promoter Group', 'Private Equity', 'HNI', 'Mutual Fund', 'Insurance Company'
];

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Keep a persistent list in memory so we don't flood the UI with 100% new deals every 10 seconds
const persistentDeals: Omit<DealData, 'id'>[] = [];
let initialized = false;

export async function fetchSimulatedDeals(): Promise<Omit<DealData, 'id'>[]> {
    console.log("Generating Realistic Indian Market Deals (Offline Mode)...");

    if (!initialized) {
        // Generate an initial batch of 15 realistic historical deals from today
        for (let i = 0; i < 15; i++) {
            persistentDeals.push(generateSingleDeal(true));
        }
        // Sort descending by time
        persistentDeals.sort((a, b) => b.timestamp - a.timestamp);
        initialized = true;
    }

    // 40% chance every 10 seconds to detect a "new" live deal block transaction
    if (Math.random() > 0.6) {
        const newDeal = generateSingleDeal(false);
        persistentDeals.unshift(newDeal);

        // Keep array manageable
        if (persistentDeals.length > 50) {
            persistentDeals.pop();
        }
    }

    return persistentDeals;
}

function generateSingleDeal(isHistorical: boolean): Omit<DealData, 'id'> {
    const stock = randomElement(STOCKS);

    let buyer = randomElement(BUYERS);
    let seller = randomElement(SELLERS);
    while (buyer === seller) seller = randomElement(SELLERS);

    // Occasional massive Promoter buying for UI testing
    if (Math.random() > 0.9) buyer = 'Promoter Group';

    // Fluctuate price by +/- 2% from base
    const priceVariance = stock.basePrice * 0.02;
    const price = stock.basePrice + (Math.random() * priceVariance * 2 - priceVariance);

    // Quantity based on price to keep ValueCr somewhat realistic (10Cr to 1000Cr)
    const targetValueCr = Math.floor(Math.random() * 500) + 10;
    const quantity = Math.floor((targetValueCr * 10000000) / price);

    const dealType = quantity > 1000000 ? 'Block' : 'Bulk';

    let timestamp = Date.now();
    if (isHistorical) {
        // Random time within the last 8 hours
        timestamp -= Math.floor(Math.random() * 8 * 60 * 60 * 1000);
    }

    return {
        companyName: stock.name,
        ticker: stock.ticker,
        buyer,
        seller,
        dealType,
        quantity,
        price,
        valueCr: (price * quantity) / 10000000,
        stakePercent: +(Math.random() * 3.5).toFixed(2),
        timestamp,
        source: stock.exchange
    };
}
