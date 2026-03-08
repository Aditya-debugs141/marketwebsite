import * as cheerio from 'cheerio';

async function scrapeTrendlyne() {
    console.log("Fetching Trendlyne Bulk Deals...");
    try {
        const res = await fetch('https://trendlyne.com/features/bulk-block-deals/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!res.ok) {
            console.log("Trendlyne blocked request:", res.status);
            return;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        const deals: any[] = [];

        // Find rows in deals tables 
        $('table tbody tr').each((i, el) => {
            if (i > 5) return; // limit to 5 for test

            const cols = $(el).find('td');
            if (cols.length >= 5) {
                // Typical Trendlyne structure: Date, Stock, Client, Deal Type, Buy/Sell, Quantity, Price
                const date = $(cols[0]).text().trim();
                const stock = $(cols[1]).text().trim();
                const client = $(cols[2]).text().trim();
                const action = $(cols[4]).text().trim(); // BUY/SELL

                deals.push({ date, stock, client, action });
            }
        });

        console.log("Extracted Trendlyne Deals:", deals);

    } catch (e) {
        console.error("Scrape Error:", e);
    }
}

scrapeTrendlyne();
