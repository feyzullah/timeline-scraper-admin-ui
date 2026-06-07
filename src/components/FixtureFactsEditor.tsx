import { useState } from 'react';
import type { FixtureEvent, FixtureFactsForm } from '../lib/factsForm';
import { formToFactsPayload } from '../lib/factsForm';
import { ScorePairInput } from './ScorePairInput';
import { Button } from './Button';

const STATUS_GROUPS: { label: string; options: string[] }[] = [
  { label: 'Not started', options: ['NS', 'TBD'] },
  { label: 'In play', options: ['1H', 'HT', '2H', 'LIVE', 'ET', 'BT', 'P', 'INT'] },
  { label: 'Finished', options: ['FT', 'AET', 'PEN', 'AOT', 'OT'] },
  { label: 'Other', options: ['PST', 'CANC', 'ABD', 'AWD', 'WO'] },
];

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

  const addGoal = () => {
    setForm((f) => ({
      ...f,
      events: [...f.events, { type: 'goal', team: 'home', minute: 0 }],
    }));
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
      return { ...f, events };
    });
  };

  const removeEvent = (index: number) => {
    setForm((f) => ({
      ...f,
      events: f.events.filter((_, i) => i !== index),
    }));
  };

  const applyFtFromGoals = () => {
    setForm((f) => ({
      ...f,
      fulltime: { ...f.goals },
      fixtureStatusShort: 'FT',
    }));
  };

  const applyHtFromFirstHalfGoals = () => {
    let home = 0;
    let away = 0;
    for (const e of form.events) {
      if (e.type !== 'goal' || e.minute > 45) continue;
      if (e.team === 'away') away += 1;
      else home += 1;
    }
    setForm((f) => ({
      ...f,
      halftime: { home, away },
      fixtureStatusShort: 'HT',
    }));
  };

  const setStatus = (fixtureStatusShort: string) => {
    setForm((f) => ({ ...f, fixtureStatusShort }));
  };

  const setHtMilestone = () => {
    setForm((f) => ({
      ...f,
      fixtureStatusShort: 'HT',
      halftime:
        f.halftime.home != null || f.halftime.away != null
          ? f.halftime
          : { ...f.goals },
    }));
  };

  const setFtMilestone = () => {
    setForm((f) => ({
      ...f,
      fixtureStatusShort: 'FT',
      fulltime: { ...f.goals },
    }));
  };

  const knownStatuses = new Set(STATUS_GROUPS.flatMap((g) => g.options));
  const extraStatus =
    form.fixtureStatusShort && !knownStatuses.has(form.fixtureStatusShort)
      ? form.fixtureStatusShort
      : null;

  return (
    <div className="space-y-8">
      <section className="glass rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-white">Match status & scores</h2>
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
          <ScorePairInput
            label={`Current / FT goals (${homeLabel} – ${awayLabel})`}
            value={form.goals}
            onChange={(goals) => setForm((f) => ({ ...f, goals }))}
          />
          <ScorePairInput
            label="Half-time (HT)"
            value={form.halftime}
            onChange={(halftime) => setForm((f) => ({ ...f, halftime }))}
          />
          <ScorePairInput
            label="Full-time (FT)"
            value={form.fulltime}
            onChange={(fulltime) => setForm((f) => ({ ...f, fulltime }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" type="button" onClick={() => setStatus('1H')}>
            Set 1H
          </Button>
          <Button variant="ghost" type="button" onClick={setHtMilestone}>
            Set HT
          </Button>
          <Button variant="ghost" type="button" onClick={() => setStatus('2H')}>
            Set 2H
          </Button>
          <Button variant="ghost" type="button" onClick={() => setStatus('LIVE')}>
            Set LIVE
          </Button>
          <Button variant="ghost" type="button" onClick={setFtMilestone}>
            Set FT
          </Button>
          <Button variant="ghost" type="button" onClick={applyFtFromGoals}>
            Copy goals → FT
          </Button>
          <Button variant="ghost" type="button" onClick={applyHtFromFirstHalfGoals}>
            HT from goals ≤45′
          </Button>
        </div>
      </section>

      <section className="glass rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-white">Timeline (goals & cards)</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" type="button" onClick={addGoal}>
              + Goal
            </Button>
            <Button variant="ghost" type="button" onClick={addCard}>
              + Card
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {form.events.length === 0 ? (
            <p className="text-sm text-slate-500">No events — add goals/cards or set HT/FT scores above.</p>
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
      </section>

      <section className="glass rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-white">Statistics</h2>
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
      </section>

      <div className="flex flex-col sm:flex-row gap-3 sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:static z-20 -mx-4 px-4 py-3 sm:mx-0 sm:px-0 sm:py-0 glass sm:!bg-transparent sm:!border-0 sm:!shadow-none lg:static">
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={saving}
          onClick={() => onSave(formToFactsPayload(form))}
        >
          {saving ? 'Saving…' : 'Save & push to settler'}
        </Button>
        <Button variant="ghost" type="button" className="w-full sm:w-auto" onClick={() => setForm(initial)}>
          Reset form
        </Button>
      </div>
    </div>
  );
}
