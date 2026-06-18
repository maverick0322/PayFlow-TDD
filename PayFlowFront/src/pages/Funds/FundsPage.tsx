import { useEffect, useState } from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useFundsStore } from '@/store/funds.store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validate, isNonNegative, maxNumber } from '@/lib/validation';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#3525cd',
  2: '#059669',
  3: '#d97706',
  4: '#7c3aed',
};

const PMT_MAX = 1_000_000;

/** Returns a field-level error string or null for a numeric budget field. */
function validateAmount(label: string, value: number, max = PMT_MAX): string | null {
  return validate(value, isNonNegative(label), maxNumber(label, max));
}

export function FundsPage() {
  const {
    config, isSaving, isLoading,
    fetchConfig, setMonthlyBudget, setSavingsAmount, setCategory, saveConfig, getDistribution,
  } = useFundsStore();

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // Field-level errors — evaluated on every render so they stay in sync with config.
  const pmtError     = config.monthlyBudget === 0
    ? 'El presupuesto mensual debe ser mayor a cero'
    : validateAmount('Presupuesto Mensual', config.monthlyBudget);
  
  const ahorroError  = config.savingsAmount > config.monthlyBudget
    ? 'El monto asignado al ahorro no puede superar tu presupuesto mensual'
    : validateAmount('Ahorro', config.savingsAmount);
  
  const servicioError = validateAmount('Servicios', config.servicesAmount);
  const ocioError     = validateAmount('Ocio', config.leisureAmount);

  const [submitted, setSubmitted] = useState(false);

  const hasFormError = !!(pmtError || ahorroError || servicioError || ocioError);

  const handleSave = async () => {
    setSubmitted(true);
    if (hasFormError) return;
    await saveConfig();
  };

  // Prevent typing infinite numbers / numbers exceeding the maximum allowed limit
  const handlePMTChange = (valStr: string) => {
    if (valStr === '') {
      setMonthlyBudget(0);
      return;
    }
    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) return;
    if (val > PMT_MAX) return; // Prevent typing anything above the technical limit
    
    // Also enforce max 2 decimal places to keep input format clean
    const parts = valStr.split('.');
    if (parts[1] && parts[1].length > 2) return;

    setMonthlyBudget(val);
  };

  const handleCategoryChange = (key: 'savings' | 'servicesAmount' | 'leisureAmount', valStr: string) => {
    if (valStr === '') {
      if (key === 'savings') setSavingsAmount(0);
      else setCategory(key, 0);
      return;
    }
    const val = parseFloat(valStr);
    if (isNaN(val) || val < 0) return;
    if (val > PMT_MAX) return; // Prevent typing anything above the technical limit
    
    const parts = valStr.split('.');
    if (parts[1] && parts[1].length > 2) return;

    if (key === 'savings') setSavingsAmount(val);
    else setCategory(key, val);
  };

  const showError = (err: string | null) => submitted && err;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Cargando...</div>
      </div>
    );
  }

  const dist = getDistribution();
  const totalAllocated = config.savingsAmount + config.servicesAmount + config.subscriptionsAmount + config.leisureAmount;
  const unallocated    = Math.max(0, config.monthlyBudget - totalAllocated);

  return (
    <div className="flex flex-col items-center justify-start">
      <Card className="w-full max-w-2xl p-6 md:p-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            Configuración de Fondos
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            El sistema distribuye tus fondos siguiendo este orden de prioridades: <strong>Ahorro → Servicios → Suscripciones → Ocio</strong>.
            Si el presupuesto mensual no logra cubrir alguna prioridad, entrará en estado de Déficit.
          </p>
        </div>

        {/* Budget state banner */}
        {dist.budgetState === 'EJERCICIO_DEFICIT' ? (
          <div className="flex items-start gap-3 p-4 rounded-lg border"
            style={{ background: 'var(--color-error-container)', borderColor: 'var(--color-error)' }}>
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-error)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-on-error-container)' }}>
                Estado: Presupuesto en Déficit
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-error-container)' }}>
                Tu presupuesto mensual actual no alcanza a cubrir la prioridad "{dist.deficitCategory}". Intenta incrementar el presupuesto o reducir las asignaciones.
              </p>
            </div>
          </div>
        ) : dist.budgetState !== 'CONFIGURACION' ? (
          <div className="flex items-center gap-3 p-4 rounded-lg border"
            style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <CheckCircle2 size={18} style={{ color: '#059669' }} />
            <p className="text-sm font-medium text-emerald-800">
              Estado: Ejercicio — Todas tus prioridades están cubiertas
            </p>
          </div>
        ) : null}

        {/* PMT Input */}
        <div className="flex flex-col gap-3">
          <Label htmlFor="pmt" className="flex items-center gap-2 text-sm font-medium">
            Presupuesto Mensual Total
            <Info size={14} style={{ color: 'var(--color-on-surface-variant)' }} />
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold"
              style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
            <Input
              id="pmt"
              type="number"
              className={`pl-10 text-2xl font-semibold h-14${showError(pmtError) ? ' border-red-500 ring-red-200' : ''}`}
              value={config.monthlyBudget || ''}
              onChange={(e) => handlePMTChange(e.target.value)}
              min={0}
              max={PMT_MAX}
              step={100}
              placeholder="0.00"
              aria-describedby={showError(pmtError) ? 'pmt-error' : undefined}
            />
          </div>
          {showError(pmtError) && (
            <p id="pmt-error" className="text-xs font-medium" style={{ color: 'var(--color-error)' }}>
              {pmtError}
            </p>
          )}
        </div>

        <div className="h-px" style={{ background: 'var(--color-outline-variant)' }} />

        {/* 4-category priority allocation */}
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            Asignación por Prioridad
          </p>

          {dist.categories.map((cat) => {
            const pct       = config.monthlyBudget > 0 ? (cat.budgeted / config.monthlyBudget) * 100 : 0;
            const color     = PRIORITY_COLORS[cat.priority];
            const isDeficit = dist.budgetState === 'EJERCICIO_DEFICIT' && dist.deficitCategory === cat.label;

            // Map category key to its field-level error
            const catErr = cat.key === 'savings'  ? ahorroError
              : cat.key === 'services'             ? servicioError
              : cat.key === 'leisure'              ? ocioError
              : null;

            const inputId = `cat-${cat.key}`;
            const errId   = `cat-${cat.key}-error`;

            return (
              <div key={cat.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: color }}
                    >
                      {cat.priority}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                      {cat.label}
                    </span>
                    {isDeficit && <AlertTriangle size={14} style={{ color: 'var(--color-error)' }} />}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {pct.toFixed(1)}%
                    </span>

                    {cat.key === 'subscriptions' ? (
                      <span
                        className="text-sm font-mono font-semibold w-28 text-right"
                        style={{ color, fontFamily: 'Geist Mono, monospace' }}
                        title="Calculado automáticamente desde tus suscripciones"
                      >
                        ${cat.budgeted.toFixed(2)}
                      </span>
                    ) : (
                      <div className="relative flex flex-col items-end gap-1">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
                            style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
                          <input
                            id={inputId}
                            type="number"
                            value={cat.budgeted || ''}
                            min={0}
                            max={PMT_MAX}
                            step={50}
                            placeholder="0.00"
                            aria-describedby={showError(catErr) ? errId : undefined}
                            onChange={(e) => {
                              const keyMap: Record<string, 'savings' | 'servicesAmount' | 'leisureAmount'> = {
                                savings: 'savings',
                                services: 'servicesAmount',
                                leisure: 'leisureAmount',
                              };
                              const key = keyMap[cat.key];
                              if (key) {
                                handleCategoryChange(key, e.target.value);
                              }
                            }}
                            className="w-28 pl-5 pr-2 py-1 text-sm text-right rounded-lg border font-mono focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
                            style={{
                              background:   'var(--color-surface-container-lowest)',
                              borderColor:  isDeficit || showError(catErr)
                                ? 'var(--color-error)'
                                : 'var(--color-outline-variant)',
                              color:        'var(--color-on-surface)',
                              fontFamily:   'Geist Mono, monospace',
                            }}
                          />
                        </div>
                        {showError(catErr) && (
                          <p id={errId} className="text-xs text-right mt-0.5" style={{ color: 'var(--color-error)' }}>
                            {catErr}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--color-surface-container-high)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, pct)}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}

          {/* Unallocated remainder */}
          <div className="flex justify-between items-center pt-2 border-t"
            style={{ borderColor: 'var(--color-outline-variant)' }}>
            <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Sin asignar</span>
            <span
              className="text-sm font-mono font-semibold"
              style={{
                color: unallocated < 0 ? 'var(--color-error)' : '#059669',
                fontFamily: 'Geist Mono, monospace',
              }}
            >
              ${unallocated.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
