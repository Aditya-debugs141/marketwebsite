async function testLib() {
    try {
        console.log('Testing NSE endpoint via fetch...');

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

        const payload = await res.json() as { data?: unknown[] };
        if (Array.isArray(payload?.data)) {
            console.log(`SUCCESS: fetched ${payload.data.length} index rows`);
            console.log(payload.data.slice(0, 2));
        } else {
            console.log('No data array in payload');
            console.log(payload);
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error('LIB ERROR:', e.message);
        } else {
            console.error('LIB ERROR:', e);
        }
    }
}

testLib();
