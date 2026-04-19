'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isValidated } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!isValidated) router.replace('/'); }, [isValidated, router]);
  if (!isValidated) return null;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <div className="flex-1 ml-16 md:ml-60 flex flex-col min-h-screen transition-all duration-300">
        <Header />
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
