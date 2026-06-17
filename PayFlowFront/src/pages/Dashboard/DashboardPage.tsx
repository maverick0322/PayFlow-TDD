import { useEffect } from 'react';
import { TrendingUp, TrendingDown, CreditCard, ShoppingCart, AlertTriangle, Shield } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard.store';
import { Card, CardContent } from '@/components/ui/card';
import type { SystemStatus } from '@/types/dashboard.types';

const iconMap: Record<string, React.ElementType> = {
  subscriptions: CreditCard,
  shopping_cart: ShoppingCart,
};

const statusConfig: Record<SystemStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  healthy:  { label: 'Saludable',  color: '#059669', bg: '#ecfdf5', icon: Shield },
  at_risk:  { label: 'En Riesgo',  color: '#d97706', bg: '#fffbeb', icon: AlertTriangle },
  critical: { label: 'Crítico',    color: '#dc2626', bg: '#fef2f2', icon: AlertTriangle },
};

export function DashboardPage() {
  const { summary, isLoading, fetchSummary } = useDashboardStore();

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          Cargando...
        </div>
      </div>
    );
  }

  const status = statusConfig[summary.systemStatus];
  const StatusIcon = status.icon;
  const balancePct = summary.totalBudget > 0
    ? (summary.availableBalance / summary.totalBudget) * 100
    : 100;

  return (
    <div className="flex flex-col gap-8">
      {/* System status banner */}
      <section
        className="flex items-center justify-between rounded-lg p-4 border"
        style={{ background: status.bg, borderColor: `${status.color}40` }}
      >
        <div className="flex items-center gap-3">
          <StatusIcon size={18} style={{ color: status.color }} />
          <div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
              Estado del Sistema
            </span>
            {summary.deficitAlerts.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: status.color }}>
                {summary.deficitAlerts[0]}
              </p>
            )}
          </div>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full border"
          style={{ color: status.color, background: status.bg, borderColor: `${status.color}40` }}
        >
          {status.label}
        </span>
      </section>

      {/* Central balance */}
      <section className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
          Saldo Disponible
        </p>
        <div
          className="text-5xl md:text-6xl font-semibold tracking-tight"
          style={{ color: 'var(--color-on-surface)', fontVariantNumeric: 'tabular-nums', fontFamily: 'Geist Mono, monospace' }}
        >
          ${summary.availableBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </div>

        {/* Balance health bar */}
        <div className="w-48 mt-4">
          <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--color-surface-container-high)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, balancePct)}%`,
                background: summary.systemStatus === 'healthy' ? '#059669'
                          : summary.systemStatus === 'at_risk' ? '#d97706' : '#dc2626',
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
            {balancePct.toFixed(1)}% del presupuesto mensual
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-surface-tint)' }}
        >
          {summary.monthlyChangePercent >= 0
            ? <TrendingUp size={14} />
            : <TrendingDown size={14} />}
          {summary.monthlyChangePercent >= 0 ? '+' : ''}{summary.monthlyChangePercent}% este mes
        </div>
      </section>

      {/* Expense cards grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {summary.expenseCards.map((card) => {
          const Icon = iconMap[card.icon] ?? CreditCard;
          return (
            <Card
              key={card.id}
              className="p-5 cursor-pointer hover:border-[#777587] transition-colors"
              style={{ background: 'var(--color-surface-container-lowest)' }}
            >
              <CardContent className="p-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {card.label}
                </p>
                <span
                  className="text-2xl font-semibold tracking-tight"
                  style={{ color: 'var(--color-on-surface)', fontFamily: 'Geist Mono, monospace' }}
                >
                  ${card.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Budget state notice */}
      {summary.budgetState === 'EJERCICIO_DEFICIT' && (
        <section
          className="flex items-start gap-3 p-4 rounded-lg border"
          style={{ background: 'var(--color-error-container)', borderColor: 'var(--color-error)' }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--color-error)', marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-on-error-container)' }}>
              Presupuesto en Déficit
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-error-container)' }}>
              Tu presupuesto actual no cubre todas las prioridades del mes.
              Configura tus fondos para resolverlo.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
