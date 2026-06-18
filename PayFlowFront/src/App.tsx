import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardPage }    from '@/pages/Dashboard/DashboardPage';
import { SubscriptionsPage } from '@/pages/Subscriptions/SubscriptionsPage';
import { ReportsPage }      from '@/pages/Reports/ReportsPage';
import { FundsPage }        from '@/pages/Funds/FundsPage';
import { LoginPage }        from '@/pages/Auth/LoginPage';
import { RegisterPage }     from '@/pages/Auth/RegisterPage';
import { useAuthStore }     from '@/store/auth.store';

export default function App() {
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  // Restore auth state from localStorage before the first render cycle completes.
  useEffect(() => { initFromStorage(); }, [initFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — wrapped in AppShell layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/"              element={<DashboardPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/reports"       element={<ReportsPage />} />
            <Route path="/funds"         element={<FundsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
