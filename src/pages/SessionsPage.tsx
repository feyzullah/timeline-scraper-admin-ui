import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { SessionsListResponse } from '../api/types';
import { useScrapperClient } from '../api/client';
import { useSettings } from '../context/SettingsContext';

export function SessionsPage() {
  const { get, apiBaseUrl } = useScrapperClient();
  const { defaultAppId } = useSettings();

  const sessions = useQuery({
    queryKey: ['admin', 'sessions', apiBaseUrl, defaultAppId],
    queryFn: () =>
      get<SessionsListResponse>('/admin/v1/sessions', { appId: defaultAppId, limit: 100 }),
    refetchInterval: 20_000,
    retry: false
  });

  const items = sessions.data?.items ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Sessions</h1>
        <p className="text-slate-500 text-sm mt-1">Match sessions for appId {defaultAppId}</p>
      </header>

      {sessions.error ? (
        <p className="text-rose-300 text-sm">{String((sessions.error as Error).message)}</p>
      ) : null}

      <div className="md:hidden space-y-3">
        {items.map((s) => (
          <article
            key={`${s.appId}:${s.matchKey}`}
            className="glass rounded-xl p-4 border border-white/5 space-y-2"
          >
            <div className="text-white font-medium">
              {s.homeTeam || '—'} vs {s.awayTeam || '—'}
            </div>
            <div className="font-mono text-[11px] text-slate-500 break-all">{s.matchKey}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pt-1">
              <dt className="text-slate-600">Phase</dt>
              <dd className="text-slate-300 text-right">{s.phase || '—'}</dd>
              <dt className="text-slate-600">Cursor</dt>
              <dd className="font-mono text-right">{s.cursor}</dd>
              <dt className="text-slate-600">Legs</dt>
              <dd className="text-right">
                {s.activeRequestCount}/{s.requestCount}
              </dd>
              <dt className="text-slate-600">Worker</dt>
              <dd className="text-right">
                <span
                  className={`text-xs px-2 py-0.5 rounded inline-block ${s.workerRunning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}
                >
                  {s.workerRunning ? 'running' : 'idle'}
                </span>
              </dd>
            </dl>
          </article>
        ))}
        {!sessions.isLoading && items.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No sessions</p>
        ) : null}
      </div>

      <div className="hidden md:block glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-white/5">
            <tr>
              <th className="p-3 font-medium">Match</th>
              <th className="p-3 font-medium">Phase</th>
              <th className="p-3 font-medium">Cursor</th>
              <th className="p-3 font-medium">Legs</th>
              <th className="p-3 font-medium">Worker</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={`${s.appId}:${s.matchKey}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3">
                  <div className="text-white">
                    {s.homeTeam || '—'} vs {s.awayTeam || '—'}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 truncate max-w-md" title={s.matchKey}>
                    {s.matchKey}
                  </div>
                </td>
                <td className="p-3 text-slate-300">{s.phase || '—'}</td>
                <td className="p-3 font-mono">{s.cursor}</td>
                <td className="p-3">
                  {s.activeRequestCount}/{s.requestCount}
                </td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${s.workerRunning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}
                  >
                    {s.workerRunning ? 'running' : 'idle'}
                  </span>
                </td>
              </tr>
            ))}
            {!sessions.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No sessions
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600">
        Full session JSON: <code className="text-accent/80">GET /admin/v1/sessions/:appId/:matchKey</code> — detail UI coming next.{' '}
        <Link to="/api-map" className="text-accent underline">
          API map
        </Link>
      </p>
    </div>
  );
}
