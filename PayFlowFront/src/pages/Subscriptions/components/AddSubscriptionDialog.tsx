import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle,
} from '@/components/ui/dialog';
import { Label }  from '@/components/ui/label';
import { Input }  from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreateSubscriptionDto, BillingCycle } from '@/types/subscription.types';
import {
  validate, validateAll, hasErrors,
  required, minLength, maxLength, isPositive, maxNumber,
} from '@/lib/validation';

interface AddSubscriptionDialogProps {
  open:    boolean;
  onClose: () => void;
  onAdd:   (dto: CreateSubscriptionDto) => Promise<void>;
}

const cycleLabels: Record<BillingCycle, string> = {
  monthly:   'Mensual',
  quarterly: 'Trimestral',
  annual:    'Anual',
};

interface FormState {
  name:        string;
  amount:      string;
  billingDate: string;
  billingCycle: BillingCycle;
  category:   'digital' | 'services';
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const AMOUNT_MAX = 1_000_000;

export function AddSubscriptionDialog({ open, onClose, onAdd }: AddSubscriptionDialogProps) {
  const today = new Date().toISOString().split('T')[0];

  const initialState: FormState = {
    name:        '',
    amount:      '',
    billingDate: today,
    billingCycle: 'monthly',
    category:   'digital',
  };

  const [form,        setForm]        = useState<FormState>(initialState);
  const [touched,     setTouched]     = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  const parsedAmount = parseFloat(form.amount) || 0;

  const runValidation = (current: FormState): FieldErrors => {
    const amount = parseFloat(current.amount) || 0;
    return validateAll({
      name:   () => validate(current.name,
        required('El nombre'), minLength('El nombre', 2), maxLength('El nombre', 80)),
      amount: () => validate(amount,
        isPositive('El monto'), maxNumber('El monto', AMOUNT_MAX)),
      billingDate: () =>
        !current.billingDate ? 'La fecha de cobro es requerida' : null,
    }) as FieldErrors;
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setFieldErrors(runValidation(form));
  };

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    if (field === 'amount' && typeof value === 'string' && value !== '') {
      const val = parseFloat(value);
      if (isNaN(val) || val < 0 || val > AMOUNT_MAX) return;
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) return;
    }
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setFieldErrors(runValidation(next));
  };

  const handleSubmit = async () => {
    // Touch all validated fields
    setTouched({ name: true, amount: true, billingDate: true });
    const errors = runValidation(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    setServerError(null);
    try {
      await onAdd({
        name:         form.name.trim(),
        amount:       parsedAmount,
        billingDate:  form.billingDate,
        billingCycle: form.billingCycle,
        category:     form.category,
      });
      // Reset and close
      setForm(initialState);
      setTouched({});
      setFieldErrors({});
      onClose();
    } catch (err) {
      setServerError((err as Error).message ?? 'Error al guardar la suscripción');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(initialState);
    setTouched({});
    setFieldErrors({});
    setServerError(null);
    onClose();
  };

  const inputClass = (field: keyof FormState) =>
    touched[field] && fieldErrors[field] ? 'border-red-400 focus:ring-red-200' : '';

  const FieldError = ({ field }: { field: keyof FormState }) =>
    touched[field] && fieldErrors[field]
      ? <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{fieldErrors[field]}</p>
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Nueva Suscripción</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-name">
              Nombre del Servicio <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sub-name"
              placeholder="Netflix, Spotify, AWS..."
              className={inputClass('name')}
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              maxLength={80}
            />
            <FieldError field="name" />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-amount">
              Monto por Cobro <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono"
                style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
              <Input
                id="sub-amount"
                type="number"
                className={`pl-7 font-mono ${inputClass('amount')}`}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                onBlur={() => handleBlur('amount')}
                min="0.01"
                max={AMOUNT_MAX}
                step="0.01"
              />
            </div>
            <FieldError field="amount" />
          </div>

          {/* Billing date */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-date">
              Fecha de Cobro <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sub-date"
              type="date"
              className={inputClass('billingDate')}
              value={form.billingDate}
              onChange={(e) => handleChange('billingDate', e.target.value)}
              onBlur={() => handleBlur('billingDate')}
            />
            <FieldError field="billingDate" />
          </div>

          {/* Cycle + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-cycle">Frecuencia</Label>
              <div className="relative">
                <select
                  id="sub-cycle"
                  value={form.billingCycle}
                  onChange={(e) => handleChange('billingCycle', e.target.value as BillingCycle)}
                  className="w-full h-10 rounded-lg border px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
                  style={{
                    background:  'var(--color-surface-container-lowest)',
                    borderColor: 'var(--color-outline-variant)',
                    color:       'var(--color-on-surface)',
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
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value as 'digital' | 'services')}
                  className="w-full h-10 rounded-lg border px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
                  style={{
                    background:  'var(--color-surface-container-lowest)',
                    borderColor: 'var(--color-outline-variant)',
                    color:       'var(--color-on-surface)',
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

          {/* Server error */}
          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-lg border"
              style={{ background: 'var(--color-error-container)', borderColor: 'var(--color-error)' }}>
              <AlertTriangle size={14} style={{ color: 'var(--color-error)' }} className="shrink-0" />
              <p className="text-xs" style={{ color: 'var(--color-on-error-container)' }}>{serverError}</p>
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
