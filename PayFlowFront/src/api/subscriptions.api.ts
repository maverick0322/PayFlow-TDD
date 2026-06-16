import type {
  Subscription,
  SubscriptionMetrics,
  CreateSubscriptionDto,
} from '../types/subscription.types';

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1', name: 'Netflix',       icon: 'movie',         iconColor: '#E50914',
    billingDate: '2023-11-15', amount: 15.99,  status: 'paid',      billingCycle: 'monthly',  category: 'digital',
  },
  {
    id: '2', name: 'Spotify',       icon: 'music_note',    iconColor: '#1DB954',
    billingDate: '2023-11-20', amount: 9.99,   status: 'pending',   billingCycle: 'monthly',  category: 'digital',
  },
  {
    id: '3', name: 'AWS Cloud',     icon: 'cloud',         iconColor: '#FF9900',
    billingDate: '2023-11-05', amount: 145.50, status: 'overdue',   billingCycle: 'monthly',  category: 'services',
  },
  {
    id: '4', name: 'Gimnasio Local',icon: 'fitness_center',iconColor: '#777587',
    billingDate: null,         amount: 45.0,   status: 'suspended', billingCycle: 'monthly',  category: 'services',
  },
  {
    id: '5', name: 'New York Times',icon: 'article',       iconColor: '#131b2e',
    billingDate: '2023-11-01', amount: 4.0,    status: 'paid',      billingCycle: 'monthly',  category: 'digital',
  },
  {
    id: '6', name: 'Adobe Creative',icon: 'palette',       iconColor: '#FF0000',
    billingDate: '2023-11-25', amount: 19.99,  status: 'pending',   billingCycle: 'monthly',  category: 'digital',
  },
  {
    id: '7', name: 'GitHub Pro',    icon: 'code',          iconColor: '#6e5494',
    billingDate: '2023-11-10', amount: 4.0,    status: 'paid',      billingCycle: 'monthly',  category: 'digital',
  },
  {
    id: '8', name: 'Google Workspace',icon:'business',     iconColor: '#4285F4',
    billingDate: '2023-11-28', amount: 12.0,   status: 'pending',   billingCycle: 'monthly',  category: 'services',
  },
];

function computeMetrics(subs: Subscription[]): SubscriptionMetrics {
  const active   = subs.filter(s => s.status !== 'suspended');
  const pending  = subs.filter(s => s.status === 'pending' || s.status === 'overdue');
  const monthly  = active.reduce((sum, s) => sum + s.amount, 0);
  const nextSub  = pending.sort((a, b) =>
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
  getAll: async (): Promise<Subscription[]> => {
    // TODO: return apiClient.get<Subscription[]>('/subscriptions').then(r => r.data);
    return Promise.resolve(MOCK_SUBSCRIPTIONS);
  },

  getMetrics: async (subs?: Subscription[]): Promise<SubscriptionMetrics> => {
    // TODO: return apiClient.get<SubscriptionMetrics>('/subscriptions/metrics').then(r => r.data);
    return Promise.resolve(computeMetrics(subs ?? MOCK_SUBSCRIPTIONS));
  },

  create: async (dto: CreateSubscriptionDto): Promise<Subscription> => {
    // TODO: return apiClient.post<Subscription>('/subscriptions', dto).then(r => r.data);
    const newSub: Subscription = {
      id:           crypto.randomUUID(),
      name:         dto.name,
      icon:         'subscriptions',
      iconColor:    '#3525cd',
      billingDate:  dto.billingDate,
      amount:       dto.amount,
      status:       'pending',
      billingCycle: dto.billingCycle,
      category:     dto.category,
    };
    return Promise.resolve(newSub);
  },

  /** Confirm payment → transitions pending → paid or overdue if rejected */
  confirmPayment: async (
    _id: string,
    currentBalance: number,
    amount: number
  ): Promise<{ result: 'EXITOSO' | 'RECHAZADO'; newStatus: 'paid' | 'overdue' }> => {
    // TODO: return apiClient.post(`/subscriptions/${id}/confirm`).then(r => r.data);
    const canPay = currentBalance >= amount;
    return Promise.resolve({
      result:    canPay ? 'EXITOSO' : 'RECHAZADO',
      newStatus: canPay ? 'paid'   : 'overdue',
    });
  },
};
