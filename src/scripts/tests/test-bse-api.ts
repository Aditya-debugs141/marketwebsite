async function testBSE() {
    try {
        const res = await fetch("https://api.bseindia.com/BseIndiaAPI/api/BulkBlockDeal/w", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json, text/plain, */*"
            }
        });
        const data = await res.json();
        console.log("BSE LIVE API SUCCESS:");
        console.log(data);
    } catch (e) {
        console.error("BSE ERROR:", e);
    }
}
testBSE();
