import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import type { SessionsListResponse } from '../api/types';
import { useScrapperClient } from '../api/client';
import { DEFAULT_PAGE_SIZE, Pagination } from '../components/Pagination';
import { sessionDetailHref } from '../lib/sessionPaths';

function SessionCard({ s }: { s: SessionsListResponse['items'][0] }) {
  const detailTo = sessionDetailHref(s.appId, s.matchKey);

  return (
    <Link
      to={detailTo}
      className="block glass rounded-xl p-4 border border-white/5 space-y-2 hover:border-accent/20 hover:bg-white/[0.02] transition-colors"
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
    </Link>
  );
}

function parsePage(raw: string | null) {
  const n = Number.parseInt(raw || '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function SessionsPage() {
  const { get, apiBaseUrl } = useScrapperClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const showIdle = searchParams.get('showIdle') === '1';
  const page = parsePage(searchParams.get('page'));
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  const sessions = useQuery({
    queryKey: ['admin', 'sessions', apiBaseUrl, showIdle, page],
    queryFn: () =>
      get<SessionsListResponse>('/admin/v1/sessions', {
        limit: DEFAULT_PAGE_SIZE,
        offset,
        ...(!showIdle ? { activeOnly: '1' } : {}),
      }),
    refetchInterval: 20_000,
    retry: false,
  });

  const items = sessions.data?.items ?? [];
  const total = sessions.data?.total ?? items.length;

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const setShowIdle = (checked: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (checked) next.set('showIdle', '1');
    else next.delete('showIdle');
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Sessions</h1>
        <p className="text-slate-500 text-sm mt-1">
          Live match sessions with tracked settler legs. Idle sessions are hidden by default.
        </p>
      </header>

      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer w-fit">
        <input
          type="checkbox"
          className="rounded border-white/20"
          checked={showIdle}
          onChange={(e) => setShowIdle(e.target.checked)}
        />
        Show idle sessions (no tracked legs)
      </label>

      {sessions.error ? (
        <p className="text-rose-300 text-sm">{String((sessions.error as Error).message)}</p>
      ) : null}

      <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={total} onPageChange={setPage} />

      <div className="md:hidden space-y-3">
        {items.map((s) => (
          <SessionCard key={`${s.appId}:${s.matchKey}`} s={s} />
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
                  <Link to={sessionDetailHref(s.appId, s.matchKey)} className="block group">
                    <div className="text-white group-hover:text-accent transition-colors">
                      {s.homeTeam || '—'} vs {s.awayTeam || '—'}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 truncate max-w-md" title={s.matchKey}>
                      {s.matchKey}
                    </div>
                  </Link>
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
    </div>
  );
}
