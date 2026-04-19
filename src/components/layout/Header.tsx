'use client';
import { usePathname } from 'next/navigation';
import { RefreshCw, Bell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your real-time overview' },
  '/market': { title: 'Market Intelligence', subtitle: 'Price analytics and trade signals' },
  '/attack-finder': { title: 'Attack Finder', subtitle: 'Ranked targets by win probability' },
  '/trade-scanner': { title: 'Trade Scanner', subtitle: 'Underpriced listings and opportunities' },
  '/bazaar': { title: 'Bazaar Optimizer', subtitle: 'Price your items competitively' },
  '/profile': { title: 'Profile Analytics', subtitle: 'Your stats and progression' },
};

export function Header() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const page = PAGE_TITLES[pathname] ?? { title: 'TornIQ', subtitle: '' };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="font-syne font-bold text-lg text-zinc-100 leading-none">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-zinc-500 mt-0.5">{page.subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-online" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing} className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-all border border-zinc-700">
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-all border border-zinc-700 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
