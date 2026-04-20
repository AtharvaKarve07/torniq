'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, Target, ArrowLeftRight,
  ShoppingBag, User, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/market', icon: TrendingUp, label: 'Market Intel' },
  { href: '/attack-finder', icon: Target, label: 'Attack Finder' },
  { href: '/trade-scanner', icon: ArrowLeftRight, label: 'Trade Scanner' },
  { href: '/bazaar', icon: ShoppingBag, label: 'Bazaar Optimizer' },
  { href: '/profile', icon: User, label: 'Profile Analytics' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();
  const { userName, userLevel, logout } = useAuthStore();
  const router = useRouter();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen z-40 flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60',
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-zinc-800 px-4', collapsed && 'justify-center px-0')}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center shrink-0">
              <span className="font-syne font-black text-zinc-950 text-sm">T</span>
            </div>
            <span className="font-syne font-bold text-lg tracking-tight">
              Torn<span className="text-amber-400">IQ</span>
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center">
            <span className="font-syne font-black text-zinc-950 text-sm">T</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800',
                collapsed && 'justify-center px-0 mx-2',
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3 space-y-1">
        {!collapsed && userName && (
          <div className="px-3 py-2 rounded-lg bg-zinc-800/50">
            <p className="text-xs font-syne font-semibold text-zinc-100 truncate">{userName}</p>
            <p className="text-xs text-zinc-500">Level {userLevel ?? '—'}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); router.push('/'); }}
          className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-rose-400 hover:bg-rose-400/5 transition-all', collapsed && 'justify-center')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
