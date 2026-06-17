import { useEffect, useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { useDashboardStore } from '@/store/dashboard.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AddSubscriptionDialog } from './components/AddSubscriptionDialog';
import type { SubscriptionStatus, CreateSubscriptionDto } from '@/types/subscription.types';

const statusLabel: Record<SubscriptionStatus, string> = {
  paid:      'Pagada',
  pending:   'Pendiente',
  overdue:   'Vencida',
  suspended: 'Suspendida',
};

const ALL_FILTERS: { value: SubscriptionStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todas' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'paid',      label: 'Pagadas' },
  { value: 'overdue',   label: 'Vencidas' },
  { value: 'suspended', label: 'Suspendidas' },
];

export function SubscriptionsPage() {
  const {
    isLoading, fetchAll,
    statusFilter, setStatusFilter,
    filteredSubscriptions, addSubscription, confirmPayment, subscriptions,
  } = useSubscriptionsStore();

  // Derive metrics from stable subscriptions array — avoids Zustand snapshot infinite loop
  const active  = subscriptions.filter(s => s.status !== 'suspended');
  const pending = subscriptions.filter(s => s.status === 'pending' || s.status === 'overdue');
  const nextSub = [...pending].sort((a, b) =>
    (a.billingDate ?? '').localeCompare(b.billingDate ?? '')
  )[0];
  const m = {
    monthlySpend:   parseFloat(active.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
    activeCount:    active.length,
    nextChargeDate: nextSub?.billingDate
      ? new Date(nextSub.billingDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      : '—',
    nextChargeName: nextSub?.name ?? '—',
  };

  const { summary } = useDashboardStore();
  const [addOpen, setAddOpen]            = useState(false);
  const [confirming, setConfirming]      = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          Cargando...
        </div>
      </div>
    );
  }

  const subs = filteredSubscriptions();

  const handleConfirmPayment = async (id: string) => {
    setConfirming(id);
    const balance = summary?.availableBalance ?? 0;
    await confirmPayment(id, balance);
    setConfirming(null);
    // Toast feedback would go here once backend is connected
  };

  const handleAdd = async (dto: CreateSubscriptionDto) => {
    await addSubscription(dto);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            Gestión de Suscripciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
            Controla tus pagos recurrentes y servicios activos.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Nueva Suscripción
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Gasto Mensual',          value: `$${m.monthlySpend.toFixed(2)}` },
          { label: 'Suscripciones Activas',  value: String(m.activeCount) },
          { label: `Próximo: ${m.nextChargeName}`, value: m.nextChargeDate },
        ].map(({ label, value }) => (
          <Card key={label} className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>
              {label}
            </span>
            <span className="text-xl font-semibold tracking-tight"
              style={{ color: 'var(--color-on-surface)', fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </span>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {ALL_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={statusFilter === value ? {
              background: 'var(--color-primary)',
              color: '#fff',
              borderColor: 'var(--color-primary)',
            } : {
              background: 'white',
              color: 'var(--color-on-surface-variant)',
              borderColor: 'var(--color-outline-variant)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {/* Desktop header */}
        <div
          className="hidden md:grid grid-cols-[3fr_2fr_2fr_1fr_auto] gap-4 px-4 py-3 border-b text-xs font-medium uppercase tracking-widest"
          style={{
            background: 'var(--color-surface-container-lowest)',
            borderColor: 'var(--color-outline-variant)',
            color: 'var(--color-on-surface-variant)',
          }}
        >
          <div>Servicio</div>
          <div>Fecha de Cobro</div>
          <div className="text-right">Monto</div>
          <div className="text-right">Estado</div>
          <div />
        </div>

        {subs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              No hay suscripciones para este filtro.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
            {subs.map((sub) => (
              <div
                key={sub.id}
                className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-[#f2f3ff] transition-colors"
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-base font-bold border"
                    style={{ background: `${sub.iconColor}18`, borderColor: `${sub.iconColor}30`, color: sub.iconColor }}
                  >
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                      {sub.name}
                    </p>
                    <p className="text-xs md:hidden" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {sub.billingDate
                        ? new Date(sub.billingDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                        : '—'}{' '}
                      • ${sub.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Billing date — desktop */}
                <div className="hidden md:flex text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {sub.billingDate
                    ? new Date(sub.billingDate).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })
                    : '—'}
                </div>

                {/* Amount — desktop */}
                <div className="hidden md:flex justify-end text-sm font-mono"
                  style={{ color: 'var(--color-on-surface)', fontFamily: 'Geist Mono, monospace' }}>
                  ${sub.amount.toFixed(2)}
                </div>

                {/* Status badge */}
                <div className="flex justify-end">
                  <Badge variant={sub.status}>{statusLabel[sub.status]}</Badge>
                </div>

                {/* Confirm payment action — only for pending subscriptions */}
                <div className="hidden md:flex justify-end">
                  {sub.status === 'pending' && (
                    <button
                      onClick={() => handleConfirmPayment(sub.id)}
                      disabled={confirming === sub.id}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all hover:bg-[#eaedff]"
                      style={{
                        color: 'var(--color-primary)',
                        borderColor: 'var(--color-primary-fixed-dim)',
                      }}
                      title="Confirmar pago"
                    >
                      <CheckCircle2 size={14} />
                      {confirming === sub.id ? '...' : 'Confirmar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AddSubscriptionDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
