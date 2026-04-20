'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import type {
  DashboardStats, MarketAnalytics, AttackTarget,
  TradeOpportunityDisplay, AttackFinderFilters,
} from '@/types/torn';

// Helper to make authenticated API calls
async function apiFetch<T>(url: string, apiKey: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'x-api-key': apiKey },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'API request failed');
  return json.data as T;
}

export function useDashboard() {
  const apiKey = useAuthStore((s) => s.apiKey);
  return useQuery({
    queryKey: ['dashboard', apiKey],
    queryFn: () => apiFetch<DashboardStats>('/api/user/dashboard', apiKey!),
    enabled: !!apiKey,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useMarketItems(filters?: { sortBy?: string; itemType?: string }) {
  const apiKey = useAuthStore((s) => s.apiKey);
  return useQuery({
    queryKey: ['market', 'items', filters],
    queryFn: async (): Promise<MarketAnalytics[]> => {
      const params = new URLSearchParams();
      if (filters?.sortBy) params.set('sortBy', filters.sortBy);
      if (filters?.itemType) params.set('type', filters.itemType);
      return apiFetch<MarketAnalytics[]>(`/api/market/items?${params}`, apiKey!);
    },
    enabled: !!apiKey,
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useAttackTargets(filters?: AttackFinderFilters) {
  const apiKey = useAuthStore((s) => s.apiKey);
  return useQuery({
    queryKey: ['players', filters],
    queryFn: async (): Promise<AttackTarget[]> => {
      const params = new URLSearchParams();
      if (filters) {
        params.set('minLevel', String(filters.minLevel));
        params.set('maxLevel', String(filters.maxLevel));
        params.set('minWin', String(filters.minWinProbability));
        params.set('maxRisk', String(filters.maxRiskScore));
        if (filters.statusFilter.length) params.set('status', filters.statusFilter.join(','));
      }
      return apiFetch<AttackTarget[]>(`/api/players?${params}`, apiKey!);
    },
    enabled: !!apiKey,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useTradeOpportunities(filters?: { minProfitPercent?: number; sortBy?: string }) {
  const apiKey = useAuthStore((s) => s.apiKey);
  return useQuery({
    queryKey: ['trade', 'opportunities', filters],
    queryFn: async (): Promise<TradeOpportunityDisplay[]> => {
      const params = new URLSearchParams();
      if (filters?.minProfitPercent) params.set('minProfit', String(filters.minProfitPercent));
      if (filters?.sortBy) params.set('sortBy', filters.sortBy);
      return apiFetch<TradeOpportunityDisplay[]>(`/api/trade?${params}`, apiKey!);
    },
    enabled: !!apiKey,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
    retry: 1,
  });
}

export function useValidateApiKey() {
  const { setApiKey, setValidated, setValidationError, setValidating } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (apiKey: string) => {
      setValidating(true);
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Invalid API key');
      return json.data;
    },
    onMutate: (apiKey) => setApiKey(apiKey),
    onSuccess: (data) => {
      setValidated({ name: data.name, id: String(data.player_id), level: data.level });
      queryClient.clear();
    },
    onError: (error: Error) => setValidationError(error.message),
  });
}
