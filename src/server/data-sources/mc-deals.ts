import { exec } from 'child_process';
import path from 'path';
import { DealData } from '../cache/deal-cache';

let persistentMcDeals: Omit<DealData, 'id'>[] = [];
let isFetching = false;

export async function fetchMoneyControlDeals(): Promise<Omit<DealData, 'id'>[]> {
    if (isFetching && persistentMcDeals.length > 0) {
        return persistentMcDeals; // Return cache while fetching
    }

    isFetching = true;
    console.log("Executing Python Playwright Scraper for Real Deals...");

    return new Promise((resolve) => {
        const scriptPath = path.join(process.cwd(), 'python_deal_scraper.py');
        exec(`python "${scriptPath}"`, (error, stdout) => {
            isFetching = false;

            if (error) {
                console.error("Python Scraper Exec Error:", error);
                resolve(persistentMcDeals);
                return;
            }

            try {
                // Find the JSON block in the python output (ignoring any pip warnings etc)
                const jsonMatch = stdout.match(/\{"success":.*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    if (result.success && result.data && result.data.length > 0) {
                        persistentMcDeals = result.data;
                        console.log(`Successfully scraped ${persistentMcDeals.length} REAL deals!`);
                    } else {
                        console.error("Python Scraper failed internally:", result.error);
                    }
                }
            } catch (e) {
                console.error("Failed to parse Python output:", e);
                console.log("Raw output was:", stdout);
            }

            resolve(persistentMcDeals);
        });
    });
}
