'use client';
import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMarketItems } from '@/hooks/useQueries';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SectionCard, Badge, EmptyState } from '@/components/ui/index';
import { formatCash, formatPercent } from '@/lib/analytics';
import { Search, TrendingUp, BarChart3, X } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import type { MarketAnalytics } from '@/types/torn';
import { cn } from '@/lib/utils';
import { format, fromUnixTime } from 'date-fns';

type ItemRow = {
  [key: string]: unknown;
  itemId: number;
  itemName: string;
  currentPrice: number;
  marketAvg: number;
  ma7: number;
  deviation: number;
  signal: string;
  signalStrength: number;
};

export default function MarketPage() {
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState<'all' | 'buy' | 'sell' | 'hold'>('all');
  const [selectedItem, setSelectedItem] = useState<MarketAnalytics | null>(null);
  const [sortKey, setSortKey] = useState('deviation');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

  const handleSort = (key: string) => {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const tableData: ItemRow[] = filtered.map((i) => ({ ...i }));

  const columns: Column<ItemRow>[] = [
    {
      key: 'itemName',
      header: 'Item',
      sortable: true,
      render: (v, row) => (
        <button
          onClick={() => setSelectedItem(items.find((i) => i.itemId === row.itemId) ?? null)}
          className="font-medium text-zinc-100 hover:text-amber-400 transition-colors text-left underline-offset-2 hover:underline"
        >
          {String(v)}
        </button>
      ),
    },
    {
      key: 'currentPrice',
      header: 'Live Price',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono text-zinc-200">{formatCash(Number(v))}</span>,
    },
    {
      key: 'marketAvg',
      header: 'Mkt Avg',
      align: 'right',
      render: (v) => <span className="font-mono text-zinc-400">{formatCash(Number(v))}</span>,
    },
    {
      key: 'ma7',
      header: '7D MA',
      align: 'right',
      render: (v) => <span className="font-mono text-zinc-500">{formatCash(Number(v))}</span>,
    },
    {
      key: 'deviation',
      header: '% Dev',
      sortable: true,
      align: 'right',
      render: (v) => {
        const n = Number(v);
        return (
          <span className={cn('font-mono font-semibold', n < 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {formatPercent(n)}
          </span>
        );
      },
    },
    {
      key: 'signal',
      header: 'Signal',
      align: 'center',
      render: (v) => <Badge variant={v as 'buy' | 'sell' | 'hold'}>{String(v).toUpperCase()}</Badge>,
    },
    {
      key: 'signalStrength',
      header: 'Strength',
      align: 'right',
      render: (v) => {
        const n = Number(v);
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${n * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-zinc-400">{(n * 100).toFixed(0)}%</span>
          </div>
        );
      },
    },
  ];

  // Chart data for selected item
  const chartData = selectedItem?.priceHistory.slice(-30).map((p) => ({
    time: format(fromUnixTime(p.timestamp), 'MMM d'),
    price: p.price,
    ma7: selectedItem.ma7,
    ma30: selectedItem.ma30,
  })) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Signal summary */}
        <div className="grid grid-cols-3 gap-4">
          {([
            ['buy', 'Buy Signals', 'text-emerald-400'],
            ['sell', 'Sell Signals', 'text-rose-400'],
            ['hold', 'Hold / Neutral', 'text-amber-400'],
          ] as const).map(([v, label, color]) => (
            <button
              key={v}
              onClick={() => setSignalFilter(signalFilter === v ? 'all' : v)}
              className={cn(
                'p-4 rounded-xl bg-zinc-900 border transition-all text-left',
                signalFilter === v ? 'border-zinc-500' : 'border-zinc-800 hover:border-zinc-700',
              )}
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
              <p className={cn('font-syne font-bold text-3xl tabular-nums', color)}>
                {isLoading ? '—' : signalCounts[v]}
              </p>
            </button>
          ))}
        </div>

        {/* Item detail panel */}
        {selectedItem && (
          <SectionCard
            title={selectedItem.itemName}
            description={`Live price: ${formatCash(selectedItem.currentPrice)} · 30-day price history`}
            action={
              <button
                onClick={() => setSelectedItem(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-4">
              {/* Key stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Current Price', value: formatCash(selectedItem.currentPrice), color: 'text-zinc-100' },
                  { label: 'Market Average', value: formatCash(selectedItem.marketAvg), color: 'text-zinc-400' },
                  { label: '7D MA', value: formatCash(selectedItem.ma7), color: 'text-blue-400' },
                  { label: '30D MA', value: formatCash(selectedItem.ma30), color: 'text-rose-400' },
                  { label: '% Deviation', value: formatPercent(selectedItem.deviation), color: selectedItem.deviation < 0 ? 'text-emerald-400' : 'text-rose-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-lg bg-zinc-800/60">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className={cn('font-mono font-semibold text-sm', color)}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-2">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> Price</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block border-dashed" style={{ borderTopWidth: 1, background: 'none', borderColor: '#60a5fa' }} /> 7D MA</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-400 inline-block" /> 30D MA</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.4)" />
                    <XAxis dataKey="time" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCash(v)} width={70} />
                    <Tooltip
                      formatter={(v: number, n: string) => [formatCash(v), n]}
                      contentStyle={{ background: 'rgb(24,24,27)', border: '1px solid rgb(63,63,70)', borderRadius: 8 }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} fill="url(#pg)" dot={false} name="Price" />
                    <Area type="monotone" dataKey="ma7" stroke="#60a5fa" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} name="7D MA" />
                    <Area type="monotone" dataKey="ma30" stroke="#f87171" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} name="30D MA" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Signal detail */}
              <div className={cn(
                'p-3 rounded-lg border flex items-center gap-3',
                selectedItem.signal === 'buy' ? 'bg-emerald-500/5 border-emerald-500/20' :
                selectedItem.signal === 'sell' ? 'bg-rose-500/5 border-rose-500/20' :
                'bg-amber-500/5 border-amber-500/20',
              )}>
                <Badge variant={selectedItem.signal}>{selectedItem.signal.toUpperCase()}</Badge>
                <p className="text-sm text-zinc-300">
                  {selectedItem.signal === 'buy' && 'Price is below moving averages — potentially undervalued. Good time to buy.'}
                  {selectedItem.signal === 'sell' && 'Price is above moving averages — potentially overvalued. Consider selling.'}
                  {selectedItem.signal === 'hold' && 'Price is within normal range. No strong buy or sell signal.'}
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Tip when no item selected */}
        {!selectedItem && !isLoading && items.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Click any item name to see its full price history chart and analytics</span>
          </div>
        )}

        {/* Market table */}
        <SectionCard
          title="Market Items"
          description={`${filtered.length} items${signalFilter !== 'all' ? ` · ${signalFilter} signal` : ''} · Live Torn API prices`}
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items…"
                className="pl-8 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-44"
              />
            </div>
          }
          noPad
        >
          {!isLoading && error ? (
            <EmptyState
              icon={TrendingUp}
              title="Failed to load market data"
              description={error instanceof Error ? error.message : 'Check your API key and try again.'}
            />
          ) : (
            <DataTable
              data={tableData}
              columns={columns}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              isLoading={isLoading}
              rowKey="itemId"
              emptyMessage="No items match your search or filter."
            />
          )}
        </SectionCard>
      </div>
    </AppLayout>
  );
}
