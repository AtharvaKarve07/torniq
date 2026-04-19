'use client';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SectionCard } from '@/components/ui/index';
import { formatCash, formatPercent } from '@/lib/analytics';
import { useMarketItems } from '@/hooks/useQueries';
import { TrendingDown, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketAnalytics } from '@/types/torn';

interface BazaarItem { name: string; myPrice: number; quantity: number; }

const SAMPLE: BazaarItem[] = [
  { name: 'Xanax', myPrice: 750000, quantity: 5 },
  { name: 'Small First Aid Kit', myPrice: 1200, quantity: 20 },
  { name: 'Morphine', myPrice: 85000, quantity: 3 },
];

export default function BazaarPage() {
  const [items, setItems] = useState<BazaarItem[]>(SAMPLE);
  const [newItem, setNewItem] = useState({ name: '', myPrice: '', quantity: '' });
  const { data: marketItems = [], isLoading } = useMarketItems({});

  const getMarket = (name: string): MarketAnalytics | undefined =>
    marketItems.find((m) => m.itemName.toLowerCase().includes(name.toLowerCase()));

  const addItem = () => {
    if (!newItem.name || !newItem.myPrice) return;
    setItems((p) => [...p, { name: newItem.name, myPrice: parseFloat(newItem.myPrice), quantity: parseInt(newItem.quantity || '1') }]);
    setNewItem({ name: '', myPrice: '', quantity: '' });
  };

  const totalRevenue = items.reduce((s, i) => s + i.myPrice * i.quantity, 0);
  const optimizedRevenue = items.reduce((s, item) => {
    const m = getMarket(item.name);
    return s + (m ? m.marketAvg * 0.98 : item.myPrice) * item.quantity;
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-400/80">Enter your bazaar items to get pricing recommendations. Suggested prices undercut the market by 2% for faster sales.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Revenue</p><p className="font-syne font-bold text-2xl text-zinc-100">{formatCash(totalRevenue)}</p></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/20"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Optimised Revenue</p><p className="font-syne font-bold text-2xl text-emerald-400">{isLoading ? '—' : formatCash(optimizedRevenue)}</p></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/20">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Difference</p>
            <p className={cn('font-syne font-bold text-2xl', optimizedRevenue >= totalRevenue ? 'text-emerald-400' : 'text-rose-400')}>{formatCash(Math.abs(optimizedRevenue - totalRevenue))}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{optimizedRevenue >= totalRevenue ? 'more' : 'less'} with market pricing</p>
          </div>
        </div>

        <SectionCard title="Add Item">
          <div className="flex gap-3 flex-wrap">
            <input type="text" value={newItem.name} onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))} placeholder="Item name (e.g. Xanax)" className="flex-1 min-w-48 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60" />
            <input type="number" value={newItem.myPrice} onChange={(e) => setNewItem((n) => ({ ...n, myPrice: e.target.value }))} placeholder="Your price" className="w-36 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60" />
            <input type="number" value={newItem.quantity} onChange={(e) => setNewItem((n) => ({ ...n, quantity: e.target.value }))} placeholder="Qty" className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60" />
            <button onClick={addItem} disabled={!newItem.name || !newItem.myPrice} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm rounded-lg transition-colors">Add</button>
          </div>
        </SectionCard>

        <SectionCard title="Your Bazaar Items">
          <div className="space-y-3">
            {items.length === 0 ? <p className="text-sm text-zinc-500 text-center py-8">No items added yet</p> : items.map((item, idx) => {
              const market = getMarket(item.name);
              const suggested = market ? Math.round(market.marketAvg * 0.98) : null;
              const diff = suggested ? ((item.myPrice - suggested) / suggested) * 100 : 0;
              const isTooHigh = diff > 5;
              const isTooLow = diff < -20;
              return (
                <div key={idx} className={cn('p-4 rounded-xl border transition-colors', isTooHigh ? 'bg-rose-500/5 border-rose-500/20' : isTooLow ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-800/50 border-zinc-700/50')}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-syne font-semibold text-zinc-100">{item.name}</p>
                        <span className="text-xs text-zinc-500">×{item.quantity}</span>
                        {isTooHigh && <span className="text-xs text-rose-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Overpriced</span>}
                        {isTooLow && <span className="text-xs text-amber-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Underpriced</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div><p className="text-xs text-zinc-500 mb-0.5">Your Price</p><p className="font-mono text-zinc-200">{formatCash(item.myPrice)}</p></div>
                        {market && <>
                          <div><p className="text-xs text-zinc-500 mb-0.5">Market Avg</p><p className="font-mono text-zinc-400">{formatCash(market.marketAvg)}</p></div>
                          <div><p className="text-xs text-zinc-500 mb-0.5">Suggested (−2%)</p><p className="font-mono text-emerald-400">{formatCash(suggested!)}</p></div>
                          <div><p className="text-xs text-zinc-500 mb-0.5">Deviation</p><p className={cn('font-mono', diff > 0 ? 'text-rose-400' : 'text-emerald-400')}>{formatPercent(diff)}</p></div>
                        </>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {suggested && <button onClick={() => setItems((p) => p.map((it, i) => i === idx ? { ...it, myPrice: suggested } : it))} className="px-3 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/25 transition-colors">Use suggested</button>}
                      <button onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="px-3 py-1.5 text-xs bg-zinc-700/50 text-zinc-400 rounded-lg hover:bg-rose-500/15 hover:text-rose-400 transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
