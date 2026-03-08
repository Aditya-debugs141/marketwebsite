import asyncio
import json
import csv
import io
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            accept_downloads=True
        )
        page = await context.new_page()

        try:
            # We don't even need to render a page, just grab the BSE bulk deal API which returns CSV text sometimes
            # Or use Trendlyne's open JSON endpoint if it exists
            
            # Let's try grabbing the actual trendlyne API endpoint that powers their table
            response = await page.goto("https://trendlyne.com/features/bulk-block-deals/ajax/", timeout=30000)
            
            if response.ok:
                html = await response.text()
                if len(html) > 50:
                    print(json.dumps({"success": True, "source": "trendlyne", "length": len(html)}))
                else:
                    print(json.dumps({"success": False, "error": "Empty response"}))
            else:
                 print(json.dumps({"success": False, "error": f"Trendlyne blocked {response.status}"}))

        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
