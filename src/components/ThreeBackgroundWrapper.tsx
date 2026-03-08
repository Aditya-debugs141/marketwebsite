'use client';

import dynamic from 'next/dynamic';

const ThreeBackground = dynamic(() => import('./ThreeBackground'), {
    ssr: false,
    loading: () => null,
});

export function ThreeBackgroundWrapper() {
    return <ThreeBackground />;
}
