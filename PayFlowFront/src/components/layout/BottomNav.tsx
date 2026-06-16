import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/subscriptions', label: 'Suscripciones', icon: CalendarCheck },
  { to: '/reports', label: 'Reportes', icon: BarChart2 },
];

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 z-50 border-t"
      style={{
        background: 'rgba(250,248,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      {mobileNavItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium w-16 py-1 transition-colors',
              isActive ? 'text-[#3525cd]' : 'text-[#464555]'
            )
          }
        >
          <Icon size={22} strokeWidth={1.75} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
