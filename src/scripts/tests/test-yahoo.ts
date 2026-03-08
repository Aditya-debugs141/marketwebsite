import yahooFinance from 'yahoo-finance2';

const SECTOR_MKTS = [
    { name: 'NIFTY BANK', symbol: '^NSEBANK' },
    { name: 'NIFTY IT', symbol: '^CNXIT' },
    { name: 'NIFTY AUTO', symbol: '^CNXAUTO' },
    { name: 'NIFTY PHARMA', symbol: '^CNXPHARMA' },
    { name: 'NIFTY METAL', symbol: '^CNXMETAL' },
    { name: 'NIFTY FMCG', symbol: '^CNXFMCG' },
    { name: 'NIFTY ENERGY', symbol: '^CNXENERGY' },
    { name: 'NIFTY REALTY', symbol: '^CNXREALTY' },
];

async function testFetch() {
    console.log("Testing Yahoo Finance Fetch...");
    for (const sector of SECTOR_MKTS) {
        try {
            const quote = await yahooFinance.quote(sector.symbol) as Record<string, unknown>;
            console.log(`[PASS] ${sector.name} (${sector.symbol}): ${quote.regularMarketPrice}`);
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.error(`[FAIL] ${sector.name} (${sector.symbol}):`, e.message);
            } else {
                console.error(`[FAIL] ${sector.name} (${sector.symbol}):`, e);
            }
        }
    }
}

testFetch();
