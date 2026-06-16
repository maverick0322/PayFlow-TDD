import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreateTransactionDto, TransactionCategory } from '@/types/transaction.types';
import { transactionsApi } from '@/api/transactions.api';
import { useSubscriptionsStore } from '@/store/subscriptions.store';

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionDialog({ open, onClose }: AddTransactionDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount]     = useState('120.00');
  const [category, setCategory] = useState<TransactionCategory>('ocio');
  const [date, setDate]         = useState(today);
  const [saving, setSaving]     = useState(false);

  // Risk check: compare against pending subscription costs (procesador_pagos.py R2 logic)
  // Read raw subscriptions array (stable reference) — compute pending total inline
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const totalPendingAmount = subscriptions
    .filter((s) => s.status === 'pending' || s.status === 'overdue')
    .reduce((sum, s) => sum + s.amount, 0);

  const parsedAmount = parseFloat(amount) || 0;

  // Warn when a leisure spend would compromise upcoming subscription payments
  const showRisk =
    category === 'ocio' &&
    parsedAmount > 0 &&
    totalPendingAmount > 0 &&
    parsedAmount > totalPendingAmount * 0.5;

  const handleSubmit = async () => {
    if (parsedAmount <= 0) return; // boundary: non-negative validation from presupuesto.py
    setSaving(true);
    const dto: CreateTransactionDto = { amount: parsedAmount, category, date };
    await transactionsApi.create(dto);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Registrar Gasto Variable</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 flex flex-col gap-5">
          {/* Amount — validates non-negative (presupuesto.py rule) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-amount">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono"
                style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
              <Input
                id="tx-amount"
                type="number"
                className="pl-7 font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            {parsedAmount <= 0 && amount !== '' && (
              <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                El monto debe ser mayor a cero.
              </p>
            )}
          </div>

          {/* Category — Servicios/Hogar or Ocio/Consumo */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-category">Categoría</Label>
            <div className="relative">
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full h-10 rounded-lg border px-3 pr-10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3525cd] focus:border-transparent transition-all"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  borderColor: 'var(--color-outline-variant)',
                  color: 'var(--color-on-surface)',
                }}
              >
                <option value="hogar">Servicios / Hogar</option>
                <option value="ocio">Ocio / Consumo</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
                style={{ color: 'var(--color-on-surface-variant)' }}>▾</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-date">Fecha</Label>
            <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Risk warning — matches procesador_pagos.py risk evaluation logic */}
          {showRisk && (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-amber-50 border-amber-200">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Riesgo de Flujo de Caja</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Este gasto de ocio (${parsedAmount.toFixed(2)}) podría comprometer el pago
                  de tus suscripciones pendientes (${ totalPendingAmount.toFixed(2)}).
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={onClose} size="md">Cancelar</Button>
          <Button
            variant="outline"
            onClick={handleSubmit}
            disabled={saving || parsedAmount <= 0}
            size="md"
          >
            {saving ? 'Guardando...' : 'Proceder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
