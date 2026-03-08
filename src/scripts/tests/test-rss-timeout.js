const Parser = require('rss-parser');
const parser = new Parser({ timeout: 5000 });

const SOURCES = [
    { name: 'ET', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
    { name: 'MC', url: 'https://www.moneycontrol.com/rss/marketreports.xml' },
    { name: 'CNBC', url: 'https://www.cnbctv18.com/commonfeeds/v1/cns/market.xml' },
    { name: 'Reuters', url: 'https://news.google.com/rss/search?q=source:reuters+market+india&hl=en-IN&gl=IN&ceid=IN:en' }
];

async function testAll() {
    for (const source of SOURCES) {
        console.log(`\n--- Testing ${source.name} ---`);
        try {
            const start = Date.now();
            const feed = await parser.parseURL(source.url);
            console.log(`Success! Fetched ${feed.items.length} items in ${Date.now() - start}ms.`);
            if (feed.items.length > 0) {
                console.log(`Latest: ${feed.items[0].title} (${feed.items[0].pubDate})`);
            }
        } catch (e) {
            console.error(`FAILED: ${e.message}`);
        }
    }
}

testAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
