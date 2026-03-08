"use client";

import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";

interface MarketStatus {
    isOpen: boolean;
    message: string;
    timestamp: string;
}

export function MarketStatusBadge() {
    const { socket, isConnected } = useSocket();
    const [status, setStatus] = useState<MarketStatus | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('market_status', (data: MarketStatus) => {
            setStatus(data);
        });

        return () => {
            socket.off('market_status');
        };
    }, [socket]);

    if (!isConnected || !status) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full text-zinc-400 text-xs font-medium border border-zinc-500/20">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse"></span>
                Connecting...
            </div>
        );
    }

    const isMarketOpen = status.isOpen;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full text-xs font-medium border ${isMarketOpen ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20'}`}>
            <span className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-green-500 shadow-glow-green animate-pulse' : 'bg-red-500 shadow-glow-red'}`}></span>
            {status.message}
        </div>
    );
}
