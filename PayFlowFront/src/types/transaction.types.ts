export type TransactionCategory = 'hogar' | 'ocio';

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  description?: string;
}

export interface CreateTransactionDto {
  amount: number;
  category: TransactionCategory;
  date: string;
  description?: string;
}
