import { fetchDeepMarketData } from './src/lib/market-service';

fetchDeepMarketData()
    .then(data => {
        console.log(JSON.stringify(data[0], null, 2));
    })
    .catch(console.error);
