'use client';

import React, { useState } from 'react';
import { Activity, ArrowRight, ExternalLink, Flame, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';

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
    };
}

export const DealCard: React.FC<DealDataProps> = ({ deal }) => {
    const [showChart, setShowChart] = useState(false);

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

    return (
        <div className="relative p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all group overflow-hidden flex flex-col gap-3">

            {/* Background Header */}
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider truncate">{deal.ticker}</h3>
                        {getUrgencyIcon()}
                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                            {deal.source} {deal.dealType}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-gray-500 truncate">{deal.companyName}</p>
                        <span className="text-[10px] text-gray-600">•</span>
                        <p className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded" suppressHydrationWarning>
                            <span className="w-1.5 h-1.5 rounded-full bg-electric/70"></span>
                            {new Date(deal.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className={`shrink-0 px-2.5 py-1 rounded-md border text-xs font-bold uppercase whitespace-nowrap ${sentimentStyle}`}>
                    {deal.sentiment.sentiment}
                </div>
            </div>

            {/* Deal Details */}
            <div className="grid grid-cols-2 gap-4 text-sm mt-3 mb-2">
                <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Buyer</p>
                    <p className="font-medium text-white line-clamp-2 leading-tight" title={deal.buyer}>{deal.buyer}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Seller</p>
                    <p className="font-medium text-gray-300 line-clamp-2 leading-tight" title={deal.seller}>{deal.seller}</p>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Value</p>
                    <p className="font-bold text-electric text-base">₹{deal.valueCr.toFixed(1)}<span className="text-[10px] font-normal text-electric/80 ml-0.5">Cr</span></p>
                </div>
                <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Price</p>
                    <p className="font-bold text-white text-base">₹{deal.price.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Stake</p>
                    <p className="font-bold text-gray-200 text-base">{deal.stakePercent}%</p>
                </div>
            </div>

            {/* Impact Score Bar */}
            <div className="mt-2 space-y-1">
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
            <div className="mt-2 flex gap-2">
                <a
                    href={`https://www.tradingview.com/chart/?symbol=${deal.source}:${deal.ticker}`}
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
                        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${deal.source}:${deal.ticker}&interval=D&symboledit=0&saveimage=0&toolbarbg=000000&studies=[]&theme=dark&style=1&timezone=Asia%2FKolkata&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${deal.source}:${deal.ticker}`}
                        className="w-full h-full border-none"
                        allowFullScreen
                    />
                </div>
            )}

        </div>
    );
};
