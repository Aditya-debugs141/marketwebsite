import yahooFinance from 'yahoo-finance2';

interface YahooQuote {
    symbol?: string;
    regularMarketPrice?: number;
}

async function test() {
    try {
        console.log("Fetching Sector 1...");
        const quotes1 = await yahooFinance.quote(['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS']) as YahooQuote | YahooQuote[];
        const q1Array = Array.isArray(quotes1) ? quotes1 : [quotes1];
        console.log("Sector 1 Length:", q1Array.length);

        console.log("Fetching Sector 2...");
        const quotes2 = await yahooFinance.quote(['TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS']) as YahooQuote | YahooQuote[];
        const q2Array = Array.isArray(quotes2) ? quotes2 : [quotes2];
        console.log("Sector 2 Length:", q2Array.length);

    } catch (e: unknown) {
        const error = e as { message: string; result?: unknown };
        console.error("Error:", error.message);
        if (error.result) console.error("Result:", error.result);
    }
}
test();
