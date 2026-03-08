import { NseIndia } from 'stock-nse-india';

const nse = new NseIndia();

async function testNSE() {
    console.log("Testing stock-nse-india...");
    try {
        const indices = await nse.getAllStockSymbols();
        console.log("Got symbols, length:", indices.length);

        // Try getting live index data
        // The library documentation says: nse.getEquityStockIndices(symbol)
        // But for the INDEX itself, we often check 'Live Market' -> 'Index'

        // Let's try getting all index details
        const indexData = await nse.getDataByEndpoint('/api/allIndices');
        // console.log("Index Data received:", JSON.stringify(indexData)); 
        if (indexData && indexData.data) {
            const first = indexData.data[0];
            console.log("First Item Keys:", Object.keys(first));
            console.log("Sample:", first);
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error("NSE Test Failed:", e.message);
        } else {
            console.error("NSE Test Failed:", e);
        }
    }
}

testNSE();
