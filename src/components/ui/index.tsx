import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'buy'|'sell'|'hold'|'online'|'offline'|'idle'|'hospital'|'default';
const badgeVariants: Record<BadgeVariant, string> = {
  buy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  sell: 'text-rose-400 bg-rose-400/10 border-rose-400/25',
  hold: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  online: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  offline: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/25',
  idle: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  hospital: 'text-blue-400 bg-blue-400/10 border-blue-400/25',
  default: 'text-zinc-300 bg-zinc-700/50 border-zinc-600',
};
export function Badge({ children, variant = 'default', size = 'sm', className }: { children: React.ReactNode; variant?: BadgeVariant; size?: 'sm'|'md'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-wide', size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1', badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
const progressColors = { amber: 'bg-amber-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500', blue: 'bg-blue-500' };
export function ProgressBar({ value, label, sublabel, color = 'amber', showPercent = true, className }: { value: number; label?: string; sublabel?: string; color?: 'amber'|'emerald'|'rose'|'blue'; showPercent?: boolean; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-zinc-400">{label}</span>}
          {sublabel && <span className="text-zinc-500">{sublabel}</span>}
          {showPercent && <span className="font-mono text-zinc-300 font-medium">{clamped.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', progressColors[color])} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-zinc-800', className)} />;
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4"><Icon className="w-7 h-7 text-zinc-500" /></div>}
      <h3 className="font-syne font-semibold text-zinc-200 mb-2">{title}</h3>
      {description && <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
export function SectionCard({ title, description, action, children, className, noPad }: { title?: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; noPad?: boolean }) {
  return (
    <div className={cn('rounded-xl bg-zinc-900 border border-zinc-800', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            {title && <h3 className="font-syne font-semibold text-zinc-100 text-sm">{title}</h3>}
            {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn(!noPad && 'p-5')}>{children}</div>
    </div>
  );
}
