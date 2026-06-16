import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { AddTransactionDialog } from '@/pages/Dashboard/components/AddTransactionDialog';

export function AppShell() {
  const [transactionOpen, setTransactionOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface)' }}>
      <Sidebar onAddTransaction={() => setTransactionOpen(true)} />
      <TopBar />

      {/* Main content — offset for sidebar on desktop */}
      <main className="flex-1 md:ml-64 pt-0 md:pt-16 pb-20 md:pb-0">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-6">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      <AddTransactionDialog
        open={transactionOpen}
        onClose={() => setTransactionOpen(false)}
      />
    </div>
  );
}
