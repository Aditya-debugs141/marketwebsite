import { fetchDeepMarketData } from '../../lib/market-service';

fetchDeepMarketData()
    .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
            console.log(JSON.stringify(data[0], null, 2));
        }
    })
    .catch(console.error);
