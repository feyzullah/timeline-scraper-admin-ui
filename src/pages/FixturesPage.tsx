import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import type { FixturesListResponse } from '../api/types';
import { useScrapperClient } from '../api/client';
import { fixtureEditHref } from '../lib/sessionPaths';

const STATUS_LABELS: Record<string, string> = {
  no_data: 'No data',
  pre_kickoff: 'Pre kickoff',
  missing_ht: 'Missing HT',
  missing_ft: 'Missing FT',
  missing_goal_timeline: 'Missing goal timeline',
  missing_statistics: 'Missing statistics',
  ready: 'Ready',
  live_partial: 'Live (partial)',
};

const STATUS_COLORS: Record<string, string> = {
  no_data: 'bg-rose-500/20 text-rose-300',
  pre_kickoff: 'bg-slate-500/20 text-slate-300',
  missing_ht: 'bg-amber-500/20 text-amber-200',
  missing_ft: 'bg-orange-500/20 text-orange-200',
  missing_goal_timeline: 'bg-yellow-500/20 text-yellow-200',
  missing_statistics: 'bg-purple-500/20 text-purple-200',
  ready: 'bg-emerald-500/20 text-emerald-300',
  live_partial: 'bg-sky-500/20 text-sky-300',
};

function statusBadge(status: string) {
  const cls = STATUS_COLORS[status] || 'bg-white/10 text-slate-300';
  return (
    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${cls}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function scoreLine(row: FixturesListResponse['items'][0]) {
  const g = row.goals;
  if (g?.home != null && g?.away != null) return `${g.home}–${g.away}`;
  const ht = row.score?.halftime;
  const ft = row.score?.fulltime;
  if (ft?.home != null) return `FT ${ft.home}–${ft.away}`;
  if (ht?.home != null) return `HT ${ht.home}–${ht.away}`;
  return '—';
}

export function FixturesPage() {
  const { get, apiBaseUrl } = useScrapperClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const appId = searchParams.get('appId') || '';
  const team = searchParams.get('team') || '';
  const dataStatus = searchParams.get('dataStatus') || '';
  const source = searchParams.get('source') || 'all';

  const [teamDraft, setTeamDraft] = useState(team);
  const [appIdDraft, setAppIdDraft] = useState(appId);

  const queryKey = useMemo(
    () => ['fixtures', apiBaseUrl, appId, team, dataStatus, source],
    [apiBaseUrl, appId, team, dataStatus, source]
  );

  const fixtures = useQuery({
    queryKey,
    queryFn: () =>
      get<FixturesListResponse>('/admin/v1/fixtures', {
        limit: 200,
        ...(appId ? { appId } : {}),
        ...(team ? { team } : {}),
        ...(dataStatus ? { dataStatus } : {}),
        ...(source !== 'all' ? { source } : {}),
      }),
    refetchInterval: 20_000,
    retry: false,
  });

  const filters = fixtures.data?.dataStatusFilters || [
    'no_data',
    'pre_kickoff',
    'missing_ht',
    'missing_ft',
    'missing_goal_timeline',
    'missing_statistics',
    'ready',
    'live_partial',
  ];

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    if (teamDraft) next.set('team', teamDraft);
    else next.delete('team');
    if (appIdDraft) next.set('appId', appIdDraft);
    else next.delete('appId');
    setSearchParams(next);
  };

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Fixture editor</h1>
        <p className="text-slate-500 text-sm mt-1">
          Search matches by data quality, then edit HT/FT scores, goals, cards, and corners.
        </p>
      </header>

      <div className="glass rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <label className="space-y-1">
          <span className="text-[10px] uppercase text-slate-500">App ID (optional)</span>
          <input
            className="input-touch font-mono"
            value={appIdDraft}
            onChange={(e) => setAppIdDraft(e.target.value)}
            placeholder="All apps"
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </label>
        <label className="space-y-1 sm:col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase text-slate-500">Team search</span>
          <input
            className="input-touch"
            value={teamDraft}
            onChange={(e) => setTeamDraft(e.target.value)}
            placeholder="Home or away"
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] uppercase text-slate-500">Data status</span>
          <select
            className="select-touch"
            value={dataStatus}
            onChange={(e) => setFilter('dataStatus', e.target.value)}
          >
            <option value="">All statuses</option>
            {filters.map((f) => (
              <option key={f} value={f}>
                {STATUS_LABELS[f] || f}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] uppercase text-slate-500">Source</span>
          <select
            className="select-touch"
            value={source}
            onChange={(e) => setFilter('source', e.target.value === 'all' ? '' : e.target.value)}
          >
            <option value="all">Sessions + archived</option>
            <option value="session">Active sessions only</option>
            <option value="archived">Archived only</option>
          </select>
        </label>
        <button
          type="button"
          className="w-full sm:w-auto min-h-11 rounded-lg px-4 py-2.5 text-sm bg-accent/20 text-accent border border-accent/30 active:scale-[0.98]"
          onClick={applyFilters}
        >
          Search
        </button>
      </div>

      {fixtures.error ? (
        <p className="text-rose-300 text-sm">{String((fixtures.error as Error).message)}</p>
      ) : null}

      <div className="text-xs text-slate-500">
        {fixtures.data ? `${fixtures.data.total} match(es)` : '…'}
        {appId ? ` · appId: ${appId}` : ''}
        {dataStatus ? ` · filter: ${STATUS_LABELS[dataStatus] || dataStatus}` : ''}
      </div>

      <div className="md:hidden space-y-3">
        {(fixtures.data?.items || []).map((row) => (
          <article
            key={`${row.appId}:${row.matchKey}`}
            className="glass rounded-xl p-4 space-y-3 border border-white/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              {statusBadge(row.dataStatus)}
              <Link
                className="text-accent text-sm font-medium min-h-11 inline-flex items-center px-2 -mr-2"
                to={fixtureEditHref(row.appId, row.matchKey, row.source)}
              >
                Edit →
              </Link>
            </div>
            <div>
              <div className="text-white font-medium">
                {row.homeTeam || '—'} vs {row.awayTeam || '—'}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1 break-all">
                {row.appId} · {row.matchKey}
              </div>
              {row.kickoffUtc ? (
                <div className="text-xs text-slate-600 mt-0.5">
                  {new Date(row.kickoffUtc).toLocaleString()}
                </div>
              ) : null}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-slate-600">Score</dt>
              <dd className="text-white font-mono text-right">{scoreLine(row)}</dd>
              <dt className="text-slate-600">Events</dt>
              <dd className="text-slate-300 text-right">
                {row.eventCount} ev{row.hasStatistics ? ' · stats' : ''}
              </dd>
              <dt className="text-slate-600">Source</dt>
              <dd className="text-slate-400 text-right">
                {row.source}
                {row.activeRequestCount > 0 ? ` · ${row.activeRequestCount} legs` : ''}
              </dd>
            </dl>
          </article>
        ))}
        {!fixtures.isLoading && (fixtures.data?.items.length ?? 0) === 0 ? (
          <p className="text-center text-slate-500 py-10">No fixtures match filters</p>
        ) : null}
      </div>

      <div className="hidden md:block glass rounded-xl overflow-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-left text-slate-500 border-b border-white/5">
            <tr>
              <th className="p-3">Status</th>
              <th className="p-3">App</th>
              <th className="p-3">Match</th>
              <th className="p-3">Score</th>
              <th className="p-3">Events</th>
              <th className="p-3">Source</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(fixtures.data?.items || []).map((row) => (
              <tr key={`${row.appId}:${row.matchKey}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3">
                  {statusBadge(row.dataStatus)}
                  {row.dataStatusTags.length > 1 ? (
                    <div className="text-[10px] text-slate-600 mt-1">{row.dataStatusTags.join(', ')}</div>
                  ) : null}
                </td>
                <td className="p-3 font-mono text-xs text-slate-400">{row.appId}</td>
                <td className="p-3">
                  <div className="text-white">
                    {row.homeTeam || '—'} vs {row.awayTeam || '—'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs" title={row.matchKey}>
                    {row.kickoffUtc ? new Date(row.kickoffUtc).toLocaleString() : ''} · {row.matchKey}
                  </div>
                </td>
                <td className="p-3 font-mono">{scoreLine(row)}</td>
                <td className="p-3 text-slate-400">
                  {row.eventCount} ev
                  {row.hasStatistics ? ' · stats' : ''}
                  {row.fixtureStatusShort ? ` · ${row.fixtureStatusShort}` : ''}
                </td>
                <td className="p-3 text-slate-500 text-xs">
                  {row.source}
                  {row.activeRequestCount > 0 ? ` · ${row.activeRequestCount} legs` : ''}
                </td>
                <td className="p-3 text-right">
                  <Link
                    className="text-accent text-sm hover:underline"
                    to={fixtureEditHref(row.appId, row.matchKey, row.source)}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!fixtures.isLoading && (fixtures.data?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500">
                  No fixtures match filters
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
