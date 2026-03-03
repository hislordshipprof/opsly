import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import TenantReportPage from '@/pages/TenantReportPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Tenant routes */}
            <Route
              path="/tenant/report"
              element={
                <ProtectedRoute>
                  <TenantReportPage />
                </ProtectedRoute>
              }
            />

            {/* Default: redirect to tenant report (voice demo) */}
            <Route path="*" element={<Navigate to="/tenant/report" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
