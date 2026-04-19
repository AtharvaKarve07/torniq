import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/torn';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json() as { apiKey: string };
    if (!apiKey || apiKey.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'API key too short' }, { status: 400 });
    }
    const result = await validateApiKey(apiKey.trim());
    if (!result.valid) {
      return NextResponse.json({ success: false, error: result.error ?? 'Invalid API key' }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: { player_id: result.user?.player_id, name: result.user?.name, level: result.user?.level } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
