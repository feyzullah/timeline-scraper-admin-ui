import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { routerBasename } from './lib/appPaths';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FixturesPage } from './pages/FixturesPage';
import { FixtureEditPage } from './pages/FixtureEditPage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { RequestsPage } from './pages/RequestsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { OpsConfigPage } from './pages/OpsConfigPage';
import { OperatorKeysPage } from './pages/OperatorKeysPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
});

function AppRoutes() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  return (
    <BrowserRouter basename={routerBasename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="fixtures" element={<FixturesPage />} />
          <Route path="fixtures/edit" element={<FixtureEditPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/detail" element={<SessionDetailPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="operator-keys" element={<OperatorKeysPage />} />
          <Route path="ops" element={<OpsConfigPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
