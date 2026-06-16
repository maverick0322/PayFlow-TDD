export type SubscriptionStatus = 'paid' | 'pending' | 'overdue' | 'suspended';
export type BillingCycle = 'monthly' | 'annual' | 'quarterly';

export interface Subscription {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  billingDate: string | null;   // ISO date string
  amount: number;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  category: 'digital' | 'services';
}

export interface CreateSubscriptionDto {
  name: string;
  amount: number;
  billingDate: string;
  billingCycle: BillingCycle;
  category: 'digital' | 'services';
}

export interface SubscriptionMetrics {
  monthlySpend: number;
  activeCount: number;
  nextChargeDate: string;
  nextChargeName: string;
  totalPendingAmount: number;   // sum of all pending, used for ocio risk check
}
