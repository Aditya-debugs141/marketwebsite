"use client";

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const useSocket = () => {
    const socket = useMemo<Socket>(() => io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
    }), []);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Connected to WS Server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WS Server');
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [socket]);

    return { socket, isConnected };
};
