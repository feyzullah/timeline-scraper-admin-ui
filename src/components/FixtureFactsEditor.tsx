import { useState } from 'react';
import type { FixtureEvent, FixtureFactsForm } from '../lib/factsForm';
import {
  buildFulltimeFactsPatch,
  buildHalftimeFactsPatch,
  buildLiveGoalsFactsPatch,
  buildStatisticsFactsPatch,
  buildStatusFactsPatch,
  buildTimelineFactsPatch,
  syncGoalsFromEvents,
} from '../lib/factsForm';
import { ScorePairInput } from './ScorePairInput';
import { Button } from './Button';
import { EditorSection } from './EditorSection';

const STATUS_GROUPS: { label: string; options: string[] }[] = [
  { label: 'Not started', options: ['NS', 'TBD'] },
  { label: 'In play', options: ['1H', 'HT', '2H', 'LIVE', 'ET', 'BT', 'P', 'INT'] },
  { label: 'Finished', options: ['FT', 'AET', 'PEN', 'AOT', 'OT'] },
  { label: 'Other', options: ['PST', 'CANC', 'ABD', 'AWD', 'WO'] },
];

function formatPair(pair: { home: number | null; away: number | null }): string {
  if (pair.home == null && pair.away == null) return '—';
  return `${pair.home ?? '?'}–${pair.away ?? '?'}`;
}

export function FixtureFactsEditor({
  initial,
  homeLabel,
  awayLabel,
  saving,
  onSave,
}: {
  initial: FixtureFactsForm;
  homeLabel: string;
  awayLabel: string;
  saving: boolean;
  onSave: (facts: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<FixtureFactsForm>(initial);
  const [ftMarkFinished, setFtMarkFinished] = useState(true);

  const addGoal = () => {
    setForm((f) =>
      syncGoalsFromEvents({
        ...f,
        events: [...f.events, { type: 'goal', team: 'home', minute: 0 }],
      }),
    );
  };

  const addCard = () => {
    setForm((f) => ({
      ...f,
      events: [...f.events, { type: 'card', team: 'home', minute: 0, cardType: 'yellow' }],
    }));
  };

  const updateEvent = (index: number, next: FixtureEvent) => {
    setForm((f) => {
      const events = [...f.events];
      events[index] = next;
      return syncGoalsFromEvents({ ...f, events });
    });
  };

  const removeEvent = (index: number) => {
    setForm((f) =>
      syncGoalsFromEvents({
        ...f,
        events: f.events.filter((_, i) => i !== index),
      }),
    );
  };

  const setStatus = (fixtureStatusShort: string) => {
    setForm((f) => ({ ...f, fixtureStatusShort }));
  };

  const knownStatuses = new Set(STATUS_GROUPS.flatMap((g) => g.options));
  const extraStatus =
    form.fixtureStatusShort && !knownStatuses.has(form.fixtureStatusShort)
      ? form.fixtureStatusShort
      : null;

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-4 text-xs text-slate-500 space-y-1">
        <p>
          <span className="text-slate-400">Loaded snapshot:</span>{' '}
          status <span className="font-mono text-slate-300">{form.fixtureStatusShort || '—'}</span>
          {' · '}
          live <span className="font-mono text-slate-300">{formatPair(form.goals)}</span>
          {' · '}
          HT <span className="font-mono text-slate-300">{formatPair(form.halftime)}</span>
          {' · '}
          FT <span className="font-mono text-slate-300">{formatPair(form.fulltime)}</span>
        </p>
        <p>Each block saves independently — only the fields in that section are sent to the scrapper.</p>
      </div>

      <EditorSection
        title="1. Match status (phase)"
        description="Set lifecycle only: NS, 1H, HT, 2H, LIVE, FT, etc. Does not change scores, HT/FT rows, or the timeline."
        saving={saving}
        saveLabel="Save status only"
        onSave={() => onSave(buildStatusFactsPatch(form.fixtureStatusShort))}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <label className="space-y-1.5 w-full">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
            <select
              className="select-touch font-mono"
              value={form.fixtureStatusShort}
              onChange={(e) => setForm((f) => ({ ...f, fixtureStatusShort: e.target.value }))}
            >
              {STATUS_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
              ))}
              {extraStatus ? (
                <optgroup label="Current">
                  <option value={extraStatus}>{extraStatus}</option>
                </optgroup>
              ) : null}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" type="button" onClick={() => setStatus('1H')}>
            1H
          </Button>
          <Button variant="ghost" type="button" onClick={() => setStatus('HT')}>
            HT
          </Button>
          <Button variant="ghost" type="button" onClick={() => setStatus('2H')}>
            2H
          </Button>
          <Button variant="ghost" type="button" onClick={() => setStatus('LIVE')}>
            LIVE
          </Button>
          <Button variant="ghost" type="button" onClick={() => setStatus('FT')}>
            FT
          </Button>
          <Button variant="ghost" type="button" onClick={() => setStatus('AET')}>
            AET
          </Button>
        </div>
      </EditorSection>

      <EditorSection
        title="2. Half-time score"
        description="Set score.halftime only — useful for HT-period markets (ht_ou, ht1x2, …) while the match is still live. Does not change match status or FT row."
        saving={saving}
        saveLabel="Save HT score only"
        onSave={() => onSave(buildHalftimeFactsPatch(form.halftime))}
      >
        <ScorePairInput
          label={`Half-time (${homeLabel} – ${awayLabel})`}
          value={form.halftime}
          onChange={(halftime) => setForm((f) => ({ ...f, halftime }))}
        />
      </EditorSection>

      <EditorSection
        title="3. Full-time score"
        description="Set the final score row and sync goals from it. Use when you know the result but not the full timeline. Optionally mark the match as FT in the same save."
        saving={saving}
        saveLabel="Save FT score"
        onSave={() =>
          onSave(buildFulltimeFactsPatch(form.fulltime, { markFinished: ftMarkFinished }))
        }
      >
        <ScorePairInput
          label={`Full-time (${homeLabel} – ${awayLabel})`}
          value={form.fulltime}
          onChange={(fulltime) => setForm((f) => ({ ...f, fulltime }))}
        />
        <label className="flex items-start gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 rounded border-white/20 bg-black/30"
            checked={ftMarkFinished}
            onChange={(e) => setFtMarkFinished(e.target.checked)}
          />
          <span>
            Also set status to <span className="font-mono text-slate-300">FT</span> (recommended for
            1x2 and other full-match markets)
          </span>
        </label>
      </EditorSection>

      <EditorSection
        title="4. Current / live score"
        description="Set goals only when you know the running total but do not have a full goal timeline. Does not clear events or HT/FT rows."
        saving={saving}
        saveLabel="Save live score only"
        onSave={() => onSave(buildLiveGoalsFactsPatch(form.goals))}
      >
        <ScorePairInput
          label={`Current goals (${homeLabel} – ${awayLabel})`}
          value={form.goals}
          onChange={(goals) => setForm((f) => ({ ...f, goals }))}
        />
      </EditorSection>

      <EditorSection
        title="5. Timeline (goals & cards)"
        description="Full event list with minutes. Updates events and derives goals from goal rows. Does not change status or HT/FT score rows unless you edit those sections."
        saving={saving}
        saveLabel="Save timeline"
        onSave={() => onSave(buildTimelineFactsPatch(form.events))}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" type="button" onClick={addGoal}>
            + Goal
          </Button>
          <Button variant="ghost" type="button" onClick={addCard}>
            + Card
          </Button>
        </div>
        <div className="space-y-2">
          {form.events.length === 0 ? (
            <p className="text-sm text-slate-500">No events yet.</p>
          ) : null}
          {form.events.map((ev, i) => (
            <div
              key={`${ev.type}-${i}`}
              className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-black/20 border border-white/5"
            >
              <span className="text-[10px] uppercase text-slate-500 w-12 shrink-0">{ev.type}</span>
              <input
                type="number"
                min={0}
                max={130}
                inputMode="numeric"
                className="w-16 min-h-11 rounded-lg bg-black/30 border border-white/10 px-2 py-2 text-base sm:text-sm font-mono"
                value={ev.minute}
                onChange={(e) =>
                  updateEvent(i, { ...ev, minute: Number(e.target.value) || 0 } as FixtureEvent)
                }
              />
              <span className="text-slate-600 text-xs">′</span>
              <select
                className="min-h-11 flex-1 min-w-[7rem] select-touch py-2"
                value={ev.team}
                onChange={(e) =>
                  updateEvent(i, {
                    ...ev,
                    team: e.target.value === 'away' ? 'away' : 'home',
                  } as FixtureEvent)
                }
              >
                <option value="home">{homeLabel}</option>
                <option value="away">{awayLabel}</option>
              </select>
              {ev.type === 'card' ? (
                <select
                  className="min-h-11 select-touch py-2"
                  value={ev.cardType}
                  onChange={(e) =>
                    updateEvent(i, {
                      ...ev,
                      cardType: e.target.value === 'red' ? 'red' : 'yellow',
                    })
                  }
                >
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                </select>
              ) : null}
              <button
                type="button"
                className="ml-auto min-h-11 px-3 text-sm text-rose-400 hover:text-rose-300 active:bg-rose-500/10 rounded-lg"
                onClick={() => removeEvent(i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection
        title="6. Statistics"
        description="Corners and cards only — for corner_total / card_total legs."
        saving={saving}
        saveLabel="Save statistics"
        onSave={() => onSave(buildStatisticsFactsPatch(form.statistics))}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ScorePairInput
            label="Corners"
            value={{
              home: form.statistics.homeCorners ?? null,
              away: form.statistics.awayCorners ?? null,
            }}
            onChange={(p) =>
              setForm((f) => ({
                ...f,
                statistics: { ...f.statistics, homeCorners: p.home, awayCorners: p.away },
              }))
            }
          />
          <ScorePairInput
            label="Yellow cards"
            value={{
              home: form.statistics.homeYellow ?? null,
              away: form.statistics.awayYellow ?? null,
            }}
            onChange={(p) =>
              setForm((f) => ({
                ...f,
                statistics: { ...f.statistics, homeYellow: p.home, awayYellow: p.away },
              }))
            }
          />
          <ScorePairInput
            label="Red cards"
            value={{
              home: form.statistics.homeRed ?? null,
              away: form.statistics.awayRed ?? null,
            }}
            onChange={(p) =>
              setForm((f) => ({
                ...f,
                statistics: { ...f.statistics, homeRed: p.home, awayRed: p.away },
              }))
            }
          />
        </div>
      </EditorSection>

      <div className="flex flex-col sm:flex-row gap-3 pb-2">
        <Button variant="ghost" type="button" className="w-full sm:w-auto" onClick={() => setForm(initial)}>
          Reset all sections
        </Button>
      </div>
    </div>
  );
}
