import { apiClient } from './client';
import type {
  Subscription,
  SubscriptionMetrics,
  CreateSubscriptionDto,
} from '../types/subscription.types';

function computeMetrics(subs: Subscription[]): SubscriptionMetrics {
  const active  = subs.filter(s => s.status !== 'suspended');
  const pending = subs.filter(s => s.status === 'pending' || s.status === 'overdue');
  const monthly = active.reduce((sum, s) => sum + s.amount, 0);
  const nextSub = pending.sort((a, b) =>
    (a.billingDate ?? '').localeCompare(b.billingDate ?? '')
  )[0];

  return {
    monthlySpend:       parseFloat(monthly.toFixed(2)),
    activeCount:        active.length,
    nextChargeDate:     nextSub?.billingDate
      ? new Date(nextSub.billingDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      : '—',
    nextChargeName:     nextSub?.name ?? '—',
    totalPendingAmount: parseFloat(pending.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
  };
}

export const subscriptionsApi = {
  getAll: (): Promise<Subscription[]> =>
    apiClient.get<Subscription[]>('/subscriptions').then(r => r.data),

  /** Metrics are derived client-side to avoid a separate endpoint. */
  getMetrics: async (subs?: Subscription[]): Promise<SubscriptionMetrics> => {
    const list = subs ?? await subscriptionsApi.getAll();
    return computeMetrics(list);
  },

  create: (dto: CreateSubscriptionDto): Promise<Subscription> =>
    apiClient.post<Subscription>('/subscriptions', dto).then(r => r.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/subscriptions/${id}`).then(() => undefined),

  confirmPayment: (
    id: string,
    currentBalance: number,
    _amount: number
  ): Promise<{ result: string; newStatus: 'paid' | 'overdue'; newBalance: number }> =>
    apiClient
      .post(`/subscriptions/${id}/confirm`, { currentBalance })
      .then(r => r.data),
};
