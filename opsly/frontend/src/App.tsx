import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Role } from '@/types';
import LoginPage from '@/pages/LoginPage';
import TenantReportPage from '@/pages/TenantReportPage';
import ManagerDashboardPage from '@/pages/ManagerDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user?.role && !roles.includes(user.role as Role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** After login, redirect to the right dashboard based on role */
function RoleRedirect() {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case Role.MANAGER:
    case Role.ADMIN:
      return <Navigate to="/manager" replace />;
    case Role.TENANT:
      return <Navigate to="/tenant/report" replace />;
    case Role.TECHNICIAN:
      return <Navigate to="/tenant/report" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Manager dashboard */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute roles={[Role.MANAGER, Role.ADMIN]}>
                  <ManagerDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Tenant routes */}
            <Route
              path="/tenant/report"
              element={
                <ProtectedRoute>
                  <TenantReportPage />
                </ProtectedRoute>
              }
            />

            {/* Default: role-based redirect */}
            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
