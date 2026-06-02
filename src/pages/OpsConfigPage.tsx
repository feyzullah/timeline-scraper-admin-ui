import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useScrapperClient } from '../api/client';
import { Button } from '../components/Button';

type ConfigValue = { env: string; override: string | null; effective: string };
type SchemaEntry = {
  key: string;
  group: string;
  type: string;
  label: string;
  description: string;
};
type RuntimeSnapshot = {
  groups: { id: string; label: string; description: string }[];
  schema: SchemaEntry[];
  values: Record<string, ConfigValue>;
  overrides: Record<string, string>;
  providers: {
    circuits: {
      providerId: string;
      open: boolean;
      openUntilUtc: string | null;
      failureCount: number;
      cooldownMs: number;
    }[];
    queues: Record<
      string,
      { minIntervalMs: number; stats: { freshPending?: number; repeatPending?: number } | null }
    >;
  };
};

function ConfigField({
  entry,
  value,
  draft,
  onDraft,
}: {
  entry: SchemaEntry;
  value: ConfigValue;
  draft: string;
  onDraft: (v: string) => void;
}) {
  const overridden = value.override != null && value.override !== '';

  if (entry.type === 'boolean') {
    const checked = (draft || value.effective).toLowerCase() === 'true';
    return (
      <label className="flex items-center gap-3 text-sm min-h-11 py-1">
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-amber-400"
          checked={checked}
          onChange={(e) => onDraft(e.target.checked ? 'true' : 'false')}
        />
        <span className={overridden ? 'text-accent' : 'text-slate-300'}>{entry.label}</span>
      </label>
    );
  }

  if (entry.key.includes('FETCH_MODE')) {
    return (
      <label className="block space-y-1">
        <span className="text-xs text-slate-500">{entry.label}</span>
        <select
          className="select-touch font-mono"
          value={draft || value.effective}
          onChange={(e) => onDraft(e.target.value)}
        >
          <option value="browser">browser</option>
          <option value="fetch">fetch</option>
          <option value="auto">auto</option>
        </select>
      </label>
    );
  }

  return (
    <label className="block space-y-1">
      <span className="text-xs text-slate-500">{entry.label}</span>
      <input
        className={`input-touch font-mono ${overridden ? 'border-accent/40 text-accent' : ''}`}
        value={draft}
        placeholder={value.env || entry.description}
        onChange={(e) => onDraft(e.target.value)}
      />
      {overridden ? (
        <span className="text-[10px] text-slate-600">env: {value.env || '(unset)'}</span>
      ) : null}
    </label>
  );
}

export function OpsConfigPage() {
  const { get, patch, post, apiBaseUrl } = useScrapperClient();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const config = useQuery({
    queryKey: ['runtime-config', apiBaseUrl],
    queryFn: () => get<RuntimeSnapshot>('/admin/v1/runtime-config'),
    refetchInterval: 10_000,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: (patchBody: Record<string, string | null>) =>
      patch<{ snapshot: RuntimeSnapshot }>('/admin/v1/runtime-config', { patch: patchBody }),
    onSuccess: () => {
      setDrafts({});
      setMessage('Saved — effective immediately (browser headless applies after circuit/browser reset).');
      void queryClient.invalidateQueries({ queryKey: ['runtime-config'] });
    },
    onError: (e) => setMessage(String((e as Error).message)),
  });

  const resetCircuits = useMutation({
    mutationFn: (providerId?: string) =>
      post<{ snapshot: RuntimeSnapshot }>('/admin/v1/runtime-config/circuits/reset', {
        ...(providerId ? { providerId } : { all: true }),
      }),
    onSuccess: () => {
      setMessage('Circuit breaker state cleared.');
      void queryClient.invalidateQueries({ queryKey: ['runtime-config'] });
    },
  });

  const schemaByGroup = useMemo(() => {
    const map = new Map<string, SchemaEntry[]>();
    for (const entry of config.data?.schema || []) {
      if (!map.has(entry.group)) map.set(entry.group, []);
      map.get(entry.group)!.push(entry);
    }
    return map;
  }, [config.data?.schema]);

  const collectPatch = () => {
    const patchBody: Record<string, string | null> = {};
    for (const [key, draft] of Object.entries(drafts)) {
      if (draft === '') {
        patchBody[key] = null;
      } else if (draft !== undefined) {
        const current = config.data?.values[key]?.effective ?? '';
        if (draft !== current) patchBody[key] = draft;
      }
    }
    return patchBody;
  };

  if (config.error) {
    return (
      <p className="text-rose-300 text-sm">
        Cannot load runtime config. Is scrapper running with admin key? {String((config.error as Error).message)}
      </p>
    );
  }

  return (
    <div className="space-y-8 pb-24 sm:pb-0">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Ops tuning</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Ops values are stored in MongoDB when configured. On first boot, missing keys are copied from{' '}
            <code className="text-accent/80">.env</code> into the database; after that the DB is the source of
            truth. Reset a field to re-apply the current env value. No process restart required.
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setDrafts({});
              setMessage(null);
            }}
            disabled={Object.keys(drafts).length === 0}
          >
            Clear drafts
          </Button>
          <Button
            onClick={() => {
              const body = collectPatch();
              if (Object.keys(body).length === 0) {
                setMessage('No changes in draft fields.');
                return;
              }
              saveMutation.mutate(body);
            }}
            disabled={saveMutation.isPending}
          >
            Apply changes
          </Button>
        </div>
      </header>

      <div className="sm:hidden fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-20 glass border-t border-white/5 px-4 py-3 flex gap-2 safe-bottom">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => {
            setDrafts({});
            setMessage(null);
          }}
          disabled={Object.keys(drafts).length === 0}
        >
          Clear
        </Button>
        <Button
          className="flex-[2]"
          onClick={() => {
            const body = collectPatch();
            if (Object.keys(body).length === 0) {
              setMessage('No changes in draft fields.');
              return;
            }
            saveMutation.mutate(body);
          }}
          disabled={saveMutation.isPending}
        >
          Apply
        </Button>
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <section className="glass rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-medium text-white">Circuit breakers</h2>
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => resetCircuits.mutate(undefined)}>
            Reset all circuits
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(config.data?.providers.circuits || []).map((c) => (
            <div
              key={c.providerId}
              className={`rounded-lg border p-3 ${c.open ? 'border-rose-500/40 bg-rose-500/10' : 'border-white/10 bg-black/20'}`}
            >
              <div className="font-mono text-sm text-white">{c.providerId}</div>
              <div className={`text-xs mt-1 ${c.open ? 'text-rose-300' : 'text-emerald-400'}`}>
                {c.open ? `OPEN until ${c.openUntilUtc || '?'}` : 'closed'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                failures={c.failureCount} cooldown={c.cooldownMs}ms
              </div>
              {c.open ? (
                <button
                  type="button"
                  className="text-xs text-accent mt-2 hover:underline"
                  onClick={() => resetCircuits.mutate(c.providerId)}
                >
                  Reset
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-3">Queue depth (live)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
          {Object.entries(config.data?.providers.queues || {}).map(([id, q]) => (
            <div key={id} className="rounded bg-black/30 px-2 py-1.5 border border-white/5">
              <div className="text-slate-400">{id}</div>
              <div className="text-white">{q.minIntervalMs}ms gap</div>
              <div className="text-slate-600">
                f={q.stats?.freshPending ?? 0} r={q.stats?.repeatPending ?? 0}
              </div>
            </div>
          ))}
        </div>
      </section>

      {(config.data?.groups || []).map((group) => {
        const entries = schemaByGroup.get(group.id) || [];
        if (entries.length === 0) return null;
        return (
          <section key={group.id} className="glass rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-white">{group.label}</h2>
              <p className="text-xs text-slate-500">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry) => {
                const val = config.data?.values[entry.key];
                if (!val) return null;
                return (
                  <ConfigField
                    key={entry.key}
                    entry={entry}
                    value={val}
                    draft={drafts[entry.key] ?? val.effective}
                    onDraft={(v) => setDrafts((d) => ({ ...d, [entry.key]: v }))}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
