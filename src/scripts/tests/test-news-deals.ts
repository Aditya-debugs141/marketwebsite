import Parser from 'rss-parser';

const parser = new Parser();

// Economic Times Block Deals Specific RSS
const ET_BLOCK_DEALS_URL = 'https://economictimes.indiatimes.com/markets/stocks/news/rssfeeds/2146842.cms'; // Stocks News
const MC_MARKET_NEWS = 'https://www.moneycontrol.com/rss/marketreports.xml';

async function fetchRealDealsFromNews() {
    try {
        console.log("Fetching real block deals from trusted news feeds...");

        const feed = await parser.parseURL(MC_MARKET_NEWS);

        const possibleDeals = feed.items.filter(item => {
            const text = (item.title + " " + (item.contentSnippet || "")).toLowerCase();
            return text.includes('block deal') || text.includes('bulk deal') || text.includes('buys stake') || text.includes('sells stake');
        });

        console.log(`Found ${possibleDeals.length} real deal announcements in recent MoneyControl news.`);

        possibleDeals.slice(0, 3).forEach(deal => {
            console.log("---");
            console.log("Title: ", deal.title);
            console.log("Snippet: ", deal.contentSnippet);
            console.log("Date: ", deal.pubDate);
        });

    } catch (e) {
        console.error("Scraper Error:", e);
    }
}

fetchRealDealsFromNews();
