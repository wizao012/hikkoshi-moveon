/* Keep the selected new, current-contract, or temporary-use route across pages. */
(() => {
  'use strict';
  const storageKey = 'moveon-lp:contact-intent:v1';
  const root = document.documentElement;
  const routeModes = { current: 'other', temporary: 'temporary', new: 'normal' };
  const valid = (intent) => ['current', 'temporary', 'new'].includes(intent);
  let selectedIntent = null;
  const queryIntent = () => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get('contact');
    if (valid(intent)) return intent;
    const route = params.get('route');
    return ['normal', 'temporary', 'other'].includes(route)
      ? { normal: 'new', temporary: 'temporary', other: 'current' }[route] : null;
  };
  const storedIntent = () => {
    try {
      const intent = window.sessionStorage.getItem(storageKey);
      return valid(intent) ? intent : null;
    } catch (_) {
      return null;
    }
  };
  const apply = (intent) => {
    selectedIntent = valid(intent) ? intent : null;
    root.classList.toggle('is-current-contract', selectedIntent === 'current');
    root.classList.toggle('is-temporary-use', selectedIntent === 'temporary');
    const browser = window.LP_BROWSER;
    if (selectedIntent && browser?.attribution) {
      if (typeof browser.setRouteMode === 'function') browser.setRouteMode(routeModes[selectedIntent]);
      else browser.attribution.routeMode = routeModes[selectedIntent];
    }
  };
  const syncQuery = (intent) => {
    try {
      const current = new URL(window.location.href);
      let changed = false;
      if (current.searchParams.has('contact')) {
        current.searchParams.set('contact', intent);
        changed = true;
      }
      if (current.searchParams.has('route')) {
        current.searchParams.set('route', routeModes[intent]);
        changed = true;
      }
      if (changed) window.history.replaceState(window.history.state, '', current.pathname + current.search + current.hash);
    } catch (_) {}
  };
  const setIntent = (intent) => {
    if (!valid(intent)) return;
    apply(intent);
    try { window.sessionStorage.setItem(storageKey, intent); } catch (_) {}
    syncQuery(intent);
  };

  window.LP_CONTACT_ROUTE = {
    setIntent,
    isCurrent: () => root.classList.contains('is-current-contract'),
    getIntent: () => selectedIntent,
  };
  const initialQuery = queryIntent();
  if (initialQuery) setIntent(initialQuery);
  else apply(storedIntent());

  const bindLinks = () => {
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('[data-contract-contacts]')) setIntent('current');
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLinks, { once: true });
  } else {
    bindLinks();
  }
  // Restore the newest selection when a page returns from the back/forward cache.
  window.addEventListener('pageshow', () => {
    const stored = storedIntent();
    if (stored) setIntent(stored);
    else apply(queryIntent());
  });
})();
