import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/subscriptions': 'Suscripciones',
  '/reports': 'Reporte de Variabilidad',
  '/funds': 'Configuración de Fondos',
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'PayFlow';

  return (
    <header
      className="hidden md:flex items-center px-8 h-16 border-b fixed top-0 left-64 right-0 z-30 bg-white"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <span className="text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
        {title}
      </span>
    </header>
  );
}
