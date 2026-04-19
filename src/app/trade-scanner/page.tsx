'use client';
import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTradeOpportunities } from '@/hooks/useQueries';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SectionCard, Badge } from '@/components/ui/index';
import { formatCash } from '@/lib/analytics';
import { timeAgo, cn } from '@/lib/utils';
import { ExternalLink, Search } from 'lucide-react';
import type { TradeOpportunityDisplay } from '@/types/torn';

type OppRow = TradeOpportunityDisplay & { [key: string]: unknown };

export default function TradeScannerPage() {
  const [minProfit, setMinProfit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('profitPercent');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const { data: opportunities = [], isLoading, error } = useTradeOpportunities({ minProfitPercent: minProfit });

  const sorted = useMemo(() => {
    return [...opportunities]
      .filter((o) => !search || o.itemName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const av = a[sortKey as keyof TradeOpportunityDisplay] as number;
        const bv = b[sortKey as keyof TradeOpportunityDisplay] as number;
        return sortDir === 'desc' ? bv - av : av - bv;
      });
  }, [opportunities, search, sortKey, sortDir]);

  const handleSort = (key: string) => { if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('desc'); } };
  const totalProfit = sorted.reduce((s, o) => s + o.profitAmount, 0);
  const avgPct = sorted.length ? sorted.reduce((s, o) => s + o.profitPercent, 0) / sorted.length : 0;

  const tableData: OppRow[] = sorted.map((o) => ({ ...o }));

  const columns: Column<OppRow>[] = [
    { key: 'itemName', header: 'Item', render: (v) => <span className="font-medium text-zinc-100">{String(v)}</span> },
    { key: 'listedPrice', header: 'Listed', align: 'right', sortable: true, render: (v) => <span className="font-mono text-emerald-400">{formatCash(Number(v))}</span> },
    { key: 'marketAvgPrice', header: 'Mkt Avg', align: 'right', render: (v) => <span className="font-mono text-zinc-400">{formatCash(Number(v))}</span> },
    { key: 'profitAmount', header: 'Profit $', align: 'right', sortable: true, render: (v) => <span className="font-mono font-semibold text-amber-400">{formatCash(Number(v))}</span> },
    { key: 'profitPercent', header: 'Profit %', align: 'right', sortable: true, render: (v) => { const n = Number(v); return <Badge variant={n >= 30 ? 'buy' : n >= 15 ? 'hold' : 'default'}>+{n.toFixed(1)}%</Badge>; } },
    { key: 'sellerName', header: 'Seller', render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-300">{String(v ?? 'Unknown')}</span>
        {row.sellerId && <a href={`https://www.torn.com/bazaar.php#${row.sellerId}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-amber-400 transition-colors"><ExternalLink className="w-3 h-3" /></a>}
      </div>
    )},
    { key: 'detectedAt', header: 'Detected', render: (v) => <span className="text-xs text-zinc-500">{timeAgo(String(v))}</span> },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Active Deals</p><p className="font-syne font-bold text-3xl text-zinc-100">{isLoading ? '—' : sorted.length}</p></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/20"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Potential Profit</p><p className="font-syne font-bold text-3xl text-emerald-400">{isLoading ? '—' : formatCash(totalProfit)}</p></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/20"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Avg Profit %</p><p className="font-syne font-bold text-3xl text-amber-400">{isLoading ? '—' : `+${avgPct.toFixed(1)}%`}</p></div>
        </div>

        <SectionCard title="Scanner Settings">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <label className="text-sm text-zinc-400 whitespace-nowrap">Min Profit: <span className="text-amber-400 font-mono">{minProfit}%</span></label>
              <input type="range" value={minProfit} onChange={(e) => setMinProfit(+e.target.value)} min={5} max={50} step={5} className="w-32 accent-amber-500" />
              <div className="flex gap-2">
                {[5, 10, 20, 30].map((v) => (
                  <button key={v} onClick={() => setMinProfit(v)} className={cn('px-2.5 py-1 rounded text-xs font-mono transition-colors', minProfit === v ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}>{v}%</button>
                ))}
              </div>
            </div>
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…" className="pl-8 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-44" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Trade Opportunities" description="Items listed below market average. Click seller link to open their bazaar." noPad>
          <DataTable data={tableData} columns={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} isLoading={isLoading} rowKey="id" emptyMessage={error ? 'Failed to scan trades.' : `No deals found with ≥${minProfit}% margin.`} />
        </SectionCard>
      </div>
    </AppLayout>
  );
}
