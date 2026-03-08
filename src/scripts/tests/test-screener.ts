async function testScreener() {
    console.log("Fetching latest announcements from Screener.in...");
    try {
        const res = await fetch('https://www.screener.in/api/company/8118/announcements/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (!res.ok) {
            console.log("Blocked by Screener:", res.status);
            return;
        }

        const data = await res.json();
        console.log("Screener Announcements Data length:");
        console.log(data);

    } catch (e) {
        console.error("Scrape Error:", e);
    }
}

testScreener();
