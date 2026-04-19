'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { TrendingUp, Target, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  const { isValidated } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (isValidated) router.push('/dashboard'); }, [isValidated, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(245,158,11,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.03) 1px,transparent 1px)`, backgroundSize: '48px 48px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative flex flex-col lg:flex-row min-h-screen">
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-16 lg:py-0">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="font-syne font-black text-zinc-950 text-lg">T</span>
              </div>
              <span className="font-syne font-bold text-2xl tracking-tight">Torn<span className="text-amber-400">IQ</span></span>
            </div>
            <h1 className="font-syne text-4xl lg:text-6xl font-bold leading-tight text-zinc-100 mb-4">
              Intelligence for<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Serious Players</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              Market analytics, attack recommendations, and trade scanning — powered by the Torn API.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {[
              { icon: TrendingUp, label: 'Market Intelligence', desc: 'Price history, signals & moving averages' },
              { icon: Target, label: 'Attack Finder', desc: 'Ranked targets by win probability' },
              { icon: Zap, label: 'Trade Scanner', desc: 'Detect underpriced listings instantly' },
              { icon: Shield, label: 'Profit Tracking', desc: 'Track earnings and performance' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-amber-400" />
                </div>
                <p className="font-syne font-semibold text-sm text-zinc-100 mb-1">{label}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-zinc-600">TornIQ uses read-only API access. No automation — recommendations only.</p>
        </div>
        <div className="w-full lg:w-[420px] flex items-center justify-center p-8 lg:border-l border-zinc-800/60">
          <div className="w-full max-w-sm"><LoginForm /></div>
        </div>
      </div>
    </div>
  );
}
