import { fetchNews } from '@/lib/news-service';
import { getMarketIndices } from '@/lib/stock-service';
import { NewsFeed } from '@/components/NewsFeed';
import { RefreshButton } from '@/components/RefreshButton';
import { MarketTicker } from '@/components/MarketTicker';
import { Activity } from 'lucide-react';
import MarketHeatmap from '@/components/MarketHeatmap';
import { AiConfidenceMeter } from '@/components/AiConfidenceMeter';
import { MarketStatusBadge } from '@/components/MarketStatusBadge';
import { MotionDiv, MotionSection } from '@/components/MotionWrapper';
import { BlockBulkDealTracker } from '@/components/BlockBulkDealTracker';
import { SmartMoneyRadar } from '@/components/SmartMoneyRadar';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable all caching directly

export default async function Home() {
  const newsItems = await fetchNews();
  const sortedNews = newsItems.sort((a, b) => b.impact.impactScore - a.impact.impactScore);
  const marketIndices = await getMarketIndices();

  return (
    <main className="min-h-screen relative overflow-hidden selection:bg-electric/30">

      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-electric/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Ticker - Slides Down */}
      <MotionDiv
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 border-b border-white/5 bg-darkpanel"
      >
        <MarketTicker indices={marketIndices} />
      </MotionDiv>

      {/* Grand Hero Section */}
      <div className="relative pt-24 pb-16 flex flex-col justify-center items-center px-4 z-10 text-center">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-electric/10 border border-electric/20 rounded-full text-electric text-xs font-semibold tracking-widest uppercase mb-4 shadow-glow-blue">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-electric"></span>
            </span>
            TradeMind AI Alpha v2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 leading-tight">
            AI That Reads The Market <br />
            <span className="text-glow-electric bg-clip-text text-transparent bg-gradient-to-r from-electric to-neon">Before It Moves.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto">
            Real-time institutional-grade stock intelligence, AI-driven insights, and sophisticated sentiment tracking wrapped in a premium dashboard.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8 pt-4">
            <a href="#dashboard" className="px-8 py-4 bg-electric text-black font-bold rounded-xl hover:bg-white transition-all shadow-glow-blue hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 block">
              Explore Dashboard
            </a>
            <a href="#heatmap" className="px-8 py-4 bg-white/5 text-white font-medium rounded-xl border border-white/10 glass-hover flex items-center gap-2">
              <Activity size={18} className="text-electric" />
              View Live Markets
            </a>
          </div>
        </MotionDiv>
      </div>

      <div id="dashboard" className="container mx-auto px-4 lg:px-8 pb-20 max-w-[1600px] mt-10">
        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Activity className="text-electric" /> Pulse Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <MarketStatusBadge />
            <RefreshButton />
          </div>
        </div>

        <div className="space-y-8">
          {/* Hero Section: Market Heatmap - Scales Up */}
          <MotionDiv
            id="heatmap"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full relative z-20 h-[500px] lg:h-[600px] bg-black/40 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md scroll-mt-24"
          >
            <MarketHeatmap />
          </MotionDiv>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Slides from Left */}
            <aside id="ai-signals" className="lg:col-span-1 space-y-8 scroll-mt-24">
              <MotionDiv
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="sticky top-24 space-y-8"
              >
                <AiConfidenceMeter />

                {/* Institutional Block Deals */}
                <BlockBulkDealTracker />

                {/* Daily Aggregation Radar */}
                <SmartMoneyRadar />
              </MotionDiv>
            </aside>

            {/* Main News Feed - Fades Up */}
            <MotionSection
              id="news"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="lg:col-span-3 scroll-mt-24"
            >
              <NewsFeed initialNews={sortedNews} />
            </MotionSection>
          </div>
        </div>
      </div>
    </main>
  );
}
