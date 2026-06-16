import type { VariabilityReport } from '../types/reports.types';

const MOCK_REPORT: VariabilityReport = {
  period: 'Noviembre 2023',
  totalDeviation: -320.5,
  deviationDirection: 'below',
  categories: [
    { name: 'Suscripciones', budgeted: 400, actual: 245.9, deviation: -154.1 },
    { name: 'Hogar/Servicios', budgeted: 800, actual: 750.0, deviation: -50.0 },
    { name: 'Ocio/Consumo', budgeted: 500, actual: 620.5, deviation: 120.5 },
    { name: 'Ahorro', budgeted: 1000, actual: 1000.0, deviation: 0 },
    { name: 'Transporte', budgeted: 300, actual: 236.1, deviation: -63.9 },
    { name: 'Alimentación', budgeted: 600, actual: 527.0, deviation: -73.0 },
  ],
};

export const reportsApi = {
  getVariabilityReport: async (): Promise<VariabilityReport> => {
    // TODO: return apiClient.get<VariabilityReport>('/reports/variability').then(r => r.data);
    return Promise.resolve(MOCK_REPORT);
  },
};
