import { apiClient } from './client';
import type { VariabilityReport } from '../types/reports.types';

export const reportsApi = {
  getVariabilityReport: (): Promise<VariabilityReport> =>
    apiClient.get<VariabilityReport>('/reports/variability').then(r => r.data),
};
