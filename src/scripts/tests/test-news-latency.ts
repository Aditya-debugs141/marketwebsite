import { fetchNews, NewsItem } from '../../lib/news-service';

async function testNews() {
    console.log("Fetching news...");
    const news = await fetchNews();
    console.log(`Found ${news.length} relevant news items.`);
    if (news.length > 0) {
        console.log("Latest 5 items:");
        news.slice(0, 5).forEach((item: NewsItem, i: number) => {
            console.log(`\n[${i + 1}] ${item.title}`);
            console.log(`Source: ${item.source}`);
            console.log(`Published: ${item.pubDate} (Actual time now: ${new Date().toISOString()})`);
            console.log(`Link: ${item.link}`);
        });
    }
}

testNews().catch(console.error);
