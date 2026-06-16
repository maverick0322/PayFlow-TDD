export interface VariabilityReport {
  period: string;
  totalDeviation: number;
  deviationDirection: 'below' | 'above';
  categories: ReportCategory[];
}

export interface ReportCategory {
  name: string;
  budgeted: number;
  actual: number;
  deviation: number;
}
