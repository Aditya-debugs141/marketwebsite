import yahooFinance from 'yahoo-finance2';

async function test() {
    try {
        console.log("Fetching Sector 1...");
        const quotes1 = await yahooFinance.quote(['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS']);
        console.log("Sector 1 Length:", quotes1.length);

        console.log("Fetching Sector 2...");
        const quotes2 = await yahooFinance.quote(['TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS']);
        console.log("Sector 2 Length:", quotes2.length);

    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.result) console.error("Result:", e.result);
    }
}
test();
