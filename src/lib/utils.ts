import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safe number converter — never throws toFixed errors
function safeNum(n: unknown, fallback = 0): number {
  const v = Number(n);
  return isFinite(v) ? v : fallback;
}

export function timeAgo(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  } catch {
    return 'Unknown';
  }
}

export function toPercent(n: unknown): string {
  const v = safeNum(n);
  return `${(v * 100).toFixed(0)}%`;
}

export function riskColor(score: unknown): string {
  const s = safeNum(score);
  if (s < 0.3) return 'text-emerald-400';
  if (s < 0.6) return 'text-amber-400';
  return 'text-rose-400';
}

export function obfuscateKey(key: string): string {
  try {
    const pattern = 'torniq2024';
    return btoa(
      key.split('').map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ pattern.charCodeAt(i % pattern.length))
      ).join(''),
    );
  } catch { return key; }
}

export function deobfuscateKey(obfuscated: string): string {
  try {
    const decoded = atob(obfuscated);
    const pattern = 'torniq2024';
    return decoded.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ pattern.charCodeAt(i % pattern.length))
    ).join('');
  } catch { return ''; }
}

export function generateMockPriceHistory(basePrice: number, days = 30) {
  const base = safeNum(basePrice, 1000);
  const now = Date.now();
  const points = [];
  let price = base;
  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const change = (Math.random() - 0.48) * 0.05;
    const reversion = (base - price) * 0.02;
    price = Math.max(1, price * (1 + change) + reversion);
    points.push({ timestamp: Math.floor(timestamp / 1000), price: Math.round(price) });
  }
  return points;
}