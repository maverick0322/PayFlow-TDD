import { create } from 'zustand';
import type { DashboardSummary, SystemStatus } from '../types/dashboard.types';
import { dashboardApi } from '../api/dashboard.api';

/**
 * Derives system status from available balance ratio.
 * Mirrors the business rule: < 10% of PMT → at_risk, EJERCICIO_DEFICIT → critical.
 */
function deriveStatus(summary: DashboardSummary): SystemStatus {
  if (summary.budgetState === 'EJERCICIO_DEFICIT') return 'critical';
  const ratio = summary.totalBudget > 0 ? summary.availableBalance / summary.totalBudget : 1;
  if (ratio < 0.10) return 'critical';
  if (ratio < 0.25) return 'at_risk';
  return 'healthy';
}

interface DashboardState {
  summary:      DashboardSummary | null;
  isLoading:    boolean;
  error:        string | null;
  fetchSummary: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary:   null,
  isLoading: false,
  error:     null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw     = await dashboardApi.getSummary();
      const summary = { ...raw, systemStatus: deriveStatus(raw) };
      set({ summary, isLoading: false });
    } catch {
      set({ error: 'Error al cargar el dashboard', isLoading: false });
    }
  },
}));
