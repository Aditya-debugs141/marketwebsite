import { NseIndia } from 'stock-nse-india';

const nse = new NseIndia();

async function checkHeatmapApi() {
    console.log("Testing Deep Market Data (Heatmap) fetch...");
    try {
        const sector = 'NIFTY BANK';
        const url = `/api/equity-stockIndices?index=${encodeURIComponent(sector)}`;
        console.log(`Fetching: ${url}`);

        const response = await nse.getDataByEndpoint(url);

        if (response && response.data) {
            console.log(`Success! Received ${response.data.length} stocks for ${sector}`);
            if (response.data.length > 0) {
                console.log("Sample Data Output:");
                console.log("Symbol:", response.data[0].symbol);
                console.log("Last Price:", response.data[0].lastPrice);
                console.log("Total Traded Value:", response.data[0].totalTradedValue);
            }
        } else {
            console.error("Empty or invalid response from NSE API.");
            console.log(response);
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error("Test Failed:", e.message);
        } else {
            console.error("Test Failed:", e);
        }
    }
}

checkHeatmapApi();
