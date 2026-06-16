/** Maps to backend budget states: EJERCICIO → healthy/at_risk, EJERCICIO_DEFICIT → critical */
export type SystemStatus = 'healthy' | 'at_risk' | 'critical';

export interface DashboardSummary {
  availableBalance: number;
  totalBudget: number;       // PMT — used to derive at_risk threshold (< 10%)
  monthlyChangePercent: number;
  systemStatus: SystemStatus;
  budgetState: 'EJERCICIO' | 'EJERCICIO_DEFICIT';
  deficitAlerts: string[];   // maps to backend alertas_lista
  expenseCards: ExpenseCard[];
}

export interface ExpenseCard {
  id: string;
  label: string;
  amount: number;
  icon: string;
}
