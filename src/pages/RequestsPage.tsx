import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DeliveryPendingRow, OpenRequestRow } from '../api/types';
import { useScrapperClient } from '../api/client';

type Tab = 'active' | 'delivery';

export function RequestsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const { get, apiBaseUrl } = useScrapperClient();

  const active = useQuery({
    queryKey: ['admin', 'requests', apiBaseUrl],
    queryFn: () => get<{ items: OpenRequestRow[] }>('/admin/v1/requests'),
    refetchInterval: 15_000,
    enabled: tab === 'active',
    retry: false
  });

  const pending = useQuery({
    queryKey: ['admin', 'delivery-pending', apiBaseUrl],
    queryFn: () => get<{ items: DeliveryPendingRow[] }>('/admin/v1/requests/delivery-pending'),
    refetchInterval: 10_000,
    enabled: tab === 'delivery',
    retry: false
  });

  const rows = tab === 'active' ? active.data?.items ?? [] : pending.data?.items ?? [];
  const err = tab === 'active' ? active.error : pending.error;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Tracked legs and delivery queue</p>
          <p className="text-slate-600 text-xs mt-1 max-w-2xl">
            One row per unique market on a fixture (same marketType + line + outcome), not one row per bet.
            Multiple coupons on the same selection share a single scrapper leg.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {(['active', 'delivery'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 sm:flex-none min-h-11 px-3 py-2 rounded-lg text-sm border ${
                tab === t
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'text-slate-400 border-white/10 hover:bg-white/5 active:bg-white/10'
              }`}
            >
              {t === 'active' ? 'Active legs' : 'Delivery pending'}
            </button>
          ))}
        </div>
      </header>

      {err ? <p className="text-rose-300 text-sm">{String((err as Error).message)}</p> : null}

      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <article
            key={r.requestId}
            className="glass rounded-xl p-4 border border-white/5 space-y-2"
          >
            <div className="font-mono text-xs text-accent break-all">{r.requestId}</div>
            <div className="text-white text-sm">
              {'homeTeam' in r && r.homeTeam ? `${r.homeTeam} vs ${r.awayTeam}` : r.matchKey}
            </div>
            <div className="font-mono text-[10px] text-slate-500 break-all">{r.matchKey}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-slate-600">Market</dt>
              <dd className="text-slate-300 text-right">
                {'marketType' in r && r.marketType
                  ? `${r.marketType} ${r.outcomeKey ?? ''}`
                  : '—'}
              </dd>
              <dt className="text-slate-600">{tab === 'delivery' ? 'Retries' : 'Cursor sent'}</dt>
              <dd className="font-mono text-slate-400 text-right">
                {tab === 'delivery' && 'retries' in r
                  ? r.retries
                  : 'lastUpdateCursor' in r
                    ? (r.lastUpdateCursor ?? '—')
                    : '—'}
              </dd>
            </dl>
          </article>
        ))}
        {rows.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No rows</p>
        ) : null}
      </div>

      <div className="hidden md:block glass rounded-xl overflow-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="text-left text-slate-500 border-b border-white/5">
            <tr>
              <th className="p-3">requestId</th>
              <th className="p-3">match</th>
              <th className="p-3">market</th>
              {tab === 'delivery' ? <th className="p-3">retries</th> : <th className="p-3">cursor sent</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.requestId} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-[11px] text-accent/90">{r.requestId}</td>
                <td className="p-3">
                  <div className="text-slate-300">
                    {'homeTeam' in r && r.homeTeam
                      ? `${r.homeTeam} vs ${r.awayTeam}`
                      : r.matchKey}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">{r.matchKey}</div>
                </td>
                <td className="p-3 text-slate-400">
                  {'marketType' in r && r.marketType
                    ? `${r.marketType} ${r.outcomeKey ?? ''}`
                    : '—'}
                </td>
                <td className="p-3 font-mono text-slate-400">
                  {tab === 'delivery' && 'retries' in r
                    ? r.retries
                    : 'lastUpdateCursor' in r
                      ? (r.lastUpdateCursor ?? '—')
                      : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No rows
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
