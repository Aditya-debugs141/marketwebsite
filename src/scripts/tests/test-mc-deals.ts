async function fetchMoneyControlDeals() {
    try {
        const res = await fetch('https://www.moneycontrol.com/stocks/marketinfo/blockdeals/index.php', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!res.ok) {
            console.log("Failed MC status", res.status);
            return;
        }
        const text = await res.text();
        console.log("Successfully fetched MC HTML. Length:", text.length);

        // Very basic test to see if we can find table rows
        const matches = text.match(/<tr>\s*<td>.*?<\/tr>/gs);
        console.log("Found table rows:", matches ? matches.length : 0);

        if (matches && matches.length > 0) {
            console.log("Sample row:", matches[10] || matches[0]);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

fetchMoneyControlDeals();
