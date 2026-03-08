import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

console.log('Script starting...');

async function checkTargetData(symbol: string) {
    try {
        const quote = await yahooFinance.quote(symbol);
        console.log(`Quote for ${symbol}:`);
        console.log('Regular Price:', quote.regularMarketPrice);

        // Use type assertion or access properties safely if types are incomplete
        const anyQuote = quote as unknown as Record<string, unknown>;
        console.log('Target Mean Price:', anyQuote.targetMeanPrice || 'N/A');
        console.log('Recommendation:', anyQuote.recommendationKey || 'N/A');

        // Also try quoteSummary for more details
        const summary = await yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics'] });
        console.log('\nQuote Summary Financial Data:');
        console.log('Target Mean:', summary.financialData?.targetMeanPrice);
        console.log('Current Price:', summary.financialData?.currentPrice);
        console.log('Recommendation:', summary.financialData?.recommendationKey);
    } catch (error) {
        console.error('Error fetching data:', error instanceof Error ? error.message : String(error));
    }
}

// Run the function
checkTargetData('TCS.NS');
