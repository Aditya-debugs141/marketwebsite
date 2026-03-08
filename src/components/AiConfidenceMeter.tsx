'use client';

import { motion } from 'framer-motion';
import { Radar } from 'lucide-react';
import { useSocket } from '@/hooks/use-socket';
import { useState, useEffect } from 'react';
import { NewsItem } from '@/lib/news-service';

interface AiConfidenceMeterProps {
    initialScore?: number; // 0 to 1
    initialSentiment?: 'Bullish' | 'Bearish' | 'Neutral';
}

export function AiConfidenceMeter({ initialScore = 0.5, initialSentiment = 'Neutral' }: AiConfidenceMeterProps) {
    const { socket } = useSocket();
    const [score, setScore] = useState(initialScore);
    const [sentiment, setSentiment] = useState(initialSentiment);

    useEffect(() => {
        if (!socket) return;

        socket.on('news_update', (news: NewsItem[]) => {
            if (!news || news.length === 0) return;

            // Calculate aggregate sentiment
            let totalScore = 0;
            let sentimentCount = 0;

            news.forEach(item => {
                if (item.ai_sentiment) {
                    // Map sentiment to -1, 0, 1 scale
                    let val = 0;
                    if (item.ai_sentiment.sentiment === 'Bullish') val = 1;
                    else if (item.ai_sentiment.sentiment === 'Bearish') val = -1;

                    // Weight by confidence score
                    totalScore += val * item.ai_sentiment.score;
                    sentimentCount++;
                }
            });

            if (sentimentCount > 0) {
                const avg = totalScore / sentimentCount; // -1 to 1

                // Map back to 0-1 for meter (0.5 is neutral)
                // -1 -> 0, 0 -> 0.5, 1 -> 1
                const normalizedScore = (avg + 1) / 2;

                setScore(normalizedScore);

                if (normalizedScore > 0.6) setSentiment('Bullish');
                else if (normalizedScore < 0.4) setSentiment('Bearish');
                else setSentiment('Neutral');
            }
        });

        return () => {
            socket.off('news_update');
        };
    }, [socket]);

    const percentage = Math.round(score * 100);

    // Mapping sentiment to the new premium colors
    const color = sentiment === 'Bullish' ? '#00FF88' : sentiment === 'Bearish' ? '#f43f5e' : '#00D4FF';
    const glowClass = sentiment === 'Bullish' ? 'drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]' :
        sentiment === 'Bearish' ? 'drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]' :
            'drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]';

    return (
        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center gap-6 w-full relative overflow-hidden group">
            {/* Ambient background glow based on sentiment */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] opacity-20 transition-colors duration-1000"
                style={{ backgroundColor: color }} />

            <div className="flex items-center justify-between w-full relative z-10">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Radar className="text-electric w-4 h-4" />
                    Market Sentiment
                </h3>
                <div className="px-2.5 py-1 rounded border border-white/10 text-[10px] font-bold bg-white/5 text-white shadow-premium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></span>
                    AI LIVE
                </div>
            </div>

            <div className="relative w-36 h-36 flex items-center justify-center z-10">
                <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 120 120">
                    {/* Background Circle */}
                    <circle
                        cx="60"
                        cy="60"
                        r="40" // Radius
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-800/50"
                    />
                    {/* Foreground Circle - Glowing */}
                    <motion.circle
                        cx="60"
                        cy="60"
                        r="40"
                        stroke={color}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={251.32}
                        strokeDashoffset={251.32}
                        animate={{ strokeDashoffset: 251.32 - (251.32 * percentage) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        className={glowClass}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-black text-white tracking-tighter" style={{ textShadow: `0 0 20px ${color}` }}>{percentage}<span className="text-lg text-gray-400 ml-0.5">%</span></span>
                </div>
            </div>

            <div className="text-center relative z-10">
                <p className="text-xs font-mono text-gray-500 mb-2 uppercase tracking-widest">Confidence Index</p>
                <div className="flex items-center justify-center gap-2 px-6 py-2 rounded-full glass border-white/10">
                    <span className="text-xl font-bold tracking-tight uppercase" style={{ color: color, textShadow: `0 0 10px ${color}` }}>
                        {sentiment}
                    </span>
                </div>
            </div>
        </div>
    );
}
