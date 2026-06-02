import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useScrapperClient } from '../api/client';
import { Button } from '../components/Button';

type OperatorKeyRow = {
  id: string;
  label: string;
  role: string;
  keyPreview: string;
  createdAt: string;
  lastUsedAt: string | null;
};

type OperatorKeyCreated = {
  _id: string;
  key: string;
  label: string;
  role: string;
  createdAt: string;
};

export function OperatorKeysPage() {
  const { get, post, del, apiBaseUrl } = useScrapperClient();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');
  const [createdKey, setCreatedKey] = useState<OperatorKeyCreated | null>(null);

  const keys = useQuery({
    queryKey: ['operator-keys', apiBaseUrl],
    queryFn: () => get<{ items: OperatorKeyRow[] }>('/admin/v1/operator-keys'),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (nextLabel: string) =>
      post<OperatorKeyCreated>('/admin/v1/operator-keys', { label: nextLabel }),
    onSuccess: (data) => {
      setCreatedKey(data);
      setLabel('');
      void queryClient.invalidateQueries({ queryKey: ['operator-keys'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => del<{ revoked: boolean }>(`/admin/v1/operator-keys/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['operator-keys'] });
    },
  });

  const items = keys.data?.items ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Operator keys</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Keys in MongoDB <code className="text-accent/80">api_keys</code> for settler WebSocket auth. They cannot
          access this admin UI or change provider settings.
        </p>
      </header>

      {keys.error ? (
        <p className="text-rose-300 text-sm">{String((keys.error as Error).message)}</p>
      ) : null}

      <section className="glass rounded-xl p-5 space-y-4 max-w-xl">
        <h2 className="text-sm font-medium text-white">Create key</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input-touch flex-1"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label e.g. settler-prod-1"
          />
          <Button
            disabled={!label.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate(label.trim())}
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
        {createMutation.error ? (
          <p className="text-rose-300 text-sm">{String((createMutation.error as Error).message)}</p>
        ) : null}
        {createdKey ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
            <p className="text-xs text-emerald-300">Copy now — shown once:</p>
            <code className="block text-sm font-mono break-all text-white">{createdKey.key}</code>
          </div>
        ) : null}
      </section>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-white/5">
            <tr>
              <th className="p-3 font-medium">Label</th>
              <th className="p-3 font-medium">Key</th>
              <th className="p-3 font-medium">Created</th>
              <th className="p-3 font-medium">Last used</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-white/5">
                <td className="p-3">{row.label}</td>
                <td className="p-3 font-mono text-xs text-slate-400">{row.keyPreview}</td>
                <td className="p-3 text-xs text-slate-500">{row.createdAt}</td>
                <td className="p-3 text-xs text-slate-500">{row.lastUsedAt || '—'}</td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    className="text-xs text-rose-300 hover:underline"
                    disabled={revokeMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Revoke key "${row.label}"?`)) {
                        revokeMutation.mutate(row.id);
                      }
                    }}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {!keys.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No operator keys
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
