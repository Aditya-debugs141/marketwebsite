'use client';

import { useState, useEffect } from 'react';
import { NewsItem } from '@/lib/news-service';
import { NewsCard } from './NewsCard';
import { useSocket } from '@/hooks/use-socket';
import { Rss } from 'lucide-react';

interface NewsFeedProps {
    initialNews: NewsItem[];
}

export function NewsFeed({ initialNews }: NewsFeedProps) {
    const [news, setNews] = useState<NewsItem[]>(initialNews);
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('news_update', (updatedNews: NewsItem[]) => {
            console.log('Received AI News Update:', updatedNews.length);
            // Merge logic: Update existing items or prepend new ones
            setNews(prev => {
                const newMap = new Map();
                // Add existing items to map
                prev.forEach(item => newMap.set(item.link, item));
                // Update with new items
                updatedNews.forEach(item => newMap.set(item.link, item));

                // Convert back to array and sort by date
                return Array.from(newMap.values())
                    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
            });
        });

        return () => {
            socket.off('news_update');
        };
    }, [socket]);

    return (
        <section className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Rss size={20} className="text-blue-400" />
                    Latest AI Insights
                </h2>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    LIVE AI FEED
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item, index) => (
                    <NewsCard key={`${item.guid || item.link}-${index}`} item={item} index={index} />
                ))}
            </div>

            {news.length === 0 && (
                <div className="p-10 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                    No news found.
                </div>
            )}
        </section>
    );
}
