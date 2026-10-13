(() => {
  'use strict';
  const config = window.LP_CONFIG || {};
  const runtime = window.LP_PRODUCTION;
  if (!runtime) return;
  const attributionKey = 'moveon-lp:attribution:v1';
  const receiptKey = 'moveon-lp:receipt:v1';
  const current = new URL(window.location.href);
  const read = (key) => {
    try { return JSON.parse(window.sessionStorage.getItem(key)); } catch (_) { return null; }
  };
  const write = (key, value) => {
    try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };
  const previous = read(attributionKey);
  const newCampaign = runtime.trackingKeys.some((key) => current.searchParams.has(key));
  const externalReferrer = document.referrer && !document.referrer.startsWith(current.origin + '/');
  const validRoute = ['normal', 'temporary', 'other'].includes(current.searchParams.get('route'));
  const attribution = !previous || newCampaign || externalReferrer
    ? {
      landingPageUrl: current.href, referrer: document.referrer,
      routeMode: validRoute ? current.searchParams.get('route') : 'normal',
      ...Object.fromEntries(runtime.trackingKeys.map((key) => [key, current.searchParams.get(key) || ''])),
    } : previous;
  if (validRoute) attribution.routeMode = current.searchParams.get('route');
  write(attributionKey, attribution);
  window.LP_BROWSER = {
    attribution,
    onProductionHost: (config.allowedHosts || []).includes(window.location.hostname),
    saveReceipt: (receipt) => write(receiptKey, receipt),
    record: (event, details) => {
      if (!(config.allowedHosts || []).includes(window.location.hostname)) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, ...details });
    },
    recordAndWait: (event, details) => {
      if (!(config.allowedHosts || []).includes(window.location.hostname)) return Promise.resolve();
      return new Promise((resolve) => {
        let complete = false;
        const finish = () => {
          if (complete) return;
          complete = true;
          clearTimeout(fallback);
          resolve();
        };
        const fallback = setTimeout(finish, 1600);
        try {
          window.LP_BROWSER.record(event, { ...details, eventCallback: finish, eventTimeout: 1500 });
        } catch (_) {
          finish();
        }
      });
    },
  };

  const receiptContainer = document.querySelector('[data-receipt-container]');
  if (receiptContainer) {
    const receipt = read(receiptKey);
    if (receipt) {
      document.querySelector('.thanks-page__title').textContent = 'お申し込みを受け付けました';
      document.querySelector('.thanks-page__txt').textContent = '担当者より、ご入力いただいた連絡先へ順次ご連絡します。';
      document.querySelector('[data-receipt-id]').textContent = receipt.receiptId;
      document.querySelector('[data-receipt-services]').textContent = receipt.selectedServices;
      receiptContainer.hidden = false;
    }
  }
})();
