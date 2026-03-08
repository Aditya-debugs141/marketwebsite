import { NextResponse } from 'next/server';
import { dealEngine } from '@/server/engine/deal-engine';

export async function GET() {
    try {
        const radarData = dealEngine.getSmartMoneyRadar();
        return NextResponse.json({ success: true, radar: radarData });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
