import type { DashboardSummary } from '../types/dashboard.types';

const MOCK_SUMMARY: DashboardSummary = {
  availableBalance: 42850.0,
  totalBudget: 50000.0,
  monthlyChangePercent: 2.4,
  systemStatus: 'healthy',          // derived: 42850 / 50000 = 85.7% → healthy
  budgetState: 'EJERCICIO',
  deficitAlerts: [],
  expenseCards: [
    { id: '1', label: 'Suscripciones Digitales', amount: 340.0,  icon: 'subscriptions' },
    { id: '2', label: 'Gastos Variables',         amount: 1250.0, icon: 'shopping_cart' },
  ],
};

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    // TODO: return apiClient.get<DashboardSummary>('/dashboard/summary').then(r => r.data);
    return Promise.resolve(MOCK_SUMMARY);
  },
};
