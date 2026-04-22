'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { SectionCard, Badge, Skeleton, EmptyState } from '@/components/ui/index';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { formatCash, formatPercent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Package, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface HoldingItem {
  [key: string]: unknown;
  itemId: number;
  name: string;
  type: string;
  quantity: number;
  equipped: boolean;
  marketValue: number;
  totalValue: number;
  signal: 'buy' | 'sell' | 'hold';
  signalStrength: number;
  deviation: number;
  ma7: number;
  ma30: number;
  recommendation: {
    action: string;
    reason: string;
    urgency: 'high' | 'medium' | 'low';
  };
}

interface InventoryResponse {
  data: HoldingItem[];
  totalPortfolioValue: number;
  itemCount: number;
  empty?: boolean;
}

export default function HoldingsPage() {
  const apiKey = useAuthStore((s) => s.apiKey);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', apiKey],
    queryFn: async (): Promise<InventoryResponse> => {
      const res = await fetch('/api/user/inventory', {
        headers: { 'x-api-key': apiKey ?? '' },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Failed to fetch inventory');
      return json;
    },
    enabled: !!apiKey,
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const holdings = data?.data ?? [];

  const sellCount = holdings.filter((h) => h.signal === 'sell').length;
  const holdCount = holdings.filter((h) => h.signal !== 'sell').length;
  const urgentSells = holdings.filter((h) => h.recommendation.urgency === 'high').length;

  const columns: Column<HoldingItem>[] = [
    {
      key: 'name',
      header: 'Item',
      render: (v, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-100">{String(v)}</span>
            {row.equipped && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                Equipped
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">{String(row.type)}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'center',
      render: (v) => <span className="font-mono text-zinc-300">×{String(v)}</span>,
    },
    {
      key: 'marketValue',
      header: 'Market Price',
      align: 'right',
      sortable: true,
      render: (v) => <span className="font-mono text-zinc-200">{formatCash(Number(v))}</span>,
    },
    {
      key: 'totalValue',
      header: 'Total Value',
      align: 'right',
      sortable: true,
      render: (v) => <span className="font-mono font-semibold text-amber-400">{formatCash(Number(v))}</span>,
    },
    {
      key: 'deviation',
      header: '% vs Avg',
      align: 'right',
      sortable: true,
      render: (v) => {
        const n = Number(v);
        return (
          <span className={cn('font-mono font-semibold', n > 0 ? 'text-rose-400' : n < 0 ? 'text-emerald-400' : 'text-zinc-400')}>
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
      key: 'recommendation',
      header: 'Recommendation',
      render: (_, row) => {
        const rec = row.recommendation as HoldingItem['recommendation'];
        const urgencyColor =
          rec.urgency === 'high' ? 'text-rose-400' :
          rec.urgency === 'medium' ? 'text-amber-400' : 'text-zinc-400';
        const Icon =
          row.signal === 'sell' ? TrendingDown :
          row.signal === 'buy' ? TrendingUp : Minus;
        return (
          <div className="flex items-start gap-2">
            <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', urgencyColor)} />
            <div>
              <p className={cn('text-xs font-semibold', urgencyColor)}>{rec.action}</p>
              <p className="text-xs text-zinc-500 max-w-xs">{rec.reason}</p>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-syne font-bold text-xl text-zinc-100">Item Holdings</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Your inventory items with live market signals and sell recommendations
            </p>
          </div>
          {urgentSells > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-rose-400 font-medium">{urgentSells} urgent sell{urgentSells > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Portfolio Value"
            value={isLoading ? '—' : formatCash(data?.totalPortfolioValue ?? 0)}
            icon={Package}
            color="amber"
            subtitle="Total market value"
          />
          <StatCard
            title="Items Held"
            value={isLoading ? '—' : data?.itemCount ?? 0}
            icon={Package}
            color="default"
            subtitle="Unique item types"
          />
          <StatCard
            title="Sell Signals"
            value={isLoading ? '—' : sellCount}
            icon={TrendingDown}
            color="rose"
            subtitle="Items to consider selling"
          />
          <StatCard
            title="Hold / Accumulate"
            value={isLoading ? '—' : holdCount}
            icon={TrendingUp}
            color="emerald"
            subtitle="Items to keep"
          />
        </div>

        {/* Error state */}
        {error && !isLoading && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-rose-400">Failed to load inventory</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Make sure your Torn API key has <strong>Items</strong> access enabled in Torn Preferences → API.
              </p>
            </div>
          </div>
        )}

        {/* Urgent sells banner */}
        {!isLoading && urgentSells > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-400">
                {urgentSells} item{urgentSells > 1 ? 's are' : ' is'} significantly above market average
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Consider selling these now while prices are high. Check the Signal column below.
              </p>
            </div>
          </div>
        )}

        {/* Holdings table */}
        <SectionCard
          title="Your Inventory"
          description={isLoading ? 'Loading...' : `${holdings.length} item types · Sorted by total value`}
          noPad
        >
          {!isLoading && !error && holdings.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No items in inventory"
              description="Your Torn inventory is empty, or your API key does not have Items access."
            />
          ) : (
            <DataTable
              data={holdings}
              columns={columns}
              isLoading={isLoading}
              rowKey="itemId"
              emptyMessage="No items found in your inventory."
            />
          )}
        </SectionCard>

        <p className="text-xs text-zinc-600 text-center">
          Market signals are based on 7-day and 30-day moving averages. Recommendations are advisory only — use your own judgment.
        </p>
      </div>
    </AppLayout>
  );
}
