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
  const typeFilter = searchParams.get('type') ?? '';

  try {
    // Fetch LIVE item data from Torn API
    const tornItems = await getTornItems(apiKey);

    // Store current prices to DB for history (fire and forget)
    const now = new Date();
    const itemEntries = Object.entries(tornItems).filter(([, item]) => item.market_value > 0);

    // Async price recording — don't await so it doesn't slow the response
    Promise.all(
      itemEntries.slice(0, 100).map(([idStr, item]) =>
        prisma.itemPriceHistory.create({
          data: {
            itemId: parseInt(idStr),
            itemName: item.name,
            price: BigInt(Math.round(item.market_value)),
            quantity: 1,
            marketType: 'itemmarket',
            recordedAt: now,
          },
        }).catch(() => null) // Ignore duplicate errors
      )
    );

    // Fetch existing price history from DB
    const priceHistoryRecords = await prisma.itemPriceHistory.findMany({
      where: {
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        ...(typeFilter ? { itemName: { contains: typeFilter, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { recordedAt: 'asc' },
      select: { itemId: true, price: true, recordedAt: true },
    });

    // Group by itemId
    const historyByItem = new Map<number, PricePoint[]>();
    for (const r of priceHistoryRecords) {
      const pts = historyByItem.get(r.itemId) ?? [];
      pts.push({ timestamp: Math.floor(r.recordedAt.getTime() / 1000), price: Number(r.price) });
      historyByItem.set(r.itemId, pts);
    }

    // Build analytics — use real history if available, otherwise simulate
    const analytics = itemEntries.map(([idStr, item]) => {
      const itemId = parseInt(idStr);
      const dbHistory = historyByItem.get(itemId);
      const history: PricePoint[] = dbHistory && dbHistory.length >= 3
        ? dbHistory
        : generateMockPriceHistory(item.market_value, 30).map((p) => ({
            timestamp: Math.floor(p.timestamp / 1000),
            price: p.price,
          }));
      return buildMarketAnalytics(itemId, item.name, history);
    });

    // Sort results
    analytics.sort((a, b) => {
      if (sortBy === 'price') return b.currentPrice - a.currentPrice;
      if (sortBy === 'signal') return b.signalStrength - a.signalStrength;
      return Math.abs(b.deviation) - Math.abs(a.deviation);
    });

    return NextResponse.json({
      success: true,
      data: analytics.slice(0, limit),
      total: analytics.length,
      live: true,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
