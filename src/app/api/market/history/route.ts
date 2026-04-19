import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildMarketAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const itemId = parseInt(searchParams.get('itemId') ?? '0');
  const days = Math.min(90, parseInt(searchParams.get('days') ?? '30'));
  if (!itemId) return NextResponse.json({ success: false, error: 'Missing itemId' }, { status: 400 });
  try {
    const records = await prisma.itemPriceHistory.findMany({
      where: { itemId, recordedAt: { gte: new Date(Date.now() - days * 86400000) } },
      orderBy: { recordedAt: 'asc' },
      select: { price: true, recordedAt: true },
    });
    if (!records.length) return NextResponse.json({ success: true, data: { history: [], analytics: null } });
    const history = records.map((r) => ({ timestamp: Math.floor(r.recordedAt.getTime() / 1000), price: Number(r.price) }));
    const itemName = (await prisma.itemPriceHistory.findFirst({ where: { itemId }, select: { itemName: true } }))?.itemName ?? 'Unknown';
    return NextResponse.json({ success: true, data: { history, analytics: buildMarketAnalytics(itemId, itemName, history) } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
