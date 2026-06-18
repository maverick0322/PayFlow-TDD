import { create } from 'zustand';
import type { Subscription, SubscriptionStatus, CreateSubscriptionDto } from '../types/subscription.types';
import { subscriptionsApi } from '../api/subscriptions.api';

interface SubscriptionsState {
  subscriptions: Subscription[];
  statusFilter:  SubscriptionStatus | 'all';
  isLoading:     boolean;
  error:         string | null;

  // Actions
  fetchAll:         () => Promise<void>;
  addSubscription:  (dto: CreateSubscriptionDto) => Promise<void>;
  confirmPayment:   (id: string, currentBalance: number) => Promise<string>;
  setStatusFilter:  (filter: SubscriptionStatus | 'all') => void;

  // Derived
  filteredSubscriptions: () => Subscription[];
  metrics:               () => ReturnType<typeof import('../api/subscriptions.api').subscriptionsApi.getMetrics> extends Promise<infer T> ? T : never;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set, get) => ({
  subscriptions: [],
  statusFilter:  'all',
  isLoading:     false,
  error:         null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const subscriptions = await subscriptionsApi.getAll();
      set({ subscriptions, isLoading: false });
    } catch {
      set({ error: 'Error al cargar suscripciones', isLoading: false });
    }
  },

  addSubscription: async (dto) => {
    const newSub = await subscriptionsApi.create(dto);
    set((state) => ({ subscriptions: [...state.subscriptions, newSub] }));
  },

  confirmPayment: async (id, currentBalance) => {
    const sub = get().subscriptions.find((s) => s.id === id);
    if (!sub) return 'PAGO_RECHAZADO';

    const { result, newStatus } = await subscriptionsApi.confirmPayment(id, currentBalance, sub.amount);
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, status: newStatus } : s
      ),
    }));
    return result;
  },

  setStatusFilter: (filter) => set({ statusFilter: filter }),

  filteredSubscriptions: () => {
    const { subscriptions, statusFilter } = get();
    if (statusFilter === 'all') return subscriptions;
    return subscriptions.filter((s) => s.status === statusFilter);
  },

  // Inline metrics computation (keeps store self-contained)
  metrics: () => {
    const subs   = get().subscriptions;
    const active  = subs.filter(s => s.status !== 'suspended');
    const pending = subs.filter(s => s.status === 'pending' || s.status === 'overdue');
    const monthly = active.reduce((sum, s) => sum + s.amount, 0);
    const nextSub = [...pending].sort((a, b) =>
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
  },
}));
