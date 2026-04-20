'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isValidated } = useAuthStore();
  const { collapsed } = useSidebarStore();
  const router = useRouter();

  useEffect(() => {
    if (!isValidated) router.replace('/');
  }, [isValidated, router]);

  if (!isValidated) return null;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <div className={cn(
        'flex flex-col min-h-screen flex-1 transition-all duration-300',
        collapsed ? 'ml-16' : 'ml-60',
      )}>
        <Header />
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
