import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { defaultScrapperApiBase } from '../lib/appPaths';
import { useSettings } from '../context/SettingsContext';

export function SettingsPage() {
  const {
    apiBaseUrl,
    uiAccessKey,
    setApiBaseUrl,
    saveUiAccessKey,
    resetToDefaults,
    apiBaseFromServer
  } = useSettings();

  const [draftKey, setDraftKey] = useState(uiAccessKey);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    setDraftKey(uiAccessKey);
  }, [uiAccessKey]);

  const keyDirty = draftKey !== uiAccessKey;

  function handleSaveKey() {
    saveUiAccessKey(draftKey);
    setKeySaved(true);
    window.setTimeout(() => setKeySaved(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          {apiBaseFromServer
            ? 'API calls go to this UI server. You authenticate with the UI access key; the server uses a separate scraper key from k8s secrets.'
            : 'Dev: UI access key is saved to browser localStorage when you click Save.'}
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
            disabled={apiBaseFromServer}
            readOnly={apiBaseFromServer}
          />
          <span className="text-[10px] text-slate-600">
            {apiBaseFromServer ? (
              <>
                Browser → <code className="text-accent/70">{apiBaseUrl}</code>/admin/v1/… → UI server →{' '}
                <code className="text-accent/70">SCRAPPER_UPSTREAM</code>/admin/v1/….
              </>
            ) : (
              <>
                Dev default: <code className="text-accent/70">{defaultScrapperApiBase()}</code> (Vite proxy →
                scrapper).
              </>
            )}
          </span>
        </label>

        <div className="block space-y-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">UI access key</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              className="input-touch font-mono flex-1"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keyDirty) handleSaveKey();
              }}
              placeholder="ADMIN_UI_API_KEY"
              autoComplete="off"
            />
            <Button
              variant="primary"
              className="sm:w-auto w-full shrink-0"
              disabled={!keyDirty}
              onClick={handleSaveKey}
            >
              {keySaved ? 'Saved' : 'Save key'}
            </Button>
          </div>
          <span className="text-[10px] text-slate-600 block">
            {uiAccessKey
              ? 'Key saved in this browser. Must match ADMIN_UI_API_KEY in the admin-ui k8s secret.'
              : 'Required in prod. Copy ADMIN_UI_API_KEY from the timeline-scraper-admin-ui-env secret.'}
          </span>
        </div>

        <Button variant="ghost" onClick={resetToDefaults}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
