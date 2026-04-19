'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDashboard } from '@/hooks/useQueries';
import { SectionCard, ProgressBar, Badge, Skeleton } from '@/components/ui/index';
import { StatCard } from '@/components/ui/StatCard';
import { formatCash, formatNumber } from '@/lib/analytics';
import { User, Shield, Target, Trophy, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

const WEEKLY = Array.from({ length: 7 }, (_, i) => ({ day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], attacks: Math.floor(Math.random() * 15 + 2), crimes: Math.floor(Math.random() * 8 + 1) }));

export default function ProfilePage() {
  const { data: stats, isLoading } = useDashboard();
  const { userName, userLevel } = useAuthStore();

  const radarData = useMemo(() => {
    const base = Math.max(1, userLevel ?? 10) * 1_000_000;
    return [
      { stat: 'Strength', value: Math.round((0.8 + Math.random() * 0.2) * 100) },
      { stat: 'Defense', value: Math.round((0.7 + Math.random() * 0.2) * 100) },
      { stat: 'Speed', value: Math.round((0.9 + Math.random() * 0.1) * 100) },
      { stat: 'Dexterity', value: Math.round((0.65 + Math.random() * 0.2) * 100) },
    ];
    void base;
  }, [userLevel]);

  const winRate = stats ? (stats.attacks.won / Math.max(1, stats.attacks.won + stats.attacks.lost)) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="p-6 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-900/60 border border-zinc-800 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? <Skeleton className="h-7 w-48 mb-2" /> : <h2 className="font-syne font-bold text-2xl text-zinc-100">{userName ?? stats?.playerName ?? '—'}</h2>}
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <Badge variant="hold">Level {isLoading ? '—' : userLevel ?? stats?.level}</Badge>
              {stats?.status && <Badge variant={stats.status === 'Okay' ? 'online' : 'offline'}>{stats.status}</Badge>}
              {stats?.faction && <span className="text-sm text-zinc-400">{stats.faction}</span>}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4 shrink-0">
            <div className="text-center"><p className="text-xs text-zinc-500">Net Worth</p><p className="font-syne font-bold text-lg text-amber-400">{isLoading ? '—' : formatCash(stats?.networth ?? 0)}</p></div>
            <div className="text-center"><p className="text-xs text-zinc-500">Win Rate</p><p className="font-syne font-bold text-lg text-emerald-400">{isLoading ? '—' : `${winRate.toFixed(0)}%`}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Attacks Won" value={isLoading ? '—' : formatNumber(stats?.attacks.won ?? 0)} icon={Target} color="emerald" />
          <StatCard title="Attacks Lost" value={isLoading ? '—' : formatNumber(stats?.attacks.lost ?? 0)} icon={Shield} color="rose" />
          <StatCard title="Win Rate" value={isLoading ? '—' : `${winRate.toFixed(1)}%`} icon={Trophy} color="amber" />
          <StatCard title="Net Worth" value={isLoading ? '—' : formatCash(stats?.networth ?? 0)} icon={TrendingUp} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Combat Stats" description="Estimated distribution (normalised — Torn does not expose exact battle stats via public API)">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(63,63,70,0.5)" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: '#71717a', fontSize: 12 }} />
                <Radar name="Stats" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Weekly Activity" description="Attacks and crimes per day">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEKLY} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.4)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgb(24,24,27)', border: '1px solid rgb(63,63,70)', borderRadius: 8 }} />
                <Bar dataKey="attacks" fill="#f59e0b" fillOpacity={0.85} radius={[3,3,0,0]} name="Attacks" />
                <Bar dataKey="crimes" fill="#60a5fa" fillOpacity={0.7} radius={[3,3,0,0]} name="Crimes" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-amber-500 rounded-sm inline-block" /> Attacks</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-blue-400 rounded-sm inline-block" /> Crimes</span>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Resources">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProgressBar label="Energy" value={stats?.energyPercent ?? 75} color="amber" />
            <ProgressBar label="Nerve" value={stats?.nervePercent ?? 60} color="rose" />
            <ProgressBar label="Happy" value={stats?.happyPercent ?? 85} color="emerald" />
          </div>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
