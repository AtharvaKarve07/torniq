import type { MarketAnalytics, PricePoint, TradeOpportunityDisplay } from '@/types/torn';

// Safe number helper — converts anything to a finite number, fallback to 0
function safeNum(n: unknown, fallback = 0): number {
  const v = Number(n);
  return isFinite(v) ? v : fallback;
}

export function sma(prices: number[], periods: number): number | null {
  if (prices.length < periods) return null;
  const slice = prices.slice(-periods);
  return slice.reduce((a, b) => a + b, 0) / periods;
}

export function priceDeviation(currentPrice: number, movingAvg: number): number {
  const avg = safeNum(movingAvg);
  if (avg === 0) return 0;
  return ((safeNum(currentPrice) - avg) / avg) * 100;
}

export function detectSignal(priceHistory: PricePoint[], currentPrice: number) {
  if (priceHistory.length < 3) return { signal: 'hold' as const, strength: 0, reasons: ['Insufficient data'] };
  const prices = priceHistory.map((p) => safeNum(p.price));
  const ma7 = sma(prices, Math.min(7, prices.length));
  const ma30 = sma(prices, Math.min(30, prices.length));
  const reasons: string[] = [];
  let buyScore = 0, sellScore = 0;
  if (ma7 !== null) {
    const dev = priceDeviation(currentPrice, ma7);
    if (dev < -15) { buyScore += 0.4; reasons.push(`${Math.abs(dev).toFixed(1)}% below 7D avg`); }
    else if (dev > 20) { sellScore += 0.4; reasons.push(`${dev.toFixed(1)}% above 7D avg`); }
  }
  if (ma30 !== null) {
    const dev = priceDeviation(currentPrice, ma30);
    if (dev < -20) { buyScore += 0.5; reasons.push(`${Math.abs(dev).toFixed(1)}% below 30D avg`); }
    else if (dev > 25) { sellScore += 0.5; reasons.push(`${dev.toFixed(1)}% above 30D avg`); }
  }
  const net = buyScore - sellScore;
  if (net > 0.3) return { signal: 'buy' as const, strength: Math.min(1, buyScore), reasons };
  if (net < -0.3) return { signal: 'sell' as const, strength: Math.min(1, sellScore), reasons };
  return { signal: 'hold' as const, strength: 0, reasons: reasons.length ? reasons : ['Within normal range'] };
}

export function buildMarketAnalytics(itemId: number, itemName: string, priceHistory: PricePoint[]): MarketAnalytics {
  const prices = priceHistory.map((p) => safeNum(p.price));
  const currentPrice = safeNum(prices[prices.length - 1]);
  const ma7Val = sma(prices, Math.min(7, prices.length)) ?? currentPrice;
  const ma30Val = sma(prices, Math.min(30, prices.length)) ?? currentPrice;
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const deviation = priceDeviation(currentPrice, avgPrice);
  const { signal, strength } = detectSignal(priceHistory, currentPrice);
  return { itemId, itemName, currentPrice, marketAvg: avgPrice, ma7: ma7Val, ma30: ma30Val, deviation, signal, signalStrength: strength, priceHistory };
}

export function rankOpportunities(opportunities: TradeOpportunityDisplay[], minProfitPercent = 10): TradeOpportunityDisplay[] {
  return opportunities
    .filter((o) => safeNum(o.profitPercent) >= minProfitPercent && o.status === 'active')
    .sort((a, b) => safeNum(b.profitPercent) - safeNum(a.profitPercent));
}

export function estimateWinProbability(userStats: number, targetStats: number): number {
  const t = safeNum(targetStats, 1);
  if (t === 0) return 0.95;
  return 1 / (1 + Math.exp(-4 * (safeNum(userStats) / t - 1)));
}

export function calculateRiskScore(winProb: number, targetStatus: string): number {
  let risk = 1 - safeNum(winProb, 0.5);
  if (targetStatus === 'Hospital') risk *= 0.3;
  return Math.max(0, Math.min(1, risk));
}

export function estimateReward(level: number, networth: number): number {
  const cash = safeNum(networth) * 0.001;
  const mugCap = cash * 0.75;
  const levelFactor = Math.log10(Math.max(1, safeNum(level))) * 500_000;
  return Math.round(Math.min(mugCap, levelFactor));
}

export function formatCash(amount: unknown): string {
  const n = safeNum(amount);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatNumber(amount: unknown): string {
  const n = safeNum(amount);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function formatPercent(amount: unknown): string {
  const n = safeNum(amount);
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}