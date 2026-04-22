import { NextRequest, NextResponse } from 'next/server';
import { getUserInventory, getTornItems } from '@/lib/torn';
import { buildMarketAnalytics } from '@/lib/analytics';
import { prisma } from '@/lib/prisma';
import { generateMockPriceHistory } from '@/lib/utils';
import type { PricePoint } from '@/types/torn';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });

  try {
    // Fetch inventory and item catalogue in parallel
    const [inventory, tornItems] = await Promise.all([
      getUserInventory(apiKey),
      getTornItems(apiKey),
    ]);

    if (!inventory.length) {
      return NextResponse.json({ success: true, data: [], empty: true });
    }

    // Fetch price history for held items from DB
    const itemIds = inventory.map((i) => i.ID);
    const priceHistoryRecords = await prisma.itemPriceHistory.findMany({
      where: {
        itemId: { in: itemIds },
        recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { recordedAt: 'asc' },
      select: { itemId: true, price: true, recordedAt: true },
    });

    const historyByItem = new Map<number, PricePoint[]>();
    for (const r of priceHistoryRecords) {
      const pts = historyByItem.get(r.itemId) ?? [];
      pts.push({ timestamp: Math.floor(r.recordedAt.getTime() / 1000), price: Number(r.price) });
      historyByItem.set(r.itemId, pts);
    }

    // Build holdings with market analytics
    const holdings = inventory.map((item) => {
      const tornItem = tornItems[item.ID];
      const marketValue = tornItem?.market_value ?? item.market_price ?? 0;

      const dbHistory = historyByItem.get(item.ID);
      const history: PricePoint[] = dbHistory && dbHistory.length >= 3
        ? dbHistory
        : generateMockPriceHistory(marketValue, 14).map((p) => ({
            timestamp: Math.floor(p.timestamp / 1000),
            price: p.price,
          }));

      const analytics = buildMarketAnalytics(item.ID, item.name, history);
      const totalValue = marketValue * item.quantity;

      return {
        itemId: item.ID,
        name: item.name,
        type: item.type ?? tornItem?.type ?? 'Unknown',
        quantity: item.quantity,
        equipped: item.equipped > 0,
        marketValue,
        totalValue,
        signal: analytics.signal,
        signalStrength: analytics.signalStrength,
        deviation: analytics.deviation,
        ma7: analytics.ma7,
        ma30: analytics.ma30,
        recommendation: getRecommendation(analytics.signal, analytics.deviation, analytics.signalStrength),
      };
    });

    // Sort by total value descending
    holdings.sort((a, b) => b.totalValue - a.totalValue);

    const totalPortfolioValue = holdings.reduce((s, h) => s + h.totalValue, 0);

    return NextResponse.json({
      success: true,
      data: holdings,
      totalPortfolioValue,
      itemCount: holdings.length,
    });
  } catch (err) {
    console.error('Inventory API error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getRecommendation(
  signal: 'buy' | 'sell' | 'hold',
  deviation: number,
  strength: number,
): { action: string; reason: string; urgency: 'high' | 'medium' | 'low' } {
  if (signal === 'sell' && strength > 0.5) {
    return {
      action: 'SELL NOW',
      reason: `Price is ${deviation.toFixed(1)}% above average — strong sell signal`,
      urgency: 'high',
    };
  }
  if (signal === 'sell') {
    return {
      action: 'CONSIDER SELLING',
      reason: `Price is ${deviation.toFixed(1)}% above average`,
      urgency: 'medium',
    };
  }
  if (signal === 'buy' && strength > 0.5) {
    return {
      action: 'HOLD — ACCUMULATE',
      reason: `Price is ${Math.abs(deviation).toFixed(1)}% below average — good time to buy more`,
      urgency: 'low',
    };
  }
  if (signal === 'buy') {
    return {
      action: 'HOLD',
      reason: 'Price slightly below average — market may recover',
      urgency: 'low',
    };
  }
  return {
    action: 'HOLD',
    reason: 'Price within normal range — no action needed',
    urgency: 'low',
  };
}
