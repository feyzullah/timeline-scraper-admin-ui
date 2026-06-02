import type { ButtonHTMLAttributes, ReactNode } from 'react';

const variants = {
  primary: 'bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30',
  ghost: 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10',
  danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
} as const;

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 min-h-11 text-sm font-medium transition disabled:opacity-40 active:scale-[0.98] ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
