import { NextResponse } from 'next/server';
import { dealEngine } from '@/server/engine/deal-engine';

export async function GET() {
    try {
        const radarData = dealEngine.getSmartMoneyRadar();
        return NextResponse.json({ success: true, radar: radarData });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown server error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
