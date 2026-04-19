'use client';
import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMarketItems } from '@/hooks/useQueries';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SectionCard, Badge } from '@/components/ui/index';
import { formatCash, formatPercent } from '@/lib/analytics';
import { Search } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { MarketAnalytics } from '@/types/torn';
import { cn } from '@/lib/utils';

type ItemRow = { itemId: number; itemName: string; currentPrice: number; marketAvg: number; ma7: number; deviation: number; signal: string; signalStrength: number; [key: string]: unknown };

export default function MarketPage() {
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState<'all'|'buy'|'sell'|'hold'>('all');
  const [selectedItem, setSelectedItem] = useState<MarketAnalytics | null>(null);
  const [sortKey, setSortKey] = useState('deviation');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const { data: items = [], isLoading, error } = useMarketItems({ sortBy: sortKey });

  const filtered = useMemo(() => items.filter((item) => {
    const matchSearch = !search || item.itemName.toLowerCase().includes(search.toLowerCase());
    const matchSignal = signalFilter === 'all' || item.signal === signalFilter;
    return matchSearch && matchSignal;
  }), [items, search, signalFilter]);

  const signalCounts = useMemo(() => {
    const c = { buy: 0, sell: 0, hold: 0 };
    items.forEach((i) => { if (i.signal in c) c[i.signal as keyof typeof c]++; });
    return c;
  }, [items]);

  const handleSort = (key: string) => { if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('desc'); } };

  const tableData: ItemRow[] = filtered.map((i) => ({ ...i }));

  const columns: Column<ItemRow>[] = [
    { key: 'itemName', header: 'Item', sortable: true, render: (v) => <span className="font-medium text-zinc-100">{String(v)}</span> },
    { key: 'currentPrice', header: 'Price', sortable: true, align: 'right', render: (v) => <span className="font-mono text-zinc-200">{formatCash(Number(v))}</span> },
    { key: 'marketAvg', header: 'Mkt Avg', align: 'right', render: (v) => <span className="font-mono text-zinc-400">{formatCash(Number(v))}</span> },
    { key: 'ma7', header: '7D MA', align: 'right', render: (v) => <span className="font-mono text-zinc-500">{formatCash(Number(v))}</span> },
    { key: 'deviation', header: '% Dev', sortable: true, align: 'right', render: (v) => { const n = Number(v); return <span className={cn('font-mono font-semibold', n < 0 ? 'text-emerald-400' : 'text-rose-400')}>{formatPercent(n)}</span>; } },
    { key: 'signal', header: 'Signal', align: 'center', render: (v) => <Badge variant={v as 'buy'|'sell'|'hold'}>{String(v).toUpperCase()}</Badge> },
    { key: 'signalStrength', header: 'Strength', align: 'right', render: (v) => { const n = Number(v); return <div className="flex items-center justify-end gap-2"><div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${n * 100}%` }} /></div><span className="text-xs font-mono text-zinc-400">{(n * 100).toFixed(0)}%</span></div>; } },
  ];

  const chartData = selectedItem?.priceHistory.slice(-30).map((p, i) => ({ day: `D${i + 1}`, price: p.price, ma7: selectedItem.ma7, ma30: selectedItem.ma30 })) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-3 gap-4">
          {([['buy','Buy Signals','text-emerald-400'],['sell','Sell Signals','text-rose-400'],['hold','Hold / Neutral','text-amber-400']] as const).map(([v, label, color]) => (
            <button key={v} onClick={() => setSignalFilter(signalFilter === v ? 'all' : v)} className={cn('p-4 rounded-xl bg-zinc-900 border transition-all text-left', signalFilter === v ? 'border-zinc-500' : 'border-zinc-800 hover:border-zinc-700')}>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
              <p className={cn('font-syne font-bold text-3xl tabular-nums', color)}>{isLoading ? '—' : signalCounts[v]}</p>
            </button>
          ))}
        </div>

        {selectedItem && (
          <SectionCard title={selectedItem.itemName} description="30-day price history" action={<button onClick={() => setSelectedItem(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Close ✕</button>}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.4)" />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCash(v)} width={70} />
                <Tooltip formatter={(v: number, n: string) => [formatCash(v), n]} contentStyle={{ background: 'rgb(24,24,27)', border: '1px solid rgb(63,63,70)', borderRadius: 8 }} />
                <Area type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} fill="url(#pg)" dot={false} name="Price" />
                <Area type="monotone" dataKey="ma7" stroke="#60a5fa" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} name="7D MA" />
                <Area type="monotone" dataKey="ma30" stroke="#f87171" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} name="30D MA" />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>
        )}

        <SectionCard title="Market Items" description={`${filtered.length} items`} action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…" className="pl-8 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-44" />
          </div>
        } noPad>
          <DataTable data={tableData} columns={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} isLoading={isLoading} rowKey="itemId" emptyMessage={error ? 'Failed to load market data' : 'No items match filters'} />
        </SectionCard>
      </div>
    </AppLayout>
  );
}
