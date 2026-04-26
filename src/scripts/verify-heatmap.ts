async function checkHeatmapApi() {
    console.log("Testing Deep Market Data (Heatmap) fetch...");
    try {
        const sector = 'NIFTY BANK';
        const url = `https://www.nseindia.com/api/equity-stockIndices?index=${encodeURIComponent(sector)}`;
        console.log(`Fetching: ${url}`);

        const res = await fetch(url, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'referer': 'https://www.nseindia.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`NSE API returned ${res.status}`);
        }

        const response = await res.json() as { data?: Array<{ symbol?: string; lastPrice?: number; totalTradedValue?: number }> };

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
