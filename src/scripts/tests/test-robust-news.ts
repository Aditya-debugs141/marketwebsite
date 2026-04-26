import { fetchNews } from '../../lib/news-service';

async function main() {
    console.log('[Test Start] Fetching news using advanced pipeline with timeouts and active structured logging...\n');

    const startTime = Date.now();
    
    // fetchNews doesn't take any parameters
    const uniqueNews = await fetchNews();

    const endTime = Date.now();
    
    const fs = require('fs');
    console.log(`\n[Test End] Pipeline Execution time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log(`[Test End] Total unique items successfully fetched and normalized: ${uniqueNews.length}`);

    // Verify fallback behavior or basic structure
    if (uniqueNews.length > 0) {
        fs.writeFileSync('test-output.json', JSON.stringify(uniqueNews, null, 2));
        console.log('\nResults written to test-output.json');
    }
}

main().catch(console.error);
