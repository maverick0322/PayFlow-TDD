import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreateSubscriptionDto, BillingCycle } from '@/types/subscription.types';

interface AddSubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (dto: CreateSubscriptionDto) => Promise<void>;
}

const cycleLabels: Record<BillingCycle, string> = {
  monthly:   'Mensual',
  quarterly: 'Trimestral',
  annual:    'Anual',
};

export function AddSubscriptionDialog({ open, onClose, onAdd }: AddSubscriptionDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const [name, setName]           = useState('');
  const [amount, setAmount]       = useState('');
  const [billingDate, setDate]    = useState(today);
  const [billingCycle, setCycle]  = useState<BillingCycle>('monthly');
  const [category, setCategory]   = useState<'digital' | 'services'>('digital');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const parsedAmount = parseFloat(amount) || 0;

  const validate = (): string | null => {
    if (!name.trim())      return 'El nombre es requerido.';
    if (parsedAmount <= 0) return 'El monto debe ser mayor a cero.';
    if (!billingDate)      return 'La fecha de cobro es requerida.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    await onAdd({ name: name.trim(), amount: parsedAmount, billingDate, billingCycle, category });
    setSaving(false);
    // reset
    setName(''); setAmount(''); setDate(today); setCycle('monthly'); setCategory('digital');
    onClose();
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Nueva Suscripción</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-name">Nombre del Servicio</Label>
            <Input
              id="sub-name"
              placeholder="Netflix, Spotify, AWS..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-amount">Monto por Cobro</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono"
                style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
              <Input
                id="sub-amount"
                type="number"
                className="pl-7 font-mono"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          {/* Billing date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-date">Fecha de Cobro</Label>
            <Input
              id="sub-date"
              type="date"
              value={billingDate}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Cycle + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-cycle">Frecuencia</Label>
              <div className="relative">
                <select
                  id="sub-cycle"
                  value={billingCycle}
                  onChange={(e) => setCycle(e.target.value as BillingCycle)}
                  className="w-full h-10 rounded-lg border px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
                  style={{
                    background: 'var(--color-surface-container-lowest)',
                    borderColor: 'var(--color-outline-variant)',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  {(Object.keys(cycleLabels) as BillingCycle[]).map((k) => (
                    <option key={k} value={k}>{cycleLabels[k]}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
                  style={{ color: 'var(--color-on-surface-variant)' }}>▾</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-cat">Categoría</Label>
              <div className="relative">
                <select
                  id="sub-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'digital' | 'services')}
                  className="w-full h-10 rounded-lg border px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
                  style={{
                    background: 'var(--color-surface-container-lowest)',
                    borderColor: 'var(--color-outline-variant)',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  <option value="digital">Digital</option>
                  <option value="services">Servicios</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
                  style={{ color: 'var(--color-on-surface-variant)' }}>▾</span>
              </div>
            </div>
          </div>

          {/* Validation error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-red-50 border-red-200">
              <AlertTriangle size={14} className="text-red-600 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} size="md">Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving} size="md">
            {saving ? 'Guardando...' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
