(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LP_PRODUCTION = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'wbraid', 'gbraid'];
  const japanDate = (date) => new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);

  const buildPayload = (values, metadata = {}) => {
    const now = metadata.now || new Date();
    const submissionId = metadata.submissionId || globalThis.crypto?.randomUUID?.()
      || `${now.getTime()}-${Math.random().toString(16).slice(2)}`;
    const electric = values.service.includes('電気');
    const gas = values.service.includes('ガス');
    const selectedServices = [electric ? '電気' : '', gas ? 'ガス' : ''].filter(Boolean).join(' / ');
    return {
      submissionId,
      receiptId: `MO-${japanDate(now).replace(/-/g, '')}-${submissionId.slice(0, 6).toUpperCase()}`,
      openingDate: values.date || '',
      openingDateDeferred: values.date ? 'no' : 'yes',
      prefectures: values.prefectures,
      name: values.name.trim(),
      phone: values.tel.trim(),
      email: values.mail.trim(),
      address: '電話でヒアリング',
      electric: electric ? '希望する' : '希望しない',
      gas: gas ? '希望する' : '希望しない',
      internetWifi: '希望しない',
      selectedServices,
      routeMode: metadata.routeMode || 'normal',
      pageUrl: metadata.pageUrl || '',
      landingPageUrl: metadata.landingPageUrl || '',
      referrer: metadata.referrer || '',
      ...Object.fromEntries(trackingKeys.map((key) => [key, metadata[key] || ''])),
      submittedAt: now.toISOString(),
    };
  };

  const submitLead = async (endpoint, payload, { fetchImpl = globalThis.fetch, timeoutMs = 15000 } = {}) => {
    if (!endpoint || new URL(endpoint).protocol !== 'https:') throw new Error('受付先が設定されていません。');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST', body: new URLSearchParams(payload), signal: controller.signal,
      });
      if (!response.ok) throw new Error('受付先への送信に失敗しました。');
      return { receiptId: payload.receiptId, selectedServices: payload.selectedServices };
    } finally {
      clearTimeout(timer);
    }
  };
  return { trackingKeys, japanDate, buildPayload, submitLead };
});
