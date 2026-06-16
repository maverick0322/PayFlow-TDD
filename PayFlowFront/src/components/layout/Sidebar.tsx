import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BarChart2,
  Wallet,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/',              label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/subscriptions', label: 'Suscripciones', icon: CalendarCheck },
  { to: '/reports',       label: 'Reportes',      icon: BarChart2 },
  { to: '/funds',         label: 'Fondos',        icon: Wallet },
];

interface SidebarProps {
  onAddTransaction: () => void;
}

export function Sidebar({ onAddTransaction }: SidebarProps) {
  return (
    <nav className="hidden md:flex flex-col h-screen w-64 border-r bg-white p-4 gap-2 fixed left-0 top-0 z-40"
      style={{ borderColor: 'var(--color-outline-variant)' }}
    >
      <div className="mb-8 px-4">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
          PayFlow
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
          Wealth Management
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#eaedff] text-[#3525cd]'
                  : 'text-[#464555] hover:bg-[#f2f3ff]'
              )
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </div>

      <button
        onClick={onAddTransaction}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 mt-2"
        style={{ background: 'var(--color-primary)' }}
      >
        <Plus size={16} />
        Registrar Gasto
      </button>
    </nav>
  );
}
