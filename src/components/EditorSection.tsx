import type { ReactNode } from 'react';
import { Button } from './Button';

export function EditorSection({
  title,
  description,
  children,
  saving,
  saveLabel = 'Save section',
  onSave,
}: {
  title: string;
  description: string;
  children: ReactNode;
  saving: boolean;
  saveLabel?: string;
  onSave: () => void;
}) {
  return (
    <section className="glass rounded-xl p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-white">{title}</h2>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {children}
      <div className="pt-1 border-t border-white/5">
        <Button type="button" disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </div>
    </section>
  );
}
