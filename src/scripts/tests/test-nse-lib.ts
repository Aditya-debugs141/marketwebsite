import { NseIndia } from 'stock-nse-india';

const nse = new NseIndia();

async function testLib() {
    try {
        console.log("Testing stock-nse-india...");
        // Log all available methods to find bulk/block deal
        console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(nse)));

        // Let's try to get market status first to see if it works
        const status = await nse.getMarketStatus();
        console.log("Market Status SUCCESS:", status.marketState);

        // Try to fetch bulk deals if a method exists, otherwise use the protected .getDataByEndpoint method
        if ((nse as any).getDataByEndpoint) {
            console.log("Trying /api/historical/bulk-deals...");
            const data = await (nse as any).getDataByEndpoint('/api/historical/bulk-deals');
            console.log("BULK DEALS SUCCESS.");
            console.log(data.data ? data.data.slice(0, 2) : "No .data property");
        } else {
            console.log("No getDataByEndpoint method exposed");
        }

    } catch (e) {
        console.error("LIB ERROR:", e.message);
    }
}
testLib();
