import type { FundsConfig, FundsDistribution, BudgetState, BudgetCategory } from '../types/funds.types';

const MOCK_CONFIG: FundsConfig = {
  monthlyBudget:       5000,
  savingsAmount:       1000,
  servicesAmount:      500,
  subscriptionsAmount: 250,  // auto-calculated from subscriptions in real backend
  leisureAmount:       300,
};

/**
 * Mirrors the priority order from presupuesto.py:
 * 1. Ahorro → 2. Servicios → 3. Suscripciones → 4. Ocio
 */
function computeDistribution(config: FundsConfig): FundsDistribution {
  const { monthlyBudget: pmt, savingsAmount, servicesAmount, subscriptionsAmount, leisureAmount } = config;

  let remaining = pmt;
  let deficitCategory: string | null = null;
  let budgetState: BudgetState = 'EJERCICIO';

  const categories: BudgetCategory[] = [
    { key: 'savings',       label: 'Ahorro / Metas',     budgeted: savingsAmount,       spent: 0, priority: 1 },
    { key: 'services',      label: 'Servicios / Hogar',  budgeted: servicesAmount,      spent: 0, priority: 2 },
    { key: 'subscriptions', label: 'Suscripciones',      budgeted: subscriptionsAmount, spent: 0, priority: 3 },
    { key: 'leisure',       label: 'Ocio / Consumo',     budgeted: leisureAmount,       spent: 0, priority: 4 },
  ];

  for (const cat of categories) {
    if (remaining < cat.budgeted) {
      budgetState = 'EJERCICIO_DEFICIT';
      deficitCategory = cat.label;
      break;
    }
    remaining -= cat.budgeted;
  }

  const savingsPercent   = pmt > 0 ? (savingsAmount / pmt) * 100 : 0;
  const availableAmount  = Math.max(0, pmt - savingsAmount);
  const availablePercent = pmt > 0 ? (availableAmount / pmt) * 100 : 0;

  return {
    savingsPercent,
    availablePercent,
    savingsAmount,
    availableAmount,
    hasDeficit:      budgetState === 'EJERCICIO_DEFICIT',
    budgetState,
    deficitCategory,
    categories,
  };
}

export const fundsApi = {
  getConfig: async (): Promise<FundsConfig> => {
    // TODO: return apiClient.get<FundsConfig>('/funds/config').then(r => r.data);
    return Promise.resolve(MOCK_CONFIG);
  },
  saveConfig: async (config: FundsConfig): Promise<FundsConfig> => {
    // TODO: return apiClient.put<FundsConfig>('/funds/config', config).then(r => r.data);
    return Promise.resolve(config);
  },
  computeDistribution,
};
