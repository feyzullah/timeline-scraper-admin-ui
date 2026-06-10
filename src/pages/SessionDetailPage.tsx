import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { MatchSessionDoc, SessionRequestLeg } from '../api/types';
import { useScrapperClient } from '../api/client';
import { Button } from '../components/Button';
import { JsonView } from '../components/JsonView';
import { fixtureEditHref, sessionApiPath } from '../lib/sessionPaths';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm border-b border-white/5 last:border-0">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-200 text-right break-all font-mono text-xs">{value ?? '—'}</dd>
    </div>
  );
}

function RequestLegTable({ legs }: { legs: SessionRequestLeg[] }) {
  if (legs.length === 0) {
    return <p className="text-slate-500 text-sm">No tracked legs</p>;
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {legs.map((leg) => (
          <article key={leg.requestId} className="glass rounded-xl p-4 border border-white/5 space-y-2">
            <div className="font-mono text-[11px] text-accent break-all">{leg.requestId}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-slate-600">Status</dt>
              <dd className="text-right">{leg.status || '—'}</dd>
              <dt className="text-slate-600">Market</dt>
              <dd className="text-right font-mono">{leg.marketType || '—'}</dd>
              <dt className="text-slate-600">Line</dt>
              <dd className="text-right">{leg.line ?? '—'}</dd>
              <dt className="text-slate-600">Outcome</dt>
              <dd className="text-right">{leg.outcomeKey || '—'}</dd>
              <dt className="text-slate-600">Book id</dt>
              <dd className="text-right font-mono break-all">{leg.sourceMatchId || '—'}</dd>
              <dt className="text-slate-600">Bet id</dt>
              <dd className="text-right font-mono break-all">{leg.betId || '—'}</dd>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden md:block overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-white/5">
            <tr>
              <th className="p-3 font-medium">Request</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Market</th>
              <th className="p-3 font-medium">Line</th>
              <th className="p-3 font-medium">Outcome</th>
              <th className="p-3 font-medium">Book id</th>
              <th className="p-3 font-medium">Bet id</th>
            </tr>
          </thead>
          <tbody>
            {legs.map((leg) => (
              <tr key={leg.requestId} className="border-b border-white/5">
                <td className="p-3 font-mono text-[11px] text-accent max-w-xs truncate" title={leg.requestId}>
                  {leg.requestId}
                </td>
                <td className="p-3">{leg.status || '—'}</td>
                <td className="p-3 font-mono text-xs">{leg.marketType || '—'}</td>
                <td className="p-3">{leg.line ?? '—'}</td>
                <td className="p-3">{leg.outcomeKey || '—'}</td>
                <td className="p-3 font-mono text-xs">{leg.sourceMatchId || '—'}</td>
                <td className="p-3 font-mono text-[11px] text-slate-400 max-w-[8rem] truncate" title={leg.betId || ''}>
                  {leg.betId ? leg.betId.slice(-8) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SessionDetailPage() {
  const [params] = useSearchParams();
  const appId = params.get('appId') || '';
  const matchKey = params.get('matchKey') || '';
  const { get, del } = useScrapperClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const session = useQuery({
    queryKey: ['session', appId, matchKey],
    queryFn: () => get<MatchSessionDoc>(sessionApiPath(appId, matchKey)),
    enabled: Boolean(appId && matchKey),
    refetchInterval: 15_000,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: () => del<{ removed: boolean }>(sessionApiPath(appId, matchKey)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      navigate('..', { relative: 'path' });
    },
  });

  const doc = session.data;
  const book = doc?.fixtureBook;
  const legs = doc?.requests ?? [];
  const activeLegs = legs.filter((l) => l.status === 'active');
  const snapshot = doc?.lastMergedSnapshot;
  const goals = snapshot?.goals as { home?: number; away?: number } | undefined;

  if (!appId || !matchKey) {
    return (
      <p className="text-slate-500">
        Missing <code className="text-accent">appId</code> or <code className="text-accent">matchKey</code>.{' '}
        <Link to=".." className="text-accent underline">
          Back to sessions
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to=".." className="text-xs text-accent hover:underline">
          ← Sessions
        </Link>
        <h1 className="page-title mt-2">
          {book?.homeTeam || '—'} vs {book?.awayTeam || '—'}
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-mono break-all">{matchKey}</p>
        <p className="text-xs text-slate-600 mt-1">appId={appId}</p>
      </header>

      {session.error ? (
        <p className="text-rose-300 text-sm">{String((session.error as Error).message)}</p>
      ) : null}
      {deleteMutation.error ? (
        <p className="text-rose-300 text-sm">{String((deleteMutation.error as Error).message)}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => navigate(fixtureEditHref(appId, matchKey))}>
          Edit facts
        </Button>
        <Button
          variant="danger"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (
              window.confirm(
                'Stop worker and delete this session from match_sessions? Archived matches are not removed.'
              )
            ) {
              deleteMutation.mutate();
            }
          }}
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete session'}
        </Button>
      </div>

      {session.isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : doc ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Phase', value: doc.phase },
              { label: 'Status', value: doc.sessionStatus },
              { label: 'Cursor', value: doc.cursor },
              {
                label: 'Worker',
                value: doc.worker?.running ? 'running' : 'idle',
              },
            ].map((card) => (
              <div key={card.label} className="glass rounded-xl p-4 border border-white/5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{card.label}</div>
                <div className="text-lg font-medium text-white mt-1">{card.value ?? '—'}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="glass rounded-xl p-5 border border-white/5 space-y-3">
              <h2 className="text-sm font-medium text-slate-300">Fixture</h2>
              <dl>
                <InfoRow label="Tournament" value={book?.tournamentName} />
                <InfoRow label="Kickoff (UTC)" value={book?.kickoffUtc} />
                <InfoRow
                  label="Score (merged)"
                  value={
                    goals?.home != null && goals?.away != null ? `${goals.home}–${goals.away}` : undefined
                  }
                />
                <InfoRow label="Fixture status" value={String(snapshot?.fixtureStatusShort ?? '') || undefined} />
              </dl>
            </section>

            <section className="glass rounded-xl p-5 border border-white/5 space-y-3">
              <h2 className="text-sm font-medium text-slate-300">Scheduling & worker</h2>
              <dl>
                <InfoRow label="Min resolution tier" value={doc.scheduling?.minResolutionTier} />
                <InfoRow label="Fetch allowed (UTC)" value={doc.scheduling?.fetchAllowedAtUtc} />
                <InfoRow
                  label="Needs goal timeline"
                  value={doc.scheduling?.needsGoalTimeline == null ? undefined : String(doc.scheduling.needsGoalTimeline)}
                />
                <InfoRow
                  label="Needs statistics"
                  value={doc.scheduling?.needsStatistics == null ? undefined : String(doc.scheduling.needsStatistics)}
                />
                <InfoRow label="Next fetch (UTC)" value={doc.worker?.nextScheduledAtUtc} />
                <InfoRow label="Last fetch (UTC)" value={doc.worker?.lastFetchAtUtc} />
                <InfoRow label="Updated" value={doc.updatedAt} />
              </dl>
            </section>
          </div>

          <section className="glass rounded-xl p-5 border border-white/5 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-300">Tracked legs</h2>
              <span className="text-xs text-slate-500">
                {activeLegs.length} active / {legs.length} total
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Deduped by market (type + line + outcome), not by bet — e.g. five OU 3.5 coupons share one leg.
            </p>
            <RequestLegTable legs={legs} />
          </section>

          <details className="glass rounded-xl p-4">
            <summary className="text-sm text-slate-400 cursor-pointer">Raw session JSON</summary>
            <JsonView data={doc} className="mt-3" />
          </details>
        </>
      ) : null}
    </div>
  );
}
