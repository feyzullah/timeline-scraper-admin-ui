import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { FixturesPage } from './pages/FixturesPage';
import { FixtureEditPage } from './pages/FixtureEditPage';
import { SessionsPage } from './pages/SessionsPage';
import { RequestsPage } from './pages/RequestsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { ApiMapPage } from './pages/ApiMapPage';
import { OpsConfigPage } from './pages/OpsConfigPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="fixtures" element={<FixturesPage />} />
              <Route path="fixtures/edit" element={<FixtureEditPage />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="connections" element={<ConnectionsPage />} />
              <Route path="ops" element={<OpsConfigPage />} />
              <Route path="api-map" element={<ApiMapPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
