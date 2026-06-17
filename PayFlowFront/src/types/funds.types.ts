/**
 * Budget breakdown matching the 4-priority hierarchy from presupuesto.py:
 * Prioridad 1: Ahorro (savings/goals)
 * Prioridad 2: Servicios (home/utilities)
 * Prioridad 3: Suscripciones (fixed digital)
 * Prioridad 4: Ocio (leisure/consumption)
 */
export interface BudgetCategory {
  key: 'savings' | 'services' | 'subscriptions' | 'leisure';
  label: string;
  budgeted: number;
  spent: number;
  priority: 1 | 2 | 3 | 4;
}

export interface FundsConfig {
  monthlyBudget: number;   // PMT
  savingsAmount: number;   // Ahorro meta
  servicesAmount: number;  // Servicios histórico
  subscriptionsAmount: number; // Suscripciones fijas (auto-calculated from subscriptions)
  leisureAmount: number;   // Ocio histórico
}

/**
 * Budget state maps directly to backend validar_presupuesto() states:
 * EJERCICIO → all priorities covered
 * EJERCICIO_DEFICIT → a priority cannot be funded
 * CONFIGURACION → initial setup mode (no allocations yet)
 */
export type BudgetState = 'CONFIGURACION' | 'EJERCICIO' | 'EJERCICIO_DEFICIT';

export interface FundsDistribution {
  savingsPercent: number;
  availablePercent: number;
  savingsAmount: number;
  availableAmount: number;
  hasDeficit: boolean;
  budgetState: BudgetState;
  deficitCategory: string | null;
  categories: BudgetCategory[];
}
