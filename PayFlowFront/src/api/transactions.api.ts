import { apiClient } from './client';
import type { CreateTransactionDto, Transaction } from '../types/transaction.types';

export interface TransactionResult extends Transaction {
  ok: boolean;
  mensaje: string;
  newBalance: number;
}

export const transactionsApi = {
  /**
   * Creates a transaction. May throw with a risk-warning message (domain error).
   * If the error message contains "advertencia de riesgo", the caller should
   * prompt the user to confirm and retry with confirmaRiesgo: true.
   */
  create: (dto: CreateTransactionDto & { confirmaRiesgo?: boolean }): Promise<TransactionResult> =>
    apiClient.post<TransactionResult>('/transactions', dto).then(r => r.data),
};
