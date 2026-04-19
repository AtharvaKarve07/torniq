'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDashboard } from '@/hooks/useQueries';
import { StatCard } from '@/components/ui/StatCard';
import { SectionCard, ProgressBar, Badge, Skeleton } from '@/components/ui/index';
import { formatCash, formatNumber } from '@/lib/analytics';
import { generateMockPriceHistory } from '@/lib/utils';
import { Activity, DollarSign, Target, Zap, TrendingUp, Shield } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboard();

  const networthHistory = useMemo(() => {
    const base = stats?.networth ?? 10_000_000;
    return generateMockPriceHistory(base, 14).map((p, i) => ({ day: `D${i + 1}`, value: p.price }));
  }, [stats?.networth]);

  const winRate = stats ? (stats.attacks.won / Math.max(1, stats.attacks.won + stats.attacks.lost)) * 100 : 0;
  const statusVariant = stats?.status === 'Okay' ? 'online' : stats?.status === 'Hospital' ? 'hospital' : 'offline';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {isLoading ? <Skeleton className="h-16 w-full" /> : (
          <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/20 border border-zinc-800">
            <div>
              <h2 className="font-syne text-xl font-bold text-zinc-100">Welcome back, {stats?.playerName ?? '—'}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-zinc-400">Level {stats?.level ?? '—'}</p>
                {stats?.faction && <><span className="text-zinc-700">•</span><p className="text-sm text-zinc-400">{stats.faction}</p></>}
                {stats?.status && <Badge variant={statusVariant as 'online' | 'offline' | 'hospital'}>{stats.status}</Badge>}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>{stats?.activeOpportunities ?? 0} active opportunities</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Net Worth" value={isLoading ? '—' : formatCash(stats?.networth ?? 0)} icon={DollarSign} color="amber" subtitle="Total wealth" trend={{ value: 3.2, label: 'vs last week' }} />
          <StatCard title="Attacks Won" value={isLoading ? '—' : formatNumber(stats?.attacks.won ?? 0)} icon={Target} color="emerald" subtitle={`Win rate: ${winRate.toFixed(0)}%`} />
          <StatCard title="Opportunities" value={isLoading ? '—' : stats?.activeOpportunities ?? 0} icon={Zap} color="blue" subtitle="Active trade deals" />
          <StatCard title="Recent Profits" value={isLoading ? '—' : formatCash(stats?.recentProfits ?? 0)} icon={TrendingUp} color="rose" subtitle="Last 7 days" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Player Status" description="Current resource levels">
            <div className="space-y-5">
              {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />) : (
                <>
                  <ProgressBar label="Energy" value={stats?.energyPercent ?? 0} color="amber" />
                  <ProgressBar label="Nerve" value={stats?.nervePercent ?? 0} color="rose" />
                  <ProgressBar label="Happy" value={stats?.happyPercent ?? 0} color="emerald" />
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Net Worth History" description="14-day trend" className="lg:col-span-2">
            {isLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={networthHistory}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.4)" />
                  <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCash(v)} />
                  <Tooltip formatter={(v: number) => [formatCash(v), 'Net Worth']} contentStyle={{ background: 'rgb(24,24,27)', border: '1px solid rgb(63,63,70)', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#nwGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Attack Summary">
            <div className="space-y-3">
              {[
                { label: 'Attacks Won', value: stats?.attacks.won ?? 0, color: 'text-emerald-400' },
                { label: 'Attacks Lost', value: stats?.attacks.lost ?? 0, color: 'text-rose-400' },
                { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, color: winRate >= 60 ? 'text-emerald-400' : 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-400">{label}</span>
                  <span className={`font-syne font-bold tabular-nums ${color}`}>{isLoading ? '—' : value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/market', icon: TrendingUp, label: 'Check Signals', color: 'text-amber-400' },
                { href: '/attack-finder', icon: Target, label: 'Find Targets', color: 'text-emerald-400' },
                { href: '/trade-scanner', icon: Zap, label: 'Scan Trades', color: 'text-blue-400' },
                { href: '/profile', icon: Shield, label: 'My Stats', color: 'text-zinc-400' },
              ].map(({ href, icon: Icon, label, color }) => (
                <a key={href} href={href} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all group">
                  <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm font-medium text-zinc-300">{label}</span>
                </a>
              ))}
            </div>
          </SectionCard>
        </div>

        {error && <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">Failed to load: {error instanceof Error ? error.message : 'Unknown error'}</div>}
      </div>
    </AppLayout>
  );
}
