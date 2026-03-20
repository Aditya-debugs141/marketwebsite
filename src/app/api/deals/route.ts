import { NextResponse } from 'next/server';
import { dealEngine } from '@/server/engine/deal-engine';

export async function GET() {
    try {
        // Triggers fetch/enrich and gets the latest cache
        const processedFeed = await dealEngine.refreshDeals();
        return NextResponse.json({ success: true, count: processedFeed.length, deals: processedFeed });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown server error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
