import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CreateTransactionDto, TransactionCategory } from '@/types/transaction.types';
import { transactionsApi } from '@/api/transactions.api';
import { useDashboardStore } from '@/store/dashboard.store';
import {
  validate, validateAll, hasErrors,
  isPositive, maxNumber, maxLength,
} from '@/lib/validation';

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  amount:      string;
  category:    TransactionCategory;
  date:        string;
  description: string;
}

const AMOUNT_MAX = 1_000_000;

export function AddTransactionDialog({ open, onClose }: AddTransactionDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const fetchDashboard = useDashboardStore((s) => s.fetchSummary);

  const initialState: FormState = {
    amount:      '120.00',
    category:    'ocio',
    date:        today,
    description: '',
  };

  const [form, setForm] = useState<FormState>(initialState);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  
  // Backend risk status handling
  const [riskWarning, setRiskWarning] = useState<string | null>(null);
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Clear states when dialog opens
  useEffect(() => {
    if (open) {
      setForm({ ...initialState, date: new Date().toISOString().split('T')[0] });
      setTouched({});
      setFieldErrors({});
      setRiskWarning(null);
      setConfirmRisk(false);
      setServerError(null);
    }
  }, [open]);

  const parsedAmount = parseFloat(form.amount) || 0;

  const runValidation = (current: FormState): Partial<Record<keyof FormState, string>> => {
    const amountVal = parseFloat(current.amount) || 0;
    return validateAll({
      amount: () => validate(amountVal, isPositive('El monto'), maxNumber('El monto', AMOUNT_MAX)),
      date: () => !current.date ? 'La fecha es requerida' : null,
      description: () => validate(current.description, maxLength('La descripción', 200)),
    }) as Partial<Record<keyof FormState, string>>;
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
    
    // If amount or category changes, reset risk confirmation to be safe
    if (field === 'amount' || field === 'category') {
      setRiskWarning(null);
      setConfirmRisk(false);
    }
  };

  const handleSubmit = async () => {
    setTouched({ amount: true, date: true, description: true });
    const errors = runValidation(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    setServerError(null);

    try {
      const dto: CreateTransactionDto & { confirmaRiesgo?: boolean } = {
        amount: parsedAmount,
        category: form.category,
        date: form.date,
        description: form.description.trim() || undefined,
        confirmaRiesgo: confirmRisk,
      };

      await transactionsApi.create(dto);
      
      // Refresh dashboard info
      await fetchDashboard();
      
      // Close dialog
      handleClose();
    } catch (err) {
      const message = (err as Error).message ?? 'Error al registrar el gasto';
      
      // Check if it is a risk warning from the backend
      if (message.toLowerCase().includes('riesgo') || message.toLowerCase().includes('advertencia')) {
        setRiskWarning(message);
      } else {
        setServerError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(initialState);
    setTouched({});
    setFieldErrors({});
    setRiskWarning(null);
    setConfirmRisk(false);
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
          <DialogTitle>Registrar Gasto Variable</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 flex flex-col gap-5">
          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-amount">
              Monto <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono"
                style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
              <Input
                id="tx-amount"
                type="number"
                className={`pl-7 font-mono ${inputClass('amount')}`}
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                onBlur={() => handleBlur('amount')}
                min="0.01"
                step="0.01"
              />
            </div>
            <FieldError field="amount" />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-category">Categoría</Label>
            <div className="relative">
              <select
                id="tx-category"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value as TransactionCategory)}
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
            <Label htmlFor="tx-date">
              Fecha <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tx-date"
              type="date"
              className={inputClass('date')}
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              onBlur={() => handleBlur('date')}
            />
            <FieldError field="date" />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-desc">
              Descripción <span className="text-xs font-normal" style={{ color: 'var(--color-on-surface-variant)' }}>(opcional)</span>
            </Label>
            <Input
              id="tx-desc"
              type="text"
              placeholder="Ej. Súper semanal, café, etc."
              className={inputClass('description')}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              maxLength={200}
            />
            <FieldError field="description" />
          </div>

          {/* Risk warning from backend */}
          {riskWarning && (
            <div className="flex flex-col gap-3 p-4 rounded-lg border bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Riesgo de Flujo de Caja</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {riskWarning}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmRisk}
                  onChange={(e) => setConfirmRisk(e.target.checked)}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-amber-800">
                  Entiendo el riesgo y deseo proceder de todos modos
                </span>
              </label>
            </div>
          )}

          {/* General Server error */}
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
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || (!!riskWarning && !confirmRisk)}
            size="md"
          >
            {saving ? 'Guardando...' : 'Proceder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
