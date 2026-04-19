import type { TornUser, TornItem, TornBazaarListing } from '@/types/torn';

const TORN_API_BASE = 'https://api.torn.com';

interface CacheEntry<T> { data: T; fetchedAt: number; ttl: number; }
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttl) { cache.delete(key); return null; }
  return entry.data;
}
function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttl: ttlMs });
}

interface RateBucket { tokens: number; lastRefill: number; }
const rateBuckets = new Map<string, RateBucket>();
function canMakeRequest(apiKey: string): boolean {
  const now = Date.now();
  let bucket = rateBuckets.get(apiKey);
  if (!bucket) { bucket = { tokens: 100, lastRefill: now }; rateBuckets.set(apiKey, bucket); }
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(100, bucket.tokens + Math.floor((elapsed / 60_000) * 100));
  bucket.lastRefill = now;
  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

export class TornAPIServiceError extends Error {
  constructor(message: string, public readonly code = 0) {
    super(message);
    this.name = 'TornAPIServiceError';
  }
}

async function tornFetch<T>(opts: { apiKey: string; endpoint: string; id?: string | number; selections: string[]; cacheTtl?: number }): Promise<T> {
  const { apiKey, endpoint, id, selections, cacheTtl = 60_000 } = opts;
  const cacheKey = `${endpoint}:${id ?? ''}:${selections.join(',')}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;
  if (!canMakeRequest(apiKey)) throw new TornAPIServiceError('Rate limit reached', 429);
  const path = id ? `/${endpoint}/${id}` : `/${endpoint}/`;
  const url = `${TORN_API_BASE}${path}?selections=${selections.join(',')}&key=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new TornAPIServiceError(`HTTP ${res.status}`, res.status);
  const json = await res.json();
  if (json.error) throw new TornAPIServiceError(json.error.error, json.error.code);
  setCache(cacheKey, json, cacheTtl);
  return json as T;
}

export async function getUserData(apiKey: string): Promise<TornUser> {
  return tornFetch<TornUser>({ apiKey, endpoint: 'user', selections: ['profile', 'personalstats', 'money', 'networth', 'attacks'], cacheTtl: 2 * 60_000 });
}

export async function getPlayerData(apiKey: string, playerId: number): Promise<Partial<TornUser>> {
  return tornFetch<Partial<TornUser>>({ apiKey, endpoint: 'user', id: playerId, selections: ['profile', 'personalstats'], cacheTtl: 5 * 60_000 });
}

export async function getTornItems(apiKey: string): Promise<Record<string, TornItem>> {
  const data = await tornFetch<{ items: Record<string, TornItem> }>({ apiKey, endpoint: 'torn', selections: ['items'], cacheTtl: 10 * 60_000 });
  return data.items;
}

export async function getItemBazaarListings(apiKey: string, itemId: number): Promise<TornBazaarListing[]> {
  const data = await tornFetch<{ bazaar: TornBazaarListing[] }>({ apiKey, endpoint: 'market', id: itemId, selections: ['bazaar'], cacheTtl: 3 * 60_000 });
  return data.bazaar ?? [];
}

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; user?: Partial<TornUser>; error?: string }> {
  try {
    const user = await tornFetch<Partial<TornUser>>({ apiKey, endpoint: 'user', selections: ['basic'], cacheTtl: 0 });
    return { valid: true, user };
  } catch (err) {
    if (err instanceof TornAPIServiceError) return { valid: false, error: err.message };
    return { valid: false, error: 'Unknown error' };
  }
}
