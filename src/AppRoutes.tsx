import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/Auth';
import { Dashboard } from './components/dashboard/Dashboard';
import { MenuManagement } from './components/menu/MenuManagement';
import { RoomManagement } from './components/rooms/RoomManagement';
import { TableManagement } from './components/tables/TableManagement';
import { OrderManagement } from './components/orders/OrderManagement';
import { Reports } from './components/reports/Reports';
import { Settings } from './components/settings/Settings';
import { getSession } from './services/session';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<null | boolean>(null);
  useEffect(() => {
    getSession().then(s => setAuth(!!s.authenticated));
  }, []);
  if (auth === null) return <div>Loading...</div>;
  return auth ? <>{children}</> : <Navigate to="/auth" />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/menu" element={<ProtectedRoute><MenuManagement /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><RoomManagement /></ProtectedRoute>} />
          <Route path="/tables" element={<ProtectedRoute><TableManagement /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
