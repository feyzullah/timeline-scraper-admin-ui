import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import type { ArchivedMatchDoc, MatchSessionDoc } from '../api/types';
import { ScrapperApiError, useScrapperClient } from '../api/client';
import { FixtureFactsEditor } from '../components/FixtureFactsEditor';
import { LinkProcessorPanel } from '../components/LinkProcessorPanel';
import { JsonView } from '../components/JsonView';
import { factsToForm } from '../lib/factsForm';

function sessionPath(appId: string, matchKey: string) {
  return `/admin/v1/sessions/${encodeURIComponent(appId)}/${encodeURIComponent(matchKey)}`;
}

function matchPath(appId: string, matchKey: string) {
  return `/admin/v1/matches/${encodeURIComponent(appId)}/${encodeURIComponent(matchKey)}`;
}

export function FixtureEditPage() {
  const [params] = useSearchParams();
  const appId = params.get('appId') || '';
  const matchKey = params.get('matchKey') || '';
  const source = params.get('source') || 'session';
  const { get, patch } = useScrapperClient();
  const queryClient = useQueryClient();

  const doc = useQuery({
    queryKey: ['fixture-doc', appId, matchKey, source],
    queryFn: async () => {
      if (!appId || !matchKey) throw new Error('appId and matchKey required');
      if (source === 'archived') {
        return get<ArchivedMatchDoc>(matchPath(appId, matchKey));
      }
      try {
        return await get<MatchSessionDoc>(sessionPath(appId, matchKey));
      } catch (e) {
        if (e instanceof ScrapperApiError && e.status === 404) {
          return get<ArchivedMatchDoc>(matchPath(appId, matchKey));
        }
        throw e;
      }
    },
    enabled: Boolean(appId && matchKey),
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (facts: Record<string, unknown>) => {
      const body = {
        source: 'admin:scrapper-admin-ui',
        patch: { facts },
      };
      const isSession =
        source === 'session' ||
        (doc.data && 'lastMergedSnapshot' in doc.data && Array.isArray((doc.data as MatchSessionDoc).requests));
      if (isSession) {
        return patch<MatchSessionDoc>(sessionPath(appId, matchKey), body);
      }
      return patch<ArchivedMatchDoc>(matchPath(appId, matchKey), body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      void queryClient.invalidateQueries({ queryKey: ['fixture-doc', appId, matchKey] });
    },
  });

  const book = doc.data?.fixtureBook;
  const facts =
    (doc.data as MatchSessionDoc)?.lastMergedSnapshot ||
    (doc.data as ArchivedMatchDoc)?.facts ||
    null;

  if (!appId || !matchKey) {
    return (
      <p className="text-slate-500">
        Missing <code className="text-accent">appId</code> or <code className="text-accent">matchKey</code>.{' '}
        <Link to="/fixtures" className="text-accent underline">
          Back to list
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to="/fixtures" className="text-xs text-accent hover:underline">
          ← Fixtures
        </Link>
        <h1 className="page-title mt-2">
          {book?.homeTeam || '—'} vs {book?.awayTeam || '—'}
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-mono break-all">{matchKey}</p>
        <p className="text-xs text-slate-600 mt-1">
          appId={appId} · source={source}
          {doc.data && 'cursor' in doc.data ? ` · cursor=${(doc.data as MatchSessionDoc).cursor}` : ''}
        </p>
      </header>

      {doc.error ? (
        <p className="text-rose-300 text-sm">{String((doc.error as Error).message)}</p>
      ) : null}

      {saveMutation.isSuccess ? (
        <p className="text-emerald-400 text-sm">Saved. Active sessions will queue match_update to settler.</p>
      ) : null}
      {saveMutation.error ? (
        <p className="text-rose-300 text-sm">{String((saveMutation.error as Error).message)}</p>
      ) : null}

      {doc.isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <LinkProcessorPanel
          appId={appId}
          matchKey={matchKey}
          kickoffUtc={book?.kickoffUtc}
          onApplied={() => {
            void queryClient.invalidateQueries({ queryKey: ['fixture-doc', appId, matchKey] });
            void queryClient.invalidateQueries({ queryKey: ['fixtures'] });
          }}
        />
      )}

      {doc.isLoading ? null : facts || doc.data ? (
        <FixtureFactsEditor
          key={`${appId}:${matchKey}:${doc.dataUpdatedAt}`}
          initial={factsToForm(facts as Record<string, unknown>)}
          homeLabel={book?.homeTeam || 'Home'}
          awayLabel={book?.awayTeam || 'Away'}
          saving={saveMutation.isPending}
          onSave={(payload) => saveMutation.mutate(payload)}
        />
      ) : null}

      <details className="glass rounded-xl p-4">
        <summary className="text-sm text-slate-400 cursor-pointer">Raw document</summary>
        <JsonView data={doc.data} className="mt-3" />
      </details>
    </div>
  );
}
