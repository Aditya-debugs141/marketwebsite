async function testNSE() {
    console.log('Testing NSE endpoint via fetch...');
    try {
        const res = await fetch('https://www.nseindia.com/api/allIndices', {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'referer': 'https://www.nseindia.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`NSE request failed with status ${res.status}`);
            return;
        }

        const payload = await res.json() as { data?: Array<Record<string, unknown>> };
        if (Array.isArray(payload?.data) && payload.data.length > 0) {
            const first = payload.data[0];
            console.log('First Item Keys:', Object.keys(first));
            console.log('Sample:', first);
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error('NSE Test Failed:', e.message);
        } else {
            console.error('NSE Test Failed:', e);
        }
    }
}

testNSE();
