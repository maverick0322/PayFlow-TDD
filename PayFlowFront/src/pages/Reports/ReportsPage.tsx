import { useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useReportsStore } from '@/store/reports.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ReportsPage() {
  const { report, isLoading, fetchReport } = useReportsStore();

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
          Cargando...
        </div>
      </div>
    );
  }

  const chartData = report.categories.map((c) => ({
    name: c.name,
    Presupuestado: c.budgeted,
    Real: c.actual,
  }));

  const deviationSign = report.totalDeviation < 0 ? '' : '+';
  const deviationColor = report.totalDeviation <= 0 ? '#059669' : '#dc2626';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
          Reporte de Variabilidad
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
          Corte de caja mensual y análisis de desviaciones presupuestales — {report.period}
        </p>
      </div>

      {/* Summary card */}
      <Card className="p-5 flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-on-surface-variant)' }}>
            Desviación Total
          </span>
          <span className="text-3xl font-semibold tracking-tight" style={{ color: deviationColor, fontFamily: 'Geist Mono, monospace' }}>
            {deviationSign}${Math.abs(report.totalDeviation).toFixed(2)}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
            {report.deviationDirection === 'below' ? 'Gasto por debajo del proyectado' : 'Gasto por encima del proyectado'}
          </span>
        </div>
      </Card>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Presupuestado vs. Real</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c7c4d8" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#464555' }} />
              <YAxis tick={{ fontSize: 12, fill: '#464555' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`]}
                contentStyle={{ borderRadius: 8, border: '1px solid #c7c4d8', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Presupuestado" fill="#c3c0ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Real" fill="#3525cd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card className="overflow-hidden">
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b text-xs font-medium uppercase tracking-widest"
          style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)', color: 'var(--color-on-surface-variant)' }}
        >
          <div>Categoría</div>
          <div className="text-right">Presupuestado</div>
          <div className="text-right">Real</div>
          <div className="text-right">Desviación</div>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
          {report.categories.map((cat) => {
            const devColor = cat.deviation <= 0 ? '#059669' : '#dc2626';
            const devSign = cat.deviation > 0 ? '+' : '';
            return (
              <div key={cat.name} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-[#f2f3ff] transition-colors">
                <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>{cat.name}</span>
                <span className="text-sm text-right font-mono" style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Geist Mono, monospace' }}>
                  ${cat.budgeted.toFixed(2)}
                </span>
                <span className="text-sm text-right font-mono" style={{ color: 'var(--color-on-surface)', fontFamily: 'Geist Mono, monospace' }}>
                  ${cat.actual.toFixed(2)}
                </span>
                <span className="text-sm text-right font-mono font-semibold" style={{ color: devColor, fontFamily: 'Geist Mono, monospace' }}>
                  {devSign}${Math.abs(cat.deviation).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
