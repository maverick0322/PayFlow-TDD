import { create } from 'zustand';
import type { FundsConfig, FundsDistribution } from '../types/funds.types';
import { fundsApi } from '../api/funds.api';

interface FundsState {
  config:    FundsConfig;
  isSaving:  boolean;
  isLoading: boolean;
  error:     string | null;

  fetchConfig:      () => Promise<void>;
  setMonthlyBudget: (amount: number) => void;
  setSavingsAmount: (amount: number) => void;
  setCategory:      (key: keyof Pick<FundsConfig, 'servicesAmount' | 'subscriptionsAmount' | 'leisureAmount'>, amount: number) => void;
  saveConfig:       () => Promise<void>;
  getDistribution:  () => FundsDistribution;
}

export const useFundsStore = create<FundsState>((set, get) => ({
  config: {
    monthlyBudget:       5000,
    savingsAmount:       1000,
    servicesAmount:      500,
    subscriptionsAmount: 250,
    leisureAmount:       300,
  },
  isSaving:  false,
  isLoading: false,
  error:     null,

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await fundsApi.getConfig();
      set({ config, isLoading: false });
    } catch {
      set({ error: 'Error al cargar configuración', isLoading: false });
    }
  },

  setMonthlyBudget: (amount) =>
    set((state) => ({
      config: {
        ...state.config,
        monthlyBudget: amount,
        savingsAmount: Math.min(state.config.savingsAmount, amount),
      },
    })),

  setSavingsAmount: (amount) =>
    set((state) => ({
      config: {
        ...state.config,
        savingsAmount: Math.min(amount, state.config.monthlyBudget),
      },
    })),

  setCategory: (key, amount) =>
    set((state) => ({
      config: { ...state.config, [key]: Math.max(0, amount) },
    })),

  saveConfig: async () => {
    set({ isSaving: true, error: null });
    try {
      const saved = await fundsApi.saveConfig(get().config);
      set({ config: saved, isSaving: false });
    } catch {
      set({ error: 'Error al guardar configuración', isSaving: false });
    }
  },

  getDistribution: () => fundsApi.computeDistribution(get().config),
}));
