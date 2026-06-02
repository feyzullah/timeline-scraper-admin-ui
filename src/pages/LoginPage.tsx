import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

export function LoginPage() {
  const { login } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(key);
    } catch (err) {
      setError(String((err as Error).message || 'Sign in failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-6 bg-surface-950">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gradient">Scrapper Admin</h1>
          <p className="text-slate-500 text-sm">Admin API key required</p>
        </header>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-5 border border-white/5">
          <label className="block space-y-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">SCRAPPER_ADMIN_API_KEY</span>
            <input
              type="password"
              className="input-touch font-mono w-full"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin bootstrap key"
              autoComplete="current-password"
              autoFocus
              disabled={busy}
            />
          </label>

          {error ? <p className="text-rose-300 text-sm">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={busy || !key.trim()}>
            {busy ? 'Checking…' : 'Sign in'}
          </Button>

          <p className="text-[10px] text-slate-600 leading-relaxed">
            Operator keys (settler WebSocket) cannot sign in here. Manage them after login under Operator keys.
          </p>
        </form>
      </div>
    </div>
  );
}
