import { useQuery } from '@tanstack/react-query';
import type { AdminHealthDetail, AdminStats } from '../api/types';
import { useScrapperClient } from '../api/client';
import { JsonView } from '../components/JsonView';
import { useSettings } from '../context/SettingsContext';

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-white mt-1 font-mono">{value}</div>
      {hint ? <div className="text-xs text-slate-500 mt-1">{hint}</div> : null}
    </div>
  );
}

export function DashboardPage() {
  const { get, apiBaseUrl } = useScrapperClient();
  const { defaultAppId } = useSettings();

  const health = useQuery({
    queryKey: ['admin', 'health', apiBaseUrl],
    queryFn: () => get<AdminHealthDetail>('/admin/v1/health/detail'),
    refetchInterval: 15_000,
    retry: false
  });

  const stats = useQuery({
    queryKey: ['admin', 'stats', apiBaseUrl, defaultAppId],
    queryFn: () => get<AdminStats>('/admin/v1/stats', { appId: defaultAppId }),
    refetchInterval: 15_000,
    retry: false
  });

  const err = health.error || stats.error;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title">Scrapper operations</h1>
        <p className="text-slate-500 text-sm mt-1">
          Live view of timeline-scrapper · filter appId <span className="font-mono text-accent">{defaultAppId}</span>
        </p>
      </header>

      {err ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          Cannot reach admin API. Start timeline-scrapper and set admin key in{' '}
          <a href="/settings" className="text-accent underline">
            Settings
          </a>
          .
          <div className="font-mono text-xs mt-2 text-rose-300/80">{String((err as Error).message)}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Health" value={health.data?.ok ? 'OK' : '—'} />
        <StatCard label="Sessions" value={stats.data?.sessions ?? '—'} />
        <StatCard label="Open legs" value={stats.data?.openRequests ?? '—'} />
        <StatCard label="Delivery pending" value={stats.data?.deliveryPending ?? '—'} />
        <StatCard label="WS connections" value={stats.data?.wsConnections ?? '—'} />
        <StatCard label="Workers running" value={stats.data?.workersRunning ?? '—'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Health detail</h2>
          <JsonView data={health.data ?? { loading: health.isLoading }} />
        </section>
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Stats</h2>
          <JsonView data={stats.data ?? { loading: stats.isLoading }} />
        </section>
      </div>
    </div>
  );
}
