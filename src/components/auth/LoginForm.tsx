'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Key, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useValidateApiKey } from '@/hooks/useQueries';

export function LoginForm() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const router = useRouter();
  const { mutate: validate, isPending, isSuccess, isError, error } = useValidateApiKey();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    validate(apiKey.trim(), { onSuccess: () => setTimeout(() => router.push('/dashboard'), 600) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-syne text-2xl font-bold text-zinc-100 mb-1">Connect your account</h2>
        <p className="text-sm text-zinc-400">Enter your Torn API key to get started</p>
      </div>
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <p className="text-xs text-amber-400/80 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>
            Get your API key from{' '}
            <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline underline-offset-2 inline-flex items-center gap-1">
              Torn Preferences <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-amber-400" /> API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Torn API key"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono pr-12"
              disabled={isPending || isSuccess}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{error instanceof Error ? error.message : 'Invalid API key'}</p>
          </div>
        )}
        {isSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">Verified! Redirecting to dashboard...</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isPending || isSuccess || !apiKey.trim()}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-syne font-semibold py-3 rounded-lg transition-all text-sm"
        >
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating...</> : isSuccess ? <><CheckCircle className="w-4 h-4" /> Verified!</> : 'Connect to TornIQ'}
        </button>
      </form>
      <p className="text-xs text-zinc-600 text-center leading-relaxed">
        Your API key is stored locally and never sent to our servers. Read-only access only.
      </p>
    </div>
  );
}
