'use client';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAttackTargets } from '@/hooks/useQueries';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SectionCard, Badge, EmptyState } from '@/components/ui/index';
import { formatCash, formatNumber } from '@/lib/analytics';
import { toPercent, cn } from '@/lib/utils';
import { SlidersHorizontal, AlertTriangle, ExternalLink, Swords, Info } from 'lucide-react';
import type { AttackFinderFilters } from '@/types/torn';

type TargetRow = {
  [key: string]: unknown;
  id: string;
  tornId: string;
  name: string;
  level: number;
  status: string;
  lastAction: string;
  estimatedStats: number;
  winProbability: number;
  riskScore: number;
  rewardEstimate: number;
  faction?: string;
  reasons: string[];
};

const DEFAULT_FILTERS: AttackFinderFilters = {
  minLevel: 1,
  maxLevel: 100,
  minWinProbability: 0.4,
  maxRiskScore: 0.8,
  excludeFaction: false,
  statusFilter: ['online', 'idle', 'offline'],
};

const STATUS_MAP: Record<string, { variant: 'online' | 'offline' | 'idle' | 'hospital'; label: string }> = {
  online: { variant: 'online', label: 'Online' },
  offline: { variant: 'offline', label: 'Offline' },
  idle: { variant: 'idle', label: 'Idle' },
  Hospital: { variant: 'hospital', label: 'Hospital' },
  Okay: { variant: 'online', label: 'Active' },
};

export default function AttackFinderPage() {
  const [filters, setFilters] = useState<AttackFinderFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const { data: targets = [], isLoading, error } = useAttackTargets(filters);

  // Check if it's a "no history" error vs a real error
  const isNoHistory = error instanceof Error && error.message.includes('No attack history');

  const tableData: TargetRow[] = targets.map((t) => ({ ...t, id: t.tornId }));

  const columns: Column<TargetRow>[] = [
    {
      key: 'name',
      header: 'Player',
      render: (v, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-100">{String(v)}</span>
            <a
              href={`https://www.torn.com/profiles.php?XID=${row.tornId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-amber-400 transition-colors"
              title="View profile on Torn"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <span className="text-xs text-zinc-500">#{row.tornId}</span>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Lvl',
      align: 'center',
      sortable: true,
      render: (v) => <span className="font-mono text-zinc-300">{String(v)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (v) => {
        const s = STATUS_MAP[String(v)] ?? { variant: 'default' as const, label: String(v) };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'lastAction',
      header: 'Last Active',
      render: (v) => <span className="text-xs text-zinc-400">{String(v)}</span>,
    },
    {
      key: 'winProbability',
      header: 'Win %',
      align: 'right',
      sortable: true,
      render: (v) => {
        const n = Number(v);
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', n >= 0.7 ? 'bg-emerald-500' : n >= 0.5 ? 'bg-amber-500' : 'bg-rose-500')}
                style={{ width: `${n * 100}%` }}
              />
            </div>
            <span className={cn('font-mono font-semibold text-sm min-w-[3rem] text-right', n >= 0.7 ? 'text-emerald-400' : n >= 0.5 ? 'text-amber-400' : 'text-rose-400')}>
              {toPercent(n)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'riskScore',
      header: 'Risk',
      align: 'center',
      sortable: true,
      render: (v) => {
        const n = Number(v);
        return <Badge variant={n < 0.3 ? 'buy' : n < 0.6 ? 'hold' : 'sell'}>{n < 0.3 ? 'Low' : n < 0.6 ? 'Med' : 'High'}</Badge>;
      },
    },
    {
      key: 'rewardEstimate',
      header: 'Est. Reward',
      align: 'right',
      sortable: true,
      render: (v) => <span className="font-mono text-amber-400">{formatCash(Number(v))}</span>,
    },
    {
      key: 'faction',
      header: 'Faction',
      render: (v) => <span className="text-xs text-zinc-400">{v ? String(v) : '—'}</span>,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400/80">
            <strong className="text-amber-400">Recommendations only.</strong>{' '}
            Targets are sourced from your real Torn attack history. Win probability is estimated — actual results vary.
            No automation. All attack links open Torn directly.
          </p>
        </div>

        {/* How it works info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-400/80">
            TornIQ analyzes your <strong className="text-blue-400">real attack history</strong> to find players you have previously interacted with.
            As you attack and defend more on Torn, this list will grow with real ranked targets.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Targets Found', value: targets.length, color: 'text-zinc-100' },
            { label: 'Win ≥70%', value: targets.filter((t) => t.winProbability >= 0.7).length, color: 'text-emerald-400' },
            { label: 'Low Risk', value: targets.filter((t) => t.riskScore < 0.3).length, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
              <p className={cn('font-syne font-bold text-3xl tabular-nums', color)}>
                {isLoading ? '—' : value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <SectionCard
          title="Filters"
          action={
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showFilters ? 'Hide' : 'Show'} filters
            </button>
          }
        >
          {showFilters ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([['Min Level', 'minLevel', 1, undefined], ['Max Level', 'maxLevel', undefined, 100]] as const).map(([label, key, min, max]) => (
                <div key={key}>
                  <label className="text-xs text-zinc-400 mb-1.5 block">{label}</label>
                  <input
                    type="number"
                    value={filters[key] as number}
                    onChange={(e) => setFilters((f) => ({ ...f, [key]: +e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/60"
                    min={min}
                    max={max}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">
                  Min Win: {(filters.minWinProbability * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  value={filters.minWinProbability}
                  onChange={(e) => setFilters((f) => ({ ...f, minWinProbability: +e.target.value }))}
                  min={0} max={1} step={0.05}
                  className="w-full accent-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">
                  Max Risk: {(filters.maxRiskScore * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  value={filters.maxRiskScore}
                  onChange={(e) => setFilters((f) => ({ ...f, maxRiskScore: +e.target.value }))}
                  min={0} max={1} step={0.05}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Level {filters.minLevel}–{filters.maxLevel} · Win ≥{(filters.minWinProbability * 100).toFixed(0)}% · Risk ≤{(filters.maxRiskScore * 100).toFixed(0)}%
            </p>
          )}
        </SectionCard>

        {/* Targets table */}
        <SectionCard
          title="Recommended Targets"
          description="From your real Torn attack history — ranked by win probability"
          noPad
        >
          {/* No attack history state */}
          {isNoHistory && (
            <EmptyState
              icon={Swords}
              title="No attack history yet"
              description="TornIQ uses your Torn attack history to find real targets. Start attacking players on Torn and they will appear here ranked by win probability."
              action={
                <a
                  href="https://www.torn.com/loader.php?sid=attack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to Torn to attack
                </a>
              }
            />
          )}

          {/* Real error */}
          {error && !isNoHistory && (
            <EmptyState
              icon={AlertTriangle}
              title="Failed to load targets"
              description={error instanceof Error ? error.message : 'Unknown error. Check your API key.'}
            />
          )}

          {/* Data */}
          {!error && (
            <DataTable
              data={tableData}
              columns={columns}
              isLoading={isLoading}
              rowKey="id"
              emptyMessage="No targets match your current filters. Try widening the level range or lowering the win % threshold."
            />
          )}
        </SectionCard>
      </div>
    </AppLayout>
  );
}
