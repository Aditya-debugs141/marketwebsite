'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate initial data hydration
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!loading) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={{ opacity: loading ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white"
        >
            <div className="relative">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"
                />
                <Activity size={48} className="text-blue-500 relative z-10" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex flex-col items-center"
            >
                <span className="text-lg font-bold tracking-widest uppercase text-gray-400">
                    Initializing Market Data
                </span>
                <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ height: [4, 12, 4] }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.1,
                            }}
                            className="w-1 bg-blue-500 rounded-full"
                        />
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
