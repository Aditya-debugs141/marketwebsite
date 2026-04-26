import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import { fetchNews } from '../lib/news-service';

const PORT = 3001;
const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});

import { fetchSectorData, SectorData, MarketHierarchy } from '../lib/market-service';
import { AngelOneService } from './angel-one-service';
import { getFastHeatmapData } from './heatmap-aggregator';

const angelService = new AngelOneService();
const angelConfigured = angelService.isConfigured();
// Initialize Angel One login
if (angelConfigured) {
    angelService.login().catch(err => console.error('Angel One Init Failed:', err));
} else {
    console.warn('Angel One credentials not configured. Running with fallback index prices.');
}

// State
let lastNewsTime = 0;
let lastSectorTime = 0;
let lastHeatmapTime = 0;
let lastSectorData: SectorData[] = [];
let lastHeatmapData: MarketHierarchy[] = [];

// Concurrency Locks
let isFetchingNews = false;
let isFetchingSector = false;
let isFetchingHeatmap = false;

io.on('connection', (socket) => {
    console.log('WS Client connected:', socket.id);

    // Send immediate initial data if available
    socket.emit('status', { ai_ready: true });

    // Send cached sector data immediately (0 latency feel)
    if (lastSectorData.length > 0) {
        socket.emit('sector_update', lastSectorData);
    }

    // Send cached heatmap data
    if (lastHeatmapData.length > 0) {
        socket.emit('heatmap_update', lastHeatmapData);
    } else {
        // Fallback dummy data if Yahoo 429 happens instantly on server start
        socket.emit('heatmap_update', [
            { name: "Financials", value: 10000, children: [{ name: "HDFCBANK", value: 5000, price: 1600, change: 1.2, volume: 100 }, { name: "ICICIBANK", value: 5000, price: 1000, change: -0.5, volume: 100 }] },
            { name: "Technology", value: 8000, children: [{ name: "TCS", value: 4000, price: 4000, change: 0.8, volume: 100 }, { name: "INFY", value: 4000, price: 1500, change: 2.1, volume: 100 }] }
        ]);
    }

    // Removed force initial fetch on connection to avoid extreme Yahoo rate limits due to concurrent polling.
    // The background job will handle it automatically.

    socket.on('disconnect', () => {
        console.log('WS Client disconnected:', socket.id);
    });
});

// Market Hours Utility (IST)
function getMarketStatus() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcTime + istOffset);

    const day = istDate.getDay(); // 0 is Sunday
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // Market Hours: 09:15 to 15:30 IST
    const MARKET_OPEN_MIN = 9 * 60 + 15;
    const MARKET_CLOSE_MIN = 15 * 60 + 30;

    const isWeekend = day === 0 || day === 6;
    const isWithinHours = timeInMinutes >= MARKET_OPEN_MIN && timeInMinutes <= MARKET_CLOSE_MIN;

    return {
        isOpen: !isWeekend && isWithinHours,
        message: isWeekend ? 'Market Closed (Weekend)' : !isWithinHours ? 'Market Closed' : 'Market Open',
        timestamp: istDate.toISOString()
    };
}

// Real-Time Jobs
async function runJobs() {
    const status = getMarketStatus();

    // Broadcast Market Status
    io.emit('market_status', status);

    // 1. Price Updates - ONLY if Market is Open
    // Or if we just want to test real data regardless of market hours for now
    if (true) { // Changed to true for testing, revert to status.isOpen later
        try {
            // Fetch Real NIFTY Data
            const niftyLtp = angelConfigured ? await angelService.getMarketData('NIFTY') : null;
            if (niftyLtp) {
                io.emit('price_update', {
                    symbol: '^NSEI', // Keep Yahoo symbol for frontend compatibility
                    price: niftyLtp,
                    change: 0, // Angel One LTP doesn't give change directly here, would need previous close
                    timestamp: new Date().toISOString()
                });
            } else {
                 // Fallback to simulated if Angel One fails or returns null
                 const niftyPrice = 22011.63 + (Math.random() * 10 - 5);
                 io.emit('price_update', {
                     symbol: '^NSEI',
                     price: Math.round(niftyPrice * 100) / 100,
                     timestamp: new Date().toISOString()
                 });
            }

            // Fetch Real SENSEX Data
            const sensexLtp = angelConfigured ? await angelService.getMarketData('SENSEX') : null;
             if (sensexLtp) {
                io.emit('price_update', {
                    symbol: '^BSESN',
                    price: sensexLtp,
                    change: 0,
                    timestamp: new Date().toISOString()
                });
            } else {
                 const sensexPrice = 72400 + (Math.random() * 20 - 10);
                 io.emit('price_update', {
                     symbol: '^BSESN',
                     price: Math.round(sensexPrice * 100) / 100,
                     timestamp: new Date().toISOString()
                 });
            }

            // Fetch Real BANK NIFTY Data
            const bankNiftyLtp = angelConfigured ? await angelService.getMarketData('BANKNIFTY') : null;
            if (bankNiftyLtp) {
                io.emit('price_update', {
                    symbol: '^NSEBANK',
                    price: bankNiftyLtp,
                    change: 0,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Price Update Error:', error);
        }
    }

    // 2. Sector Heatmap Data (Every 15s for faster real-time updates)
    const now = Date.now();
    const sectorInterval = 15000;

    if (!isFetchingSector && now - lastSectorTime > sectorInterval) {
        isFetchingSector = true;
        try {
            console.log(`[${status.timestamp}] Fetching Sector Data...`);
            const sectors = await fetchSectorData();
            if (sectors.length > 0) {
                lastSectorData = sectors; // Update cache
                io.emit('sector_update', sectors);
            }
            lastSectorTime = Date.now();
        } catch (e) {
            console.error('Sector Job Failed:', e);
        } finally {
            isFetchingSector = false;
        }
    }

    // 3. News Updates (Every 30s) - Runs 24/7
    if (!isFetchingNews && now - lastNewsTime > 30000) {
        isFetchingNews = true;
        console.log(`[${status.timestamp}] Fetching News... Market: ${status.isOpen ? 'OPEN' : 'CLOSED'}`);
        try {
            const newsItems = await fetchNews();
            io.emit('news_update', newsItems.slice(0, 5));
            lastNewsTime = Date.now();
        } catch (e) {
            console.error('News Job Failed:', e);
        } finally {
            isFetchingNews = false;
        }
    }

    // 4. Deep Market Heatmap (Every 15s for near real-time updates with provider race + cache)
    if (!isFetchingHeatmap && now - lastHeatmapTime > 15000) {
        isFetchingHeatmap = true;
        try {
            const result = await getFastHeatmapData({ allowStaleWhileRefreshing: true });
            const heatmapData = result.data;

            if (heatmapData.length > 0) {
                console.log(`[${status.timestamp}] Emitting Heatmap Data: ${heatmapData.length} sectors (${result.source}${result.stale ? ', stale' : ''})`);
                lastHeatmapData = heatmapData;
                io.emit('heatmap_update', heatmapData);
            } else {
                console.log(`[${status.timestamp}] Failed to fetch Heatmap Data, retaining old cache if exists.`);
            }

            lastHeatmapTime = Date.now();
        } catch (e) {
            console.error('Heatmap Job Failed:', e);
        } finally {
            isFetchingHeatmap = false;
        }
    }
}

// Loop
setInterval(runJobs, 2000);

httpServer.listen(PORT, () => {
    console.log(`> WebSocket Server Ready on http://localhost:${PORT}`);
});
