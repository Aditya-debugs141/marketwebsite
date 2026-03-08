'use client';

import { NewsItem } from '@/lib/news-service';
import { ExternalLink, TrendingUp, TrendingDown, Clock, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewsCardProps {
    item: NewsItem;
    index: number;
}

export function NewsCard({ item, index }: NewsCardProps) {
    const { relatedStock } = item;
    const timeAgo = (dateString: string) => {
        const minutes = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'POSITIVE': case 'Bullish': return 'bg-neon/10 text-neon border-neon/30';
            case 'NEGATIVE': case 'Bearish': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
            default: return 'bg-electric/10 text-electric border-electric/30';
        }
    };

    const getImpactIcon = (impact: string) => {
        switch (impact) {
            case 'POSITIVE': case 'Bullish': return <TrendingUp size={16} />;
            case 'NEGATIVE': case 'Bearish': return <TrendingDown size={16} />;
            default: return <Minus size={16} />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.01 }}
            className="group relative overflow-hidden rounded-2xl glass-card p-6"
        >
            {/* Glow Effect - Very Subtle */}
            <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-[0.05] transition-opacity group-hover:opacity-[0.15] pointer-events-none
        ${(item.ai_sentiment?.sentiment || item.impact.sentiment) === 'Bullish' ? 'bg-neon' : (item.ai_sentiment?.sentiment || item.impact.sentiment) === 'Bearish' ? 'bg-rose-500' : 'bg-electric'}`}
            />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2 items-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getImpactColor(item.ai_sentiment?.sentiment || item.impact.sentiment)}`}>
                            {getImpactIcon(item.ai_sentiment?.sentiment || item.impact.sentiment)}
                            {item.ai_sentiment?.sentiment || item.impact.sentiment}
                            {item.ai_sentiment && (
                                <span className="opacity-75 text-[10px] ml-1">
                                    {(item.ai_sentiment.score * 100).toFixed(0)}% AI
                                </span>
                            )}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {timeAgo(item.pubDate)}
                        </span>
                        <span className="text-xs text-gray-500">|</span>
                        <span className={`text-xs font-medium ${item.source === 'Economic Times' ? 'text-red-400' :
                            item.source === 'MoneyControl' ? 'text-blue-400' :
                                item.source === 'LiveMint' ? 'text-orange-400' :
                                    item.source === 'CNBC TV18' ? 'text-yellow-400' :
                                        item.source === 'Business Standard' ? 'text-indigo-400' :
                                            'text-gray-400'
                            }`}>
                            {item.source}
                        </span>
                    </div>
                </div>

                <div className="mb-4">
                    {/* Related Stock Badge (Interactive) */}
                    {/* Stock Price Badge */}
                    {relatedStock && (
                        <div className="space-y-2">
                            <a
                                href={`https://in.tradingview.com/chart/?symbol=NSE:${relatedStock.symbol.replace('.NS', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/stock w-full"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-semibold text-gray-200 truncate">{relatedStock.symbol.replace('.NS', '')}</span>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-medium shrink-0">NSE</span>
                                </div>
                                <div className="flex items-center gap-3 tabular-nums shrink-0">
                                    <span className="text-gray-300">₹{relatedStock.price.toFixed(2)}</span>
                                    <span className={`text-sm font-medium flex items-center gap-1 ${relatedStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {relatedStock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(relatedStock.changePercent).toFixed(2)}%
                                    </span>
                                </div>
                            </a>

                            {/* Analyst Target Section */}
                            {(relatedStock.targetPrice || relatedStock.recommendation) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    {relatedStock.targetPrice && relatedStock.potentialUpside !== undefined && (
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${relatedStock.potentialUpside > 0
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                            }`}>
                                            {relatedStock.potentialUpside > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            <span className="font-medium tabular-nums">
                                                {relatedStock.potentialUpside > 0 ? 'Upside' : 'Downside'} {Math.abs(relatedStock.potentialUpside).toFixed(1)}%
                                            </span>
                                            <span className="text-gray-500 hidden sm:inline">|</span>
                                            <span className="text-gray-400">Target: ₹{relatedStock.targetPrice.toFixed(0)}</span>
                                        </div>
                                    )}

                                    {relatedStock.recommendation && (
                                        <div className="px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700 text-gray-300 uppercase tracking-wider font-semibold text-[10px]">
                                            {relatedStock.recommendation.replace('_', ' ')}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-semibold text-gray-100 mb-2 leading-snug group-hover:text-white transition-colors">
                    {item.title}
                </h3>

                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {item.contentSnippet}
                </p>

                <div className="flex justify-between items-end border-t border-white/5 pt-3 mt-2">
                    <div className="text-xs text-gray-500 italic max-w-[80%]">
                        <span className="text-gray-600">Recall:</span> <span className="text-gray-400">{item.ai_sentiment?.reasoning || item.impact.reasoning}</span>
                    </div>

                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 transition-all text-gray-400"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
