import { useEffect } from 'react';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useFundsStore } from '@/store/funds.store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#3525cd',  // Ahorro — primary
  2: '#059669',  // Servicios — emerald
  3: '#d97706',  // Suscripciones — amber
  4: '#7c3aed',  // Ocio — violet
};

export function FundsPage() {
  const {
    config, isSaving, isLoading,
    fetchConfig, setMonthlyBudget, setSavingsAmount, setCategory, saveConfig, getDistribution,
  } = useFundsStore();

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

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
            El sistema prioriza: <strong>Ahorro → Servicios → Suscripciones → Ocio</strong>.
            Si el PMT no cubre una prioridad, entra en estado de Déficit.
          </p>
        </div>

        {/* Budget state banner */}
        {dist.budgetState === 'EJERCICIO_DEFICIT' ? (
          <div className="flex items-start gap-3 p-4 rounded-lg border"
            style={{ background: 'var(--color-error-container)', borderColor: 'var(--color-error)' }}>
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--color-error)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-on-error-container)' }}>
                Estado: EJERCICIO_DEFICIT
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-error-container)' }}>
                El PMT no cubre "{dist.deficitCategory}". Aumenta el presupuesto o reduce las asignaciones.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg border"
            style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <CheckCircle2 size={18} style={{ color: '#059669' }} />
            <p className="text-sm font-medium text-emerald-800">
              Estado: EJERCICIO — todas las prioridades cubiertas
            </p>
          </div>
        )}

        {/* PMT Input */}
        <div className="flex flex-col gap-3">
          <Label htmlFor="pmt" className="flex items-center gap-2 text-sm font-medium">
            Presupuesto Mensual Total (PMT)
            <Info size={14} style={{ color: 'var(--color-on-surface-variant)' }} />
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold"
              style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
            <Input
              id="pmt"
              type="number"
              className="pl-10 text-2xl font-semibold h-14"
              value={config.monthlyBudget}
              onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
              min={0}
              step={100}
            />
          </div>
        </div>

        <div className="h-px" style={{ background: 'var(--color-outline-variant)' }} />

        {/* 4-category priority allocation */}
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            Asignación por Prioridad
          </p>

          {dist.categories.map((cat) => {
            const pct    = config.monthlyBudget > 0 ? (cat.budgeted / config.monthlyBudget) * 100 : 0;
            const color  = PRIORITY_COLORS[cat.priority];
            const isDeficit = dist.budgetState === 'EJERCICIO_DEFICIT' && dist.deficitCategory === cat.label;

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
                    {isDeficit && (
                      <AlertTriangle size={14} style={{ color: 'var(--color-error)' }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {pct.toFixed(1)}%
                    </span>
                    {/* Editable amount for savings; read-only for subscriptions (auto-calculated) */}
                    {cat.key === 'subscriptions' ? (
                      <span
                        className="text-sm font-mono font-semibold w-28 text-right"
                        style={{ color, fontFamily: 'Geist Mono, monospace' }}
                        title="Calculado automáticamente desde tus suscripciones"
                      >
                        ${cat.budgeted.toFixed(2)}
                      </span>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
                          style={{ color: 'var(--color-on-surface-variant)' }}>$</span>
                        <input
                          type="number"
                          value={cat.budgeted}
                          min={0}
                          step={50}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            if (cat.key === 'savings') setSavingsAmount(v);
                            else setCategory(
                              cat.key === 'services'  ? 'servicesAmount'
                              : cat.key === 'leisure' ? 'leisureAmount'
                              : 'subscriptionsAmount',
                              v
                            );
                          }}
                          className="w-28 pl-5 pr-2 py-1 text-sm text-right rounded-lg border font-mono focus:outline-none focus:ring-2 focus:ring-[#3525cd]"
                          style={{
                            background: 'var(--color-surface-container-lowest)',
                            borderColor: isDeficit ? 'var(--color-error)' : 'var(--color-outline-variant)',
                            color: 'var(--color-on-surface)',
                            fontFamily: 'Geist Mono, monospace',
                          }}
                        />
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
          <Button variant="primary" size="md" onClick={saveConfig} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
