import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { SubscriptionsPage } from '@/pages/Subscriptions/SubscriptionsPage';
import { ReportsPage } from '@/pages/Reports/ReportsPage';
import { FundsPage } from '@/pages/Funds/FundsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/"              element={<DashboardPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/reports"       element={<ReportsPage />} />
          <Route path="/funds"         element={<FundsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
