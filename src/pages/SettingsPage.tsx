import { Button } from '../components/Button';
import { defaultScrapperApiBase } from '../lib/appPaths';
import { useSettings } from '../context/SettingsContext';

export function SettingsPage() {
  const {
    apiBaseUrl,
    adminApiKey,
    defaultAppId,
    setApiBaseUrl,
    setAdminApiKey,
    setDefaultAppId,
    resetToDefaults
  } = useSettings();

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Stored in browser localStorage</p>
      </header>

      <div className="glass rounded-xl p-6 space-y-5">
        <label className="block space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Scrapper API base URL</span>
          <input
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder={defaultScrapperApiBase()}
          />
          <span className="text-[10px] text-slate-600">
            Default: <code className="text-accent/70">{defaultScrapperApiBase()}</code> (same-origin proxy → scrapper). Use Reset if fetches fail.
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Admin API key</span>
          <input
            type="password"
            className="input-touch font-mono"
            value={adminApiKey}
            onChange={(e) => setAdminApiKey(e.target.value)}
            placeholder="SCRAPPER_ADMIN_API_KEY"
            autoComplete="off"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Default appId filter</span>
          <input
            className="input-touch font-mono"
            value={defaultAppId}
            onChange={(e) => setDefaultAppId(e.target.value)}
            placeholder="bububet"
          />
        </label>

        <Button variant="ghost" onClick={resetToDefaults}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
