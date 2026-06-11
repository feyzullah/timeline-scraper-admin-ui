import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { stripAppBasePath } from '../lib/appPaths';
import { useSettings } from '../context/SettingsContext';

const nav = [
  { to: '.', label: 'Dashboard', icon: '◆', end: true },
  { to: 'fixtures', label: 'Fixtures', icon: '⚽' },
  { to: 'sessions', label: 'Sessions', icon: '▣' },
  { to: 'requests', label: 'Requests', icon: '◎' },
  { to: 'connections', label: 'Connections', icon: '⇄' },
  { to: 'operator-keys', label: 'Operator keys', icon: '🔑' },
  { to: 'ops', label: 'Ops tuning', icon: '⚡' },
  { to: 'settings', label: 'Settings', icon: '⚙' },
] as const;

const bottomNav = [
  { to: '.', label: 'Home', icon: '◆', end: true },
  { to: 'fixtures', label: 'Fixtures', icon: '⚽', end: false },
  { to: 'ops', label: 'Ops', icon: '⚡', end: false },
] as const;

function navLinkClass(isActive: boolean) {
  return [
    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors min-h-11',
    isActive
      ? 'bg-accent/10 text-accent shadow-inset border border-accent/20'
      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 active:bg-white/10',
  ].join(' ');
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { apiBaseUrl } = useSettings();

  return (
    <>
      <div className="p-4 border-b border-white/5">
        <div className="font-semibold text-lg tracking-tight text-gradient">Scrapper</div>
        <div className="text-[10px] font-mono text-slate-500 mt-1 truncate" title={apiBaseUrl}>
          {apiBaseUrl}
        </div>
        <div className="text-[10px] text-slate-600 mt-1">Admin</div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <span className="w-5 text-center opacity-70 shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 text-[10px] text-slate-600 border-t border-white/5 shrink-0">
        timeline-scrapper · /admin/v1
      </div>
    </>
  );
}

export function Layout() {
  const { apiBaseUrl } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const appPath = stripAppBasePath(location.pathname);
  const menuActive = !bottomNav.some((item) =>
    item.end ? appPath === '/' : appPath === `/${item.to}` || appPath.startsWith(`/${item.to}/`)
  );

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-white/5 bg-surface-900/90 backdrop-blur flex-col">
        <SidebarContent />
      </aside>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(100vw-2.5rem,18rem)] flex flex-col border-r border-white/10 bg-surface-900 shadow-2xl lg:hidden safe-top safe-bottom">
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </aside>
        </>
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-white/5 safe-top shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              type="button"
              className="touch-target rounded-lg text-slate-300 hover:bg-white/10"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gradient truncate leading-tight">Scrapper</div>
              <div className="text-[10px] font-mono text-slate-500 truncate">{apiBaseUrl}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-white/5 safe-bottom"
          aria-label="Primary"
        >
          <div className="grid grid-cols-4">
            {bottomNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center justify-center gap-0.5 py-2 min-h-[3.25rem] text-[10px] font-medium transition-colors',
                    isActive ? 'text-accent' : 'text-slate-500 active:bg-white/5',
                  ].join(' ')
                }
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={[
                'flex flex-col items-center justify-center gap-0.5 py-2 min-h-[3.25rem] text-[10px] font-medium transition-colors',
                menuActive ? 'text-accent' : 'text-slate-500 active:bg-white/5',
              ].join(' ')}
            >
              <span className="text-base leading-none">⋯</span>
              More
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
