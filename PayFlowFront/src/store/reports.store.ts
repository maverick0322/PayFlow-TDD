import { create } from 'zustand';
import type { VariabilityReport } from '../types/reports.types';
import { reportsApi } from '../api/reports.api';

interface ReportsState {
  report: VariabilityReport | null;
  isLoading: boolean;
  error: string | null;
  fetchReport: () => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set) => ({
  report: null,
  isLoading: false,
  error: null,
  fetchReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const report = await reportsApi.getVariabilityReport();
      set({ report, isLoading: false });
    } catch {
      set({ error: 'Error al cargar reporte', isLoading: false });
    }
  },
}));
