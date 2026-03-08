const yahooFinance = require('yahoo-finance2').default;

const symbols = [
    'HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS',
    'TCS.NS', 'INFY.NS', 'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS',
    'RELIANCE.NS', 'ONGC.NS', 'POWERGRID.NS', 'NTPC.NS', 'TATAPOWER.NS',
    'ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'TITAN.NS',
    'TATAMOTORS.NS', 'M&M.NS', 'MARUTI.NS', 'BAJAJ-AUTO.NS', 'EICHERMOT.NS'
];

yahooFinance.quote(symbols)
    .then(res => console.log('OK', res.length))
    .catch(err => require('fs').writeFileSync('yf-error.txt', err.stack || err.message));
