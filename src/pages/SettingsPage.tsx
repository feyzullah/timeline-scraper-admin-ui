import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { defaultScrapperApiBase } from '../lib/appPaths';
import { useSettings } from '../context/SettingsContext';

export function SettingsPage() {
  const {
    apiBaseUrl,
    adminApiKey,
    setApiBaseUrl,
    saveAdminApiKey,
    resetToDefaults,
    serverManagedApi
  } = useSettings();

  const [draftKey, setDraftKey] = useState(adminApiKey);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    setDraftKey(adminApiKey);
  }, [adminApiKey]);

  const keyDirty = draftKey !== adminApiKey;

  function handleSaveKey() {
    saveAdminApiKey(draftKey);
    setKeySaved(true);
    window.setTimeout(() => setKeySaved(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          {serverManagedApi
            ? 'API URL and auth are set by the server (SCRAPPER_UPSTREAM secret).'
            : 'API key is saved to browser localStorage when you click Save.'}
        </p>
      </header>

      <div className="glass rounded-xl p-6 space-y-5">
        <label className="block space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Scrapper API base URL</span>
          <input
            className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm font-mono focus:border-accent/40 outline-none disabled:opacity-60"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder={defaultScrapperApiBase()}
            disabled={serverManagedApi}
            readOnly={serverManagedApi}
          />
          <span className="text-[10px] text-slate-600">
            {serverManagedApi ? (
              <>
                Proxied to <code className="text-accent/70">SCRAPPER_UPSTREAM</code> from k8s secret via{' '}
                <code className="text-accent/70">{apiBaseUrl}</code>.
              </>
            ) : (
              <>
                Default: <code className="text-accent/70">{defaultScrapperApiBase()}</code> (same-origin proxy →
                scrapper). Use Reset if fetches fail.
              </>
            )}
          </span>
        </label>

        <div className="block space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Admin API key</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              className="input-touch font-mono flex-1 disabled:opacity-60"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keyDirty && !serverManagedApi) handleSaveKey();
              }}
              placeholder={serverManagedApi ? 'Injected server-side' : 'SCRAPPER_ADMIN_API_KEY'}
              autoComplete="off"
              disabled={serverManagedApi}
            />
            {!serverManagedApi && (
              <Button
                variant="primary"
                className="sm:w-auto w-full shrink-0"
                disabled={!keyDirty}
                onClick={handleSaveKey}
              >
                {keySaved ? 'Saved' : 'Save key'}
              </Button>
            )}
          </div>
          {!serverManagedApi && (
            <span className="text-[10px] text-slate-600 block">
              {adminApiKey ? 'A key is saved in this browser.' : 'Enter your key and click Save key.'}
            </span>
          )}
        </div>

        <Button variant="ghost" onClick={resetToDefaults}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
