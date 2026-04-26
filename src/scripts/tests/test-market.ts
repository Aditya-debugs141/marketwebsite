import { fetchDeepMarketData } from '../../lib/market-service';

fetchDeepMarketData().then((res: unknown) => {
    if (Array.isArray(res)) {
        console.log('Got Market Data:', res.length, 'sectors');
        if (res.length > 0) {
            console.log('Sector 1:', res[0].name, '- Stocks:', res[0].children?.length || 0);
        }
    }
}).catch(console.error);
