import { NextResponse } from 'next/server';
import { dealEngine } from '@/server/engine/deal-engine';

export async function GET() {
    try {
        // Triggers fetch/enrich and gets the latest cache
        const processedFeed = await dealEngine.refreshDeals();
        return NextResponse.json({ success: true, count: processedFeed.length, deals: processedFeed });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
