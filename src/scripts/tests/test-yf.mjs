import yahooFinance from 'yahoo-finance2';
import fs from 'fs';

const symbols = [
    'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
    'TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS',
    'RELIANCE.NS', 'ONGC.NS', 'POWERGRID.NS', 'NTPC.NS', 'TATAPOWER.NS',
    'ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'TITAN.NS',
    'TATAMOTORS.NS', 'M&M.NS', 'MARUTI.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS'
];

try {
    const res = await yahooFinance.quote(symbols);
    console.log('OK', res.length);
} catch (err) {
    fs.writeFileSync('yf-error.txt', err.stack || err.message);
}
