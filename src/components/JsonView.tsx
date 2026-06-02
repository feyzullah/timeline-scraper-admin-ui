export function JsonView({ data, className = '' }: { data: unknown; className?: string }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <pre
      className={`font-mono text-xs leading-relaxed text-slate-300 bg-black/40 rounded-xl p-4 overflow-auto max-h-[70vh] border border-white/5 ${className}`}
    >
      {text}
    </pre>
  );
}
