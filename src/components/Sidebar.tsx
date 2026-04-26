'use client';

import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Activity,
    Radar,
    MessageSquareText,
    Briefcase,
    Bell,
    Settings
} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
    const [, setHoveredIndex] = useState<number | null>(null);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '#dashboard', active: true },
        { icon: Activity, label: 'Live Markets', href: '#heatmap' },
        { icon: Radar, label: 'AI Signals', href: '#ai-signals' },
        { icon: MessageSquareText, label: 'News Sentiment', href: '#news' },
        { icon: Briefcase, label: 'Portfolio Tracker', href: '#' },
    ];

    const bottomItems = [
        { icon: Bell, label: 'Alerts' },
        { icon: Settings, label: 'Settings' },
    ];

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 h-screen w-20 flex flex-col items-center py-8 glass-panel border-r border-white/5 z-[100]"
        >
            {/* Logo area */}
            <div className="mb-12 relative group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric to-purple p-[1px]">
                    <div className="w-full h-full rounded-xl bg-darkbg flex items-center justify-center relative overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-electric/20 mix-blend-overlay"
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-electric to-neon tracking-tighter">AI</span>
                    </div>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 left-14 bg-darkpanel border border-white/10 px-3 py-1.5 rounded-lg opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50">
                    <span className="text-sm font-semibold text-white">AlphaPulse AI</span>
                </div>
            </div>

            {/* Main Nav */}
            <nav className="flex flex-col gap-6 w-full items-center flex-1">
                {navItems.map((item, i) => (
                    <a
                        href={item.href}
                        key={i}
                        className="relative group w-full flex justify-center cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {item.active && (
                            <motion.div
                                layoutId="activeNav"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-electric rounded-r-full shadow-[0_0_10px_0_rgba(0,212,255,0.5)]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <div className={`p-3 rounded-xl transition-all duration-300 ${item.active ? 'bg-electric/10 text-electric' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
                        </div>

                        {/* Tooltip */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-14 bg-darkpanel border border-white/10 px-3 py-1.5 rounded-lg opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50">
                            <span className="text-sm font-medium text-gray-200">{item.label}</span>
                        </div>
                    </a>
                ))}
            </nav>

            {/* Bottom Nav */}
            <div className="flex flex-col gap-6 w-full items-center mt-auto">
                <div className="w-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />
                {bottomItems.map((item, i) => (
                    <div
                        key={`bottom-${i}`}
                        className="relative group w-full flex justify-center cursor-pointer"
                    >
                        <div className="p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-300">
                            <item.icon size={22} strokeWidth={2} />
                        </div>
                        {/* Tooltip */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-14 bg-darkpanel border border-white/10 px-3 py-1.5 rounded-lg opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap z-50">
                            <span className="text-sm font-medium text-gray-200">{item.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.aside>
    );
}
