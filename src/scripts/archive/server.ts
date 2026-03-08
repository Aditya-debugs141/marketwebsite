import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);
    const io = new Server(httpServer);

    // Socket.io Connection Handler
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        // Handle client subscription (e.g., specific tickers)
        socket.on('subscribe', (ticker) => {
            console.log(`Client ${socket.id} subscribed to ${ticker}`);
            socket.join(ticker);
        });
    });

    // Simulated Price Ticker (Replace with Real NSE API later)
    setInterval(() => {
        const dummyPrice = Math.random() * 100 + 3000;
        io.emit('price_update', { symbol: 'TCS.NS', price: dummyPrice.toFixed(2) });
    }, 2000);

    // Handle Next.js Requests
    server.all('*', (req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log('> WebSocket Server Ready');
    });
});
