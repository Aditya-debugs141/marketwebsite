import urllib.request
import json
import ssl

context = ssl._create_unverified_context()

req = urllib.request.Request(
    'https://www.nseindia.com/api/historical/bulk-deals',
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
)

try:
    # NSE requires a base cookie first before accessing the API
    base_req = urllib.request.Request(
        'https://www.nseindia.com',
        headers=req.headers
    )
    base_resp = urllib.request.urlopen(base_req, context=context)
    cookies = base_resp.headers.get('Set-Cookie')
    if cookies:
        req.add_header('Cookie', cookies)
        
    response = urllib.request.urlopen(req, context=context)
    data = json.loads(response.read().decode('utf-8'))
    print("SUCCESS: Fetched NSE Bulk Deals")
    print(json.dumps(data.get('data', [])[:2], indent=2))
except Exception as e:
    print(f"FAILED: {e}")
