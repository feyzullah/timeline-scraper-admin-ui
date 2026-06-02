import { useQuery } from '@tanstack/react-query';
import type { ConnectionsResponse } from '../api/types';
import { useScrapperClient } from '../api/client';
import { JsonView } from '../components/JsonView';

export function ConnectionsPage() {
  const { get, apiBaseUrl } = useScrapperClient();

  const connections = useQuery({
    queryKey: ['admin', 'connections', apiBaseUrl],
    queryFn: () => get<ConnectionsResponse>('/admin/v1/connections'),
    refetchInterval: 10_000,
    retry: false
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">WebSocket connections</h1>
        <p className="text-slate-500 text-sm mt-1">Settler and gateway clients attached to the scrapper</p>
      </header>

      {connections.error ? (
        <p className="text-rose-300 text-sm">{String((connections.error as Error).message)}</p>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Settler WS</div>
          <div className="text-3xl font-mono text-white mt-2">
            {connections.data?.settler?.length ?? '—'}
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Gateway WS</div>
          <div className="text-3xl font-mono text-white mt-2">
            {connections.data?.gateway?.length ?? '—'}
          </div>
        </div>
      </div>

      <JsonView data={connections.data ?? { loading: connections.isLoading }} />
    </div>
  );
}
