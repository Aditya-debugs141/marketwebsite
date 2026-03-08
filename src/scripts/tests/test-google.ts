import * as cheerio from 'cheerio';

async function scrapeGoogleFinance() {
    console.log("Fetching Google Finance for Indian Block Deals News...");
    try {
        const res = await fetch('https://www.google.com/finance/quote/NIFTY_50:INDEXNSE', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            console.log("Blocked:", res.status);
            return;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        const newsDeals: any[] = [];

        // Google Finance news section class structure
        $('.yY3zW').each((i, el) => {
            const title = $(el).find('.Yfwt5').text() || "";
            const source = $(el).find('.sfyJob').text() || "";
            const time = $(el).find('.Adak').text() || "";

            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('block deal') || lowerTitle.includes('bulk deal') || lowerTitle.includes('buys') || lowerTitle.includes('sells')) {
                newsDeals.push({ title, source, time });
            }
        });

        console.log("Extracted Deals from Google Finance:");
        console.log(newsDeals);

    } catch (e) {
        console.error("Scrape Error:", e);
    }
}

scrapeGoogleFinance();
