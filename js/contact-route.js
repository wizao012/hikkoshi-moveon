/* Keep current-contract visitors on the official Web contact route. */
(() => {
  'use strict';
  const storageKey = 'moveon-lp:contact-intent:v1';
  const root = document.documentElement;
  const valid = (intent) => intent === 'current' || intent === 'new';
  const queryIntent = () => {
    const intent = new URLSearchParams(window.location.search).get('contact');
    return valid(intent) ? intent : null;
  };
  const storedIntent = () => {
    try {
      const intent = window.sessionStorage.getItem(storageKey);
      return valid(intent) ? intent : null;
    } catch (_) {
      return null;
    }
  };
  const apply = (intent) => root.classList.toggle('is-current-contract', intent === 'current');
  const setIntent = (intent) => {
    if (!valid(intent)) return;
    apply(intent);
    try { window.sessionStorage.setItem(storageKey, intent); } catch (_) {}
  };

  window.LP_CONTACT_ROUTE = {
    setIntent,
    isCurrent: () => root.classList.contains('is-current-contract'),
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
  window.addEventListener('pageshow', () => apply(storedIntent() || queryIntent()));
})();
