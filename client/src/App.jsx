import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BudgetPage from './pages/BudgetPage';
import Layout from './components/Layout';
import Loader from './components/Loader';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Loading..." />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Loading..." />;
  return user ? <Navigate to="/" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="budget" element={<BudgetPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
