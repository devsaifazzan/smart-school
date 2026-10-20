import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { StudentsPage } from './features/students/StudentsPage';
import { AcademicsPage } from './features/academics/AcademicsPage';
import { TimetablePage } from './features/timetable/TimetablePage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { ExamsPage } from './features/exams/ExamsPage';
import { FinancePage } from './features/finance/FinancePage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { UsersManagementPage } from './features/users/UsersManagementPage';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const IndexRedirect: React.FC = () => {
  const { getDefaultRoute } = useAuth();
  return <Navigate to={getDefaultRoute()} replace />;
};

const PermissionRoute: React.FC<{ resource: string; children: React.ReactNode }> = ({
  resource,
  children,
}) => {
  const { hasPermission, getDefaultRoute } = useAuth();
  if (!hasPermission(resource, 'read')) {
    return <Navigate to={getDefaultRoute()} replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<IndexRedirect />} />
              <Route
                path="dashboard"
                element={
                  <PermissionRoute resource="dashboard">
                    <DashboardPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="students"
                element={
                  <PermissionRoute resource="students">
                    <StudentsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="academics"
                element={
                  <PermissionRoute resource="academics">
                    <AcademicsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="timetable"
                element={
                  <PermissionRoute resource="timetable">
                    <TimetablePage />
                  </PermissionRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <PermissionRoute resource="attendance">
                    <AttendancePage />
                  </PermissionRoute>
                }
              />
              <Route
                path="exams"
                element={
                  <PermissionRoute resource="exams">
                    <ExamsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="finance"
                element={
                  <PermissionRoute resource="finance">
                    <FinancePage />
                  </PermissionRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <PermissionRoute resource="analytics">
                    <AnalyticsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="users"
                element={
                  <PermissionRoute resource="users">
                    <UsersManagementPage />
                  </PermissionRoute>
                }
              />
            </Route>

            <Route path="*" element={<IndexRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
