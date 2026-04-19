'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { obfuscateKey, deobfuscateKey } from '@/lib/utils';

interface AuthState {
  apiKey: string | null;
  userName: string | null;
  userId: string | null;
  userLevel: number | null;
  isValidated: boolean;
  isValidating: boolean;
  validationError: string | null;
  setApiKey: (key: string) => void;
  setValidated: (user: { name: string; id: string; level: number }) => void;
  setValidationError: (error: string) => void;
  setValidating: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: null, userName: null, userId: null, userLevel: null,
      isValidated: false, isValidating: false, validationError: null,
      setApiKey: (key) => set({ apiKey: key, validationError: null }),
      setValidated: (user) => set({ userName: user.name, userId: user.id, userLevel: user.level, isValidated: true, isValidating: false, validationError: null }),
      setValidationError: (error) => set({ validationError: error, isValidating: false, isValidated: false }),
      setValidating: (v) => set({ isValidating: v }),
      logout: () => set({ apiKey: null, userName: null, userId: null, userLevel: null, isValidated: false, isValidating: false, validationError: null }),
    }),
    {
      name: 'torniq-auth',
      partialize: (state) => ({ apiKey: state.apiKey ? obfuscateKey(state.apiKey) : null, userName: state.userName, userId: state.userId, userLevel: state.userLevel, isValidated: state.isValidated }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthState> & { apiKey?: string | null };
        return { ...current, ...p, apiKey: p.apiKey ? deobfuscateKey(p.apiKey) : null };
      },
    },
  ),
);

export const useIsAuthenticated = () => useAuthStore((s) => s.isValidated && !!s.apiKey);
