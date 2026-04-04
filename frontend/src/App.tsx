import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ClientsPage from './pages/ClientsPage';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechnicianProjectsPage from './pages/TechnicianProjectsPage';
import TechnicianTasksPage from './pages/TechnicianTasksPage';
import Layout from './components/ui/Layout';
import type { UserRole } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function getStoredUser(): { role: UserRole } | null {
  try {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const token = localStorage.getItem('token');
  const user = getStoredUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return user.role === 'technician' ? <Navigate to="/my-dashboard" replace /> : <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  const [, forceUpdate] = useState(0);

  const handleLogin = () => {
    forceUpdate((n) => n + 1);
  };

  const user = getStoredUser();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

          {/* Manager / Admin routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <ClientsPage />
              </ProtectedRoute>
            }
          />

          {/* Project detail -- accessible by all authenticated users (technicians view their assigned projects) */}
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Technician routes */}
          <Route
            path="/my-dashboard"
            element={
              <ProtectedRoute roles={['technician', 'admin']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-projects"
            element={
              <ProtectedRoute roles={['technician', 'admin']}>
                <TechnicianProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute roles={['technician', 'admin']}>
                <TechnicianTasksPage />
              </ProtectedRoute>
            }
          />

          {/* Root: landing for guests, redirect authenticated users */}
          <Route
            path="/"
            element={
              user?.role === 'technician'
                ? <Navigate to="/my-dashboard" replace />
                : user
                ? <Navigate to="/dashboard" replace />
                : <LandingPage />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
