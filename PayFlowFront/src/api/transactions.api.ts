import type { CreateTransactionDto, Transaction } from '../types/transaction.types';

export const transactionsApi = {
  create: async (dto: CreateTransactionDto): Promise<Transaction> => {
    // TODO: return apiClient.post<Transaction>('/transactions', dto).then(r => r.data);
    return Promise.resolve({ id: crypto.randomUUID(), ...dto });
  },
};
