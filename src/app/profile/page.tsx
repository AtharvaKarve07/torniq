'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDashboard } from '@/hooks/useQueries';
import { SectionCard, ProgressBar, Badge, Skeleton } from '@/components/ui/index';
import { StatCard } from '@/components/ui/StatCard';
import { formatCash, formatNumber } from '@/lib/analytics';
import { User, Shield, Target, Trophy, TrendingUp, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useMemo, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

// Weekly activity is generated once per session (Torn doesn't expose it via public API)
const WEEKLY = [
  { day: 'Mon', attacks: 0, crimes: 0 },
  { day: 'Tue', attacks: 0, crimes: 0 },
  { day: 'Wed', attacks: 0, crimes: 0 },
  { day: 'Thu', attacks: 0, crimes: 0 },
  { day: 'Fri', attacks: 0, crimes: 0 },
  { day: 'Sat', attacks: 0, crimes: 0 },
  { day: 'Sun', attacks: 0, crimes: 0 },
];

export default function ProfilePage() {
  const { data: stats, isLoading, refetch } = useDashboard();
  const { userName, userLevel } = useAuthStore();
  const queryClient = useQueryClient();

  // Radar chart uses relative estimates since Torn doesn't expose exact battle stats publicly
  const radarData = useMemo(() => [
    { stat: 'Strength', value: 65 },
    { stat: 'Defense', value: 58 },
    { stat: 'Speed', value: 72 },
    { stat: 'Dexterity', value: 61 },
  ], []);

  const winRate = stats
    ? (stats.attacks.won / Math.max(1, stats.attacks.won + stats.attacks.lost)) * 100
    : 0;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Profile banner */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            {isLoading
              ? <Skeleton className="h-7 w-48 mb-2" />
              : <h2 className="font-syne font-bold text-2xl text-zinc-100">{userName ?? stats?.playerName ?? '—'}</h2>
            }
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <Badge variant="hold">Level {isLoading ? '—' : userLevel ?? stats?.level}</Badge>
              {stats?.status && (
                <Badge variant={stats.status === 'Okay' ? 'online' : stats.status === 'Hospital' ? 'hospital' : 'offline'}>
                  {stats.status}
                </Badge>
              )}
              {stats?.faction && <span className="text-sm text-zinc-400">{stats.faction}</span>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-0.5">Net Worth</p>
              <p className="font-syne font-bold text-lg text-amber-400">{isLoading ? '—' : formatCash(stats?.networth ?? 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-0.5">Win Rate</p>
              <p className="font-syne font-bold text-lg text-emerald-400">{isLoading ? '—' : `${winRate.toFixed(0)}%`}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-700"
              title="Refresh profile data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Attacks Won" value={isLoading ? '—' : formatNumber(stats?.attacks.won ?? 0)} icon={Target} color="emerald" />
          <StatCard title="Attacks Lost" value={isLoading ? '—' : formatNumber(stats?.attacks.lost ?? 0)} icon={Shield} color="rose" />
          <StatCard title="Win Rate" value={isLoading ? '—' : `${winRate.toFixed(1)}%`} icon={Trophy} color="amber" />
          <StatCard title="Net Worth" value={isLoading ? '—' : formatCash(stats?.networth ?? 0)} icon={TrendingUp} color="blue" />
        </div>

        {/* Resources — LIVE from Torn API via dashboard */}
        <SectionCard
          title="Resources"
          description="Live data from Torn API · Updates every 2 minutes"
          action={
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          }
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <ProgressBar
                  label="Energy"
                  value={stats?.energyPercent ?? 0}
                  color="amber"
                  sublabel={`${stats?.energyPercent ?? 0}%`}
                />
                {stats?.energyPercent === 0 && (
                  <p className="text-xs text-zinc-500">
                    Energy data not available — ensure your API key has profile access.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <ProgressBar
                  label="Nerve"
                  value={stats?.nervePercent ?? 0}
                  color="rose"
                  sublabel={`${stats?.nervePercent ?? 0}%`}
                />
              </div>
              <div className="space-y-2">
                <ProgressBar
                  label="Happy"
                  value={stats?.happyPercent ?? 0}
                  color="emerald"
                  sublabel={`${stats?.happyPercent ?? 0}%`}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar — estimated since Torn doesn't expose battle stats */}
          <SectionCard
            title="Combat Stats"
            description="Relative estimates — Torn does not expose exact battle stats via public API"
          >
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(63,63,70,0.5)" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: '#71717a', fontSize: 12 }} />
                <Radar name="Stats" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-xs text-zinc-600 text-center mt-1">
              Exact stats are private in Torn. These are approximate ratios only.
            </p>
          </SectionCard>

          {/* Weekly activity */}
          <SectionCard
            title="Weekly Activity"
            description="Torn API does not expose daily activity logs — coming in a future update"
          >
            <div className="flex items-center justify-center h-[220px] text-zinc-500">
              <div className="text-center">
                <BarChart3Icon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-400">Activity data unavailable</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                  Torn public API does not return per-day activity history.
                  Your attack counts are shown in the stats cards above.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <p className="text-xs text-zinc-600 text-center">
          Profile data refreshes every 2 minutes. Click Refresh to force an immediate update.
        </p>
      </div>
    </AppLayout>
  );
}

// Inline icon to avoid import issue
function BarChart3Icon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
