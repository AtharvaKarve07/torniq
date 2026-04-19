import { NextRequest, NextResponse } from 'next/server';
import { getItemBazaarListings, getTornItems } from '@/lib/torn';
import { prisma } from '@/lib/prisma';
import { buildMarketAnalytics } from '@/lib/analytics';
import { generateMockPriceHistory } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return NextResponse.json({ success: false, error: 'Missing API key' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const itemId = parseInt(searchParams.get('itemId') ?? '0');
  if (!itemId) return NextResponse.json({ success: false, error: 'Missing itemId' }, { status: 400 });
  try {
    const [listings, tornItems] = await Promise.all([getItemBazaarListings(apiKey, itemId), getTornItems(apiKey)]);
    const item = tornItems[itemId];
    if (!item) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    const priceHistory = await prisma.itemPriceHistory.findMany({ where: { itemId, recordedAt: { gte: new Date(Date.now() - 30 * 86400000) } }, orderBy: { recordedAt: 'asc' }, select: { price: true, recordedAt: true } });
    const history = priceHistory.length >= 3 ? priceHistory.map((p) => ({ timestamp: Math.floor(p.recordedAt.getTime() / 1000), price: Number(p.price) })) : generateMockPriceHistory(item.market_value, 30).map((p) => ({ timestamp: Math.floor(p.timestamp / 1000), price: p.price }));
    return NextResponse.json({ success: true, data: { item: { id: itemId, name: item.name, type: item.type, marketValue: item.market_value }, listings: listings.slice(0, 20), analytics: buildMarketAnalytics(itemId, item.name, history) } });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
