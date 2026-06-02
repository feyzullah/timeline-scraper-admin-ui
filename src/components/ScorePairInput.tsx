import type { ScorePair } from '../lib/factsForm';

export function ScorePairInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ScorePair;
  onChange: (next: ScorePair) => void;
}) {
  return (
    <div className="w-full sm:w-auto">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="flex items-center gap-2 max-w-xs">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className="flex-1 min-w-0 w-20 sm:w-16 input-touch font-mono text-center"
          value={value.home ?? ''}
          onChange={(e) => onChange({ ...value, home: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="H"
        />
        <span className="text-slate-600 shrink-0">–</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className="flex-1 min-w-0 w-20 sm:w-16 input-touch font-mono text-center"
          value={value.away ?? ''}
          onChange={(e) => onChange({ ...value, away: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="A"
        />
      </div>
    </div>
  );
}
