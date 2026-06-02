const routes = [
  { method: 'GET', path: '/admin/v1/health/detail', note: 'Mongo + delivery health' },
  { method: 'GET', path: '/admin/v1/runtime-config', note: 'Live ops overrides + circuit/queue status' },
  { method: 'PATCH', path: '/admin/v1/runtime-config', note: 'Apply in-memory env overrides' },
  { method: 'POST', path: '/admin/v1/runtime-config/circuits/reset', note: 'Clear circuit breaker' },
  { method: 'GET', path: '/admin/v1/fixtures', note: 'Search fixtures by dataStatus, team, source' },
  { method: 'PATCH', path: '/admin/v1/sessions/:appId/:matchKey', note: 'Operator facts edit (live session)' },
  { method: 'GET', path: '/admin/v1/stats', note: 'Counts (optional ?appId=)' },
  { method: 'GET', path: '/admin/v1/sessions', note: 'List session summaries' },
  { method: 'GET', path: '/admin/v1/sessions/:appId/:matchKey', note: 'Full session document' },
  { method: 'DELETE', path: '/admin/v1/sessions/:appId/:matchKey', note: 'Stop worker, delete session' },
  { method: 'GET', path: '/admin/v1/requests', note: 'Active legs (flattened)' },
  { method: 'GET', path: '/admin/v1/requests/delivery-pending', note: 'Unacked match_update' },
  { method: 'GET', path: '/admin/v1/connections', note: 'Settler + gateway WS' },
  { method: 'GET', path: '/admin/v1/matches', note: 'Archived match book list' },
  { method: 'GET', path: '/admin/v1/matches/:appId/:matchKey', note: 'Single archived match' },
  { method: 'PUT/PATCH', path: '/admin/v1/matches/:appId/:matchKey', note: 'Operator edits' },
  { method: 'GET/POST/DELETE', path: '/admin/v1/api-keys', note: 'API key CRUD' },
] as const;

export function ApiMapPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Admin API map</h1>
        <p className="text-slate-500 text-sm mt-1">
          Implemented in timeline-scrapper · auth via Bearer or X-Scrapper-Admin-Key
        </p>
      </header>

      <div className="md:hidden space-y-3">
        {routes.map((r) => (
          <article key={r.path + r.method} className="glass rounded-xl p-4 border border-white/5 space-y-2">
            <div className="font-mono text-xs text-accent">{r.method}</div>
            <div className="font-mono text-sm text-slate-200 break-all">{r.path}</div>
            <p className="text-sm text-slate-400">{r.note}</p>
          </article>
        ))}
      </div>

      <div className="hidden md:block glass rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-white/5">
            <tr>
              <th className="p-3 w-24">Method</th>
              <th className="p-3">Path</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.path + r.method} className="border-b border-white/5">
                <td className="p-3 font-mono text-accent text-xs">{r.method}</td>
                <td className="p-3 font-mono text-slate-200">{r.path}</td>
                <td className="p-3 text-slate-400">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
