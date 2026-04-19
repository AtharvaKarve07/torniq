import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const colorMap = {
  default: { icon: 'text-zinc-400 bg-zinc-800', border: 'border-zinc-800' },
  amber: { icon: 'text-amber-400 bg-amber-400/10', border: 'border-amber-500/20' },
  emerald: { icon: 'text-emerald-400 bg-emerald-400/10', border: 'border-emerald-500/20' },
  rose: { icon: 'text-rose-400 bg-rose-400/10', border: 'border-rose-500/20' },
  blue: { icon: 'text-blue-400 bg-blue-400/10', border: 'border-blue-500/20' },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'default', className }: {
  title: string; value: string | number; subtitle?: string; icon?: LucideIcon;
  trend?: { value: number; label: string }; color?: keyof typeof colorMap; className?: string;
}) {
  const colors = colorMap[color];
  return (
    <div className={cn('relative p-5 rounded-xl bg-zinc-900 border transition-all hover:border-zinc-600', colors.border, className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</p>
        {Icon && <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.icon)}><Icon className="w-4 h-4" /></div>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-syne font-bold text-2xl text-zinc-100 tabular-nums leading-none mb-1">{value}</p>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', trend.value >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10')}>
            <span>{trend.value >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
