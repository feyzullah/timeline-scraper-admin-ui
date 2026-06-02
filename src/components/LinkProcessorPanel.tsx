import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useScrapperClient } from '../api/client';
import { Button } from './Button';

type LinkProcessorResponse = {
  ok: boolean;
  error?: string;
  applied?: boolean;
  preview?: {
    processor: string;
    url: string;
    pageType: string;
    targetDate: string | null;
    extracted: {
      source: string;
      fulltime: { home: number; away: number };
      halftime?: { home: number; away: number };
      eventCount?: number;
    };
    facts: Record<string, unknown>;
    factsPatch: Record<string, unknown>;
    fillEmptyOnly: boolean;
  };
};

function scoreLine(label: string, pair?: { home: number; away: number } | null) {
  if (!pair) return null;
  return (
    <p className="text-sm text-slate-300">
      {label}: <span className="font-mono text-white">{pair.home} – {pair.away}</span>
    </p>
  );
}

type Props = {
  appId: string;
  matchKey: string;
  kickoffUtc?: string | null;
  onApplied?: () => void;
};

export function LinkProcessorPanel({ appId, matchKey, kickoffUtc, onApplied }: Props) {
  const { post } = useScrapperClient();
  const [url, setUrl] = useState('');
  const [fillEmptyOnly, setFillEmptyOnly] = useState(true);

  const preview = useMutation({
    mutationFn: () =>
      post<LinkProcessorResponse>('/admin/v1/link-processor', {
        url: url.trim(),
        appId,
        matchKey,
        apply: false,
        fillEmptyOnly,
        targetDate: kickoffUtc ? kickoffUtc.slice(0, 10) : undefined,
      }),
  });

  const apply = useMutation({
    mutationFn: () =>
      post<LinkProcessorResponse>('/admin/v1/link-processor', {
        url: url.trim(),
        appId,
        matchKey,
        apply: true,
        fillEmptyOnly,
        source: 'admin:scrapper-admin-ui',
        targetDate: kickoffUtc ? kickoffUtc.slice(0, 10) : undefined,
      }),
    onSuccess: (data) => {
      if (data.applied) onApplied?.();
    },
  });

  const result = apply.data || preview.data;
  const busy = preview.isPending || apply.isPending;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Process match link</h2>
        <p className="text-xs text-slate-500 mt-1">
          Paste an AiScore head-to-head or match URL. Scores are read for this fixture&apos;s kickoff
          date only — no search, no provider ladder.
        </p>
      </div>

      <input
        type="url"
        className="input-touch w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-100"
        placeholder="https://www.aiscore.com/head-to-head/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm text-slate-400">
        <input
          type="checkbox"
          checked={fillEmptyOnly}
          onChange={(e) => setFillEmptyOnly(e.target.checked)}
          className="rounded border-slate-600"
        />
        Fill empty fields only (do not overwrite existing scores)
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!url.trim() || busy}
          onClick={() => preview.mutate()}
        >
          {preview.isPending ? 'Processing…' : 'Preview'}
        </Button>
        <Button
          type="button"
          disabled={!url.trim() || busy || !preview.data?.ok}
          onClick={() => apply.mutate()}
        >
          {apply.isPending ? 'Applying…' : 'Apply to fixture'}
        </Button>
      </div>

      {(preview.error || apply.error) && (
        <p className="text-rose-300 text-sm">{String((preview.error || apply.error as Error).message)}</p>
      )}

      {result?.error && <p className="text-rose-300 text-sm">{result.error}</p>}

      {apply.isSuccess && result?.applied ? (
        <p className="text-emerald-400 text-sm">Applied. Session will notify settler if active.</p>
      ) : null}

      {result?.preview ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 space-y-2">
          <p className="text-xs text-slate-500">
            {result.preview.processor} · {result.preview.pageType}
            {result.preview.targetDate ? ` · ${result.preview.targetDate}` : ''}
            {result.preview.extracted?.source ? ` · ${result.preview.extracted.source}` : ''}
          </p>
          {scoreLine('Full time', result.preview.extracted?.fulltime)}
          {scoreLine('Half time', result.preview.extracted?.halftime)}
          {result.preview.extracted?.eventCount ? (
            <p className="text-sm text-slate-400">Goal events: {result.preview.extracted.eventCount}</p>
          ) : null}
          {!result.preview.factsPatch ||
          (Object.keys(result.preview.factsPatch).length === 0 && result.preview.fillEmptyOnly) ? (
            <p className="text-amber-300/90 text-sm">Nothing new to merge (existing facts already filled).</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
