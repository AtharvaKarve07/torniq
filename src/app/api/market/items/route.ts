import { NextRequest, NextResponse } from 'next/server';
import { getTornItems } from '@/lib/torn';
import { prisma } from '@/lib/prisma';
import { buildMarketAnalytics } from '@/lib/analytics';
import { generateMockPriceHistory } from '@/lib/utils';
import type { PricePoint } from '@/types/torn';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') ?? 'deviation';
  const limit = parseInt(searchParams.get('limit') ?? '50');
  try {
    const tornItems = await getTornItems(apiKey);
    const priceHistoryRecords = await prisma.itemPriceHistory.findMany({
      where: { recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { recordedAt: 'asc' },
      select: { itemId: true, price: true, recordedAt: true },
    });
    const historyByItem = new Map<number, PricePoint[]>();
    for (const r of priceHistoryRecords) {
      const pts = historyByItem.get(r.itemId) ?? [];
      pts.push({ timestamp: Math.floor(r.recordedAt.getTime() / 1000), price: Number(r.price) });
      historyByItem.set(r.itemId, pts);
    }
    const analytics = Object.entries(tornItems).slice(0, 200).filter(([, item]) => item.market_value > 0).map(([idStr, item]) => {
      const itemId = parseInt(idStr);
      const history = historyByItem.get(itemId)?.length ?? 0 >= 3
        ? historyByItem.get(itemId)!
        : generateMockPriceHistory(item.market_value, 30).map((p) => ({ timestamp: Math.floor(p.timestamp / 1000), price: p.price }));
      return buildMarketAnalytics(itemId, item.name, history);
    });
    analytics.sort((a, b) => sortBy === 'price' ? b.currentPrice - a.currentPrice : sortBy === 'signal' ? b.signalStrength - a.signalStrength : Math.abs(b.deviation) - Math.abs(a.deviation));
    return NextResponse.json({ success: true, data: analytics.slice(0, limit) });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
