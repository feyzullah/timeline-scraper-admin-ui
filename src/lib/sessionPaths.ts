export function sessionApiPath(appId: string, matchKey: string) {
  return `/admin/v1/sessions/${encodeURIComponent(appId)}/${encodeURIComponent(matchKey)}`;
}

export function sessionDetailHref(appId: string, matchKey: string) {
  return `detail?appId=${encodeURIComponent(appId)}&matchKey=${encodeURIComponent(matchKey)}`;
}

/** App-root path — safe from any route (fixtures list uses relative links that break under /fixtures). */
export function fixturesListHref() {
  return '/fixtures';
}

export function fixtureEditHref(appId: string, matchKey: string, source = 'session') {
  const qs = new URLSearchParams({
    appId,
    matchKey,
    source,
  });
  return `/fixtures/edit?${qs.toString()}`;
}
