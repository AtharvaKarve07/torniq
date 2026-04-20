import type { MarketAnalytics, PricePoint, TradeOpportunityDisplay } from '@/types/torn';

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
  if (priceHistory.length < 2) {
    return { signal: 'hold' as const, strength: 0, reasons: ['Insufficient price history'] };
  }

  const prices = priceHistory.map((p) => safeNum(p.price));
  const n = prices.length;

  // Use whatever history we have
  const ma7 = sma(prices, Math.min(7, n));
  const ma30 = sma(prices, Math.min(30, n));
  const avgAll = prices.reduce((a, b) => a + b, 0) / n;

  const reasons: string[] = [];
  let buyScore = 0;
  let sellScore = 0;

  // Compare current price to 7-period MA (threshold: 8%)
  if (ma7 !== null) {
    const dev = priceDeviation(currentPrice, ma7);
    if (dev < -8) {
      buyScore += 0.4;
      reasons.push(`${Math.abs(dev).toFixed(1)}% below 7D avg`);
    } else if (dev > 8) {
      sellScore += 0.4;
      reasons.push(`${dev.toFixed(1)}% above 7D avg`);
    }
  }

  // Compare to 30-period MA (threshold: 12%)
  if (ma30 !== null) {
    const dev = priceDeviation(currentPrice, ma30);
    if (dev < -12) {
      buyScore += 0.5;
      reasons.push(`${Math.abs(dev).toFixed(1)}% below 30D avg`);
    } else if (dev > 12) {
      sellScore += 0.5;
      reasons.push(`${dev.toFixed(1)}% above 30D avg`);
    }
  }

  // Overall deviation from mean (threshold: 10%)
  const devAll = priceDeviation(currentPrice, avgAll);
  if (devAll < -10) {
    buyScore += 0.2;
    reasons.push(`${Math.abs(devAll).toFixed(1)}% below overall avg`);
  } else if (devAll > 10) {
    sellScore += 0.2;
    reasons.push(`${devAll.toFixed(1)}% above overall avg`);
  }

  // Price trend: last 3 points
  if (n >= 3) {
    const recent = prices.slice(-3);
    const falling = recent[2] < recent[1] && recent[1] < recent[0];
    const rising = recent[2] > recent[1] && recent[1] > recent[0];
    if (falling) { buyScore += 0.1; reasons.push('Price trending down'); }
    if (rising) { sellScore += 0.1; reasons.push('Price trending up'); }
  }

  const net = buyScore - sellScore;
  if (net > 0.15) return { signal: 'buy' as const, strength: Math.min(1, buyScore), reasons };
  if (net < -0.15) return { signal: 'sell' as const, strength: Math.min(1, sellScore), reasons };
  return { signal: 'hold' as const, strength: 0, reasons: reasons.length ? reasons : ['Price within normal range'] };
}

export function buildMarketAnalytics(
  itemId: number,
  itemName: string,
  priceHistory: PricePoint[],
): MarketAnalytics {
  const prices = priceHistory.map((p) => safeNum(p.price));
  const currentPrice = safeNum(prices[prices.length - 1]);
  const n = prices.length;

  const ma7Val = sma(prices, Math.min(7, n)) ?? currentPrice;
  const ma30Val = sma(prices, Math.min(30, n)) ?? currentPrice;
  const avgPrice = n > 0 ? prices.reduce((a, b) => a + b, 0) / n : currentPrice;
  const deviation = priceDeviation(currentPrice, avgPrice);
  const { signal, strength } = detectSignal(priceHistory, currentPrice);

  return {
    itemId,
    itemName,
    currentPrice,
    marketAvg: avgPrice,
    ma7: ma7Val,
    ma30: ma30Val,
    deviation,
    signal,
    signalStrength: strength,
    priceHistory,
  };
}

export function rankOpportunities(
  opportunities: TradeOpportunityDisplay[],
  minProfitPercent = 10,
): TradeOpportunityDisplay[] {
  return opportunities
    .filter((o) => safeNum(o.profitPercent) >= minProfitPercent && o.status === 'active')
    .sort((a, b) => safeNum(b.profitPercent) - safeNum(a.profitPercent));
}

export function estimateWinProbability(userStats: number, targetStats: number): number {
  const t = safeNum(targetStats, 1);
  if (t === 0) return 0.95;
  const ratio = safeNum(userStats) / t;
  return 1 / (1 + Math.exp(-4 * (ratio - 1)));
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
