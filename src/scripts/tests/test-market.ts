import { fetchDeepMarketData } from './src/lib/market-service';

fetchDeepMarketData().then(res => {
    console.log('Got Market Data:', res.length, 'sectors');
    if (res.length > 0) {
        console.log('Sector 1:', res[0].name, '- Stocks:', res[0].children.length);
    }
}).catch(console.error);
