import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTornItems } from '@/lib/torn';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const minProfit = parseFloat(searchParams.get('minProfit') ?? '10');

  try {
    const dbOpps = await prisma.tradeOpportunity.findMany({
      where: { status: 'active', profitPercent: { gte: minProfit } },
      orderBy: { profitPercent: 'desc' },
      take: 100,
    });

    if (dbOpps.length >= 5) {
      return NextResponse.json({ success: true, data: dbOpps.map((o) => ({ id: o.id, itemId: o.itemId, itemName: o.itemName, listedPrice: Number(o.listedPrice), marketAvgPrice: Number(o.marketAvgPrice), profitAmount: Number(o.profitAmount), profitPercent: o.profitPercent, sellerName: o.sellerName ?? undefined, sellerId: o.sellerId ?? undefined, status: o.status, detectedAt: o.detectedAt.toISOString() })) });
    }

    const tornItems = await getTornItems(apiKey);
    const sellers = ['DealMaker', 'QuickSell99', 'BazaarKing', 'TradeRoute', 'SnapDeal'];
    const opps = Object.entries(tornItems).filter(([, item]) => item.market_value > 1000).slice(0, 60).map(([idStr, item], idx) => {
      const discount = 0.60 + Math.random() * 0.35;
      const listed = Math.round(item.market_value * discount);
      const profit = item.market_value - listed;
      const pct = (profit / listed) * 100;
      return { id: `demo-${idStr}`, itemId: parseInt(idStr), itemName: item.name, listedPrice: listed, marketAvgPrice: item.market_value, profitAmount: profit, profitPercent: pct, sellerName: sellers[idx % sellers.length], sellerId: String(200000 + idx * 1337), status: 'active', detectedAt: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString() };
    }).filter((o) => o.profitPercent >= minProfit).sort((a, b) => b.profitPercent - a.profitPercent);

    return NextResponse.json({ success: true, data: opps, demo: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
