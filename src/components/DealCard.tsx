'use client';

import React, { useState } from 'react';
import { ExternalLink, Flame, Info, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';

export interface DealDataProps {
    deal: {
        id: string;
        companyName: string;
        ticker: string;
        buyer: string;
        seller: string;
        dealType: 'Block' | 'Bulk';
        quantity: number;
        price: number;
        valueCr: number;
        stakePercent: number;
        marketTimestamp?: number;
        timestamp: number;
        source: string;
        impact: {
            score: number;
            category: string;
        };
        sentiment: {
            sentiment: string;
            confScore: number;
        };
        alert?: string;
        cmp?: number;
        cmpChangePercent?: number;
    };
}

export const DealCard: React.FC<DealDataProps> = ({ deal }) => {
    const [showChart, setShowChart] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const getSentimentColors = (sentiment: string) => {
        switch (sentiment) {
            case 'Super Bullish': return 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
            case 'Bullish': return 'bg-green-500/10 text-green-300 border-green-500/20';
            case 'Super Bearish': return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'Bearish': return 'bg-red-500/10 text-red-300 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-300 border-gray-500/20';
        }
    };

    const getUrgencyIcon = () => {
        if (deal.impact.score >= 80) return <span title="High Impact"><Flame className="w-4 h-4 text-orange-500" /></span>;
        if (deal.sentiment.sentiment.includes('Bullish')) return <span title="Accumulation"><TrendingUp className="w-4 h-4 text-green-500" /></span>;
        if (deal.sentiment.sentiment.includes('Bearish')) return <span title="Exit"><TrendingDown className="w-4 h-4 text-red-500" /></span>;
        return <span title="Institutional"><ShieldAlert className="w-4 h-4 text-blue-400" /></span>;
    };

    const sentimentStyle = getSentimentColors(deal.sentiment.sentiment);
    // Color the progress bar based on impact score
    const impactColor = deal.impact.score >= 80 ? 'bg-orange-500' : deal.impact.score >= 60 ? 'bg-electric' : 'bg-gray-500';
    const hasCmp = typeof deal.cmp === 'number' && Number.isFinite(deal.cmp);
    const cmpDelta = hasCmp && deal.cmp !== undefined ? deal.cmp - deal.price : 0;
    const dealEventDate = new Date(deal.marketTimestamp ?? deal.timestamp);
    const dealReceivedDate = new Date(deal.timestamp);
    const normalizedTicker = deal.ticker
        .toUpperCase()
        .replace(/\.(NS|BO)$/g, '')
        .replace(/\s+/g, '')
        .trim();
    const tradingViewExchange = deal.source?.toUpperCase() === 'BSE' ? 'BSE' : 'NSE';
    const tradingViewSymbol = `${tradingViewExchange}:${normalizedTicker}`;
    const encodedTradingViewSymbol = encodeURIComponent(tradingViewSymbol);

    return (
        <div className="relative p-3 sm:p-4 rounded-xl bg-black/45 border border-white/10 hover:border-cyan-400/30 hover:bg-black/55 transition-all duration-300 ease-out hover:-translate-y-0.5 group overflow-hidden flex flex-col gap-3 shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
            <button
                onClick={() => setShowInfo((v) => !v)}
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
                title="Deal details"
                aria-label="Show deal details"
            >
                <Info className="w-3.5 h-3.5" />
            </button>

            {/* Background Header */}
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0 pr-10">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white uppercase truncate">{deal.ticker}</h3>
                        {getUrgencyIcon()}
                        <span className="text-[10px] uppercase font-bold text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                            {deal.source} {deal.dealType}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-gray-500 truncate max-w-[65%]">{deal.companyName}</p>
                        <span className="text-[10px] text-gray-600">•</span>
                        <p className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded" suppressHydrationWarning>
                            <span className="w-1.5 h-1.5 rounded-full bg-electric/70"></span>
                            Market: {dealEventDate.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-md border text-xs font-bold uppercase whitespace-nowrap ${sentimentStyle}`}>
                        {deal.sentiment.sentiment}
                    </div>
                </div>
            </div>

            {showInfo && (
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 grid grid-cols-2 gap-x-3 gap-y-1">
                    <span className="text-gray-400">Deal ID</span>
                    <span className="text-right truncate" title={deal.id}>{deal.id}</span>

                    <span className="text-gray-400">Deal Type</span>
                    <span className="text-right">{deal.dealType}</span>

                    <span className="text-gray-400">Source</span>
                    <span className="text-right">{deal.source}</span>

                    <span className="text-gray-400">Quantity</span>
                    <span className="text-right">{deal.quantity.toLocaleString('en-IN')}</span>

                    <span className="text-gray-400">Date</span>
                    <span className="text-right">{dealEventDate.toLocaleDateString('en-IN')}</span>

                    <span className="text-gray-400">Time (Market)</span>
                    <span className="text-right">{dealEventDate.toLocaleTimeString('en-IN')}</span>

                    <span className="text-gray-400">Received At</span>
                    <span className="text-right">{dealReceivedDate.toLocaleTimeString('en-IN')}</span>
                </div>
            )}

            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Stock</p>
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-bold text-white text-base leading-tight truncate" title={`${deal.companyName} (${deal.ticker})`}>
                            {deal.ticker}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{deal.companyName}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {deal.source}
                    </span>
                </div>
            </div>

            {/* Deal Details */}
            <div className="grid grid-cols-2 gap-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-2">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Buyer</p>
                    <p className="font-medium text-white text-sm break-words whitespace-normal" title={deal.buyer}>{deal.buyer}</p>
                </div>
                <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-2">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Seller</p>
                    <p className="font-medium text-gray-300 text-sm break-words whitespace-normal" title={deal.seller}>{deal.seller}</p>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <div className="rounded-md border border-white/10 bg-black/20 p-2 min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Value</p>
                    <p className="font-bold text-electric text-sm sm:text-base truncate">₹{deal.valueCr.toFixed(1)} Cr</p>
                </div>
                <div className="rounded-md border border-white/10 bg-black/20 p-2 min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Deal Price</p>
                    <p className="font-bold text-white text-sm sm:text-base truncate">₹{deal.price.toFixed(2)}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-black/20 p-2 min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Stake</p>
                    <p className="font-bold text-gray-200 text-sm sm:text-base truncate">{deal.stakePercent.toFixed(2)}%</p>
                </div>
            </div>

            <div className="text-[10px] text-gray-500 -mt-1">Displayed price is the reported block/bulk transaction price.</div>

            <div className="rounded-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-cyan-500/3 to-cyan-500/5 px-3 py-3 relative overflow-hidden">
                {/* Market status indicator */}
                <div className="absolute top-2 right-2">
                    {hasCmp ? (
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" style={{
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            }}></div>
                            <span className="text-[9px] text-cyan-300 uppercase font-bold tracking-wider">LIVE</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">MARKET CLOSED</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] text-cyan-200/70 uppercase tracking-wider">
                                {hasCmp ? 'Live Market Price' : 'Last Closing Price'}
                            </p>
                            {hasCmp && deal.cmpChangePercent !== undefined && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    deal.cmpChangePercent >= 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                    {deal.cmpChangePercent >= 0 ? '↗' : '↘'} {Math.abs(deal.cmpChangePercent).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-lg sm:text-xl font-bold text-cyan-300">
                                {hasCmp ? `₹${deal.cmp!.toFixed(2)}` : 'Fetching...'}
                            </p>
                            {!hasCmp && (
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-cyan-200/60 mt-1">
                            {hasCmp ? 'Source: AngelOne/NSE Real-Time' : 'Source: Market Closed - Last Price'}
                        </p>
                    </div>
                    
                    {hasCmp && (
                        <div className="text-left sm:text-right bg-black/30 rounded-lg border border-white/10 p-2 sm:min-w-[120px]">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] text-gray-400">vs Deal:</span>
                                    <span className={`text-xs font-bold ${cmpDelta >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                        {cmpDelta >= 0 ? '+' : ''}₹{cmpDelta.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] text-gray-400">Change:</span>
                                    <span className={`text-xs font-bold ${typeof deal.cmpChangePercent === 'number' && deal.cmpChangePercent >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                        {typeof deal.cmpChangePercent === 'number' ? `${deal.cmpChangePercent >= 0 ? '+' : ''}${deal.cmpChangePercent.toFixed(2)}%` : '—'}
                                    </span>
                                </div>
                                {Math.abs(cmpDelta) > 0 && (
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                                        <span className="text-[10px] text-gray-400">P&L:</span>
                                        <span className={`text-xs font-bold ${cmpDelta >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                            {((cmpDelta / deal.price) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Impact Score Bar */}
            <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex justify-between text-[10px] text-gray-500">
                    <span className="uppercase tracking-wider">Impact Score</span>
                    <span>{deal.impact.score}/100 - {deal.impact.category}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${impactColor}`}
                        style={{ width: `${deal.impact.score}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <a
                    href={`https://www.tradingview.com/chart/?symbol=${encodedTradingViewSymbol}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-center text-gray-300 hover:text-white transition-colors flex justify-center items-center gap-1"
                >
                    View Full Chart <ExternalLink className="w-3 h-3" />
                </a>
                <button
                    onClick={() => setShowChart(!showChart)}
                    className="px-3 py-2 rounded bg-electric/10 text-electric hover:bg-electric/20 border border-electric/20 text-xs font-bold transition-colors"
                >
                    {showChart ? 'Close Mini' : 'Mini'}
                </button>
            </div>

            {/* Mini TradingView Embedded Chart */}
            {showChart && (
                <div className="mt-2 h-48 w-full rounded overflow-hidden border border-white/10 bg-black/50">
                    <iframe
                        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodedTradingViewSymbol}&interval=D&symboledit=0&saveimage=0&toolbarbg=000000&studies=[]&theme=dark&style=1&timezone=Asia%2FKolkata&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${encodedTradingViewSymbol}`}
                        className="w-full h-full border-none"
                        allowFullScreen
                    />
                </div>
            )}

        </div>
    );
};
