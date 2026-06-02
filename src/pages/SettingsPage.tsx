import { Button } from '../components/Button';
import { defaultScrapperApiBase } from '../lib/appPaths';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, resetToDefaults, apiBaseFromServer } = useSettings();
  const { logout } = useAuth();

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Signed in with the scrapper admin key. Operator/settler keys are managed separately.
        </p>
      </header>

      <div className="glass rounded-xl p-6 space-y-5">
        {!apiBaseFromServer ? (
          <label className="block space-y-1.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Scrapper API base URL (dev)</span>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder={defaultScrapperApiBase()}
            />
          </label>
        ) : (
          <p className="text-sm text-slate-400">
            API base: <code className="text-accent/80">{apiBaseUrl}</code>
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="danger" onClick={logout}>
            Sign out
          </Button>
          {!apiBaseFromServer ? (
            <Button variant="ghost" onClick={resetToDefaults}>
              Reset dev defaults
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
