'use client';

import { useState, useEffect } from 'react';
import { NewsItem } from '@/lib/news-service';
import { NewsCard } from './NewsCard';
import { useSocket } from '@/hooks/use-socket';
import { Rss, X } from 'lucide-react';

interface NewsFeedProps {
    initialNews: NewsItem[];
}

export function NewsFeed({ initialNews }: NewsFeedProps) {
    const [news, setNews] = useState<NewsItem[]>(initialNews);
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
    const { socket } = useSocket();

    useEffect(() => {
        // Check for selected ticker from sessionStorage
        const ticker = sessionStorage.getItem('selectedTicker');
        if (ticker) {
            setSelectedTicker(ticker);
            sessionStorage.removeItem('selectedTicker');
        }
    }, []);

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

    // Filter news based on selected ticker
    const filteredNews = selectedTicker 
        ? news.filter(item => 
            item.title?.toUpperCase().includes(selectedTicker.toUpperCase()) ||
            item.description?.toUpperCase().includes(selectedTicker.toUpperCase())
        )
        : news;

    return (
        <section id="news-feed" className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Rss size={20} className="text-blue-400" />
                        Latest AI Insights
                    </h2>
                    {selectedTicker && (
                        <div className="flex items-center gap-2 bg-electric/20 px-3 py-1 rounded-lg">
                            <span className="text-sm font-bold text-electric">{selectedTicker}</span>
                            <button
                                onClick={() => setSelectedTicker(null)}
                                className="hover:text-red-400 transition-colors"
                                title="Clear filter"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    LIVE AI FEED
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map((item, index) => (
                    <NewsCard key={`${item.guid || item.link}-${index}`} item={item} index={index} />
                ))}
            </div>

            {filteredNews.length === 0 && (
                <div className="p-10 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                    {selectedTicker ? `No news found for ${selectedTicker}.` : 'No news found.'}
                </div>
            )}
        </section>
    );
}
