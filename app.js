(() => {
  'use strict';

  const routeDialog = document.getElementById('route-dialog');
  const openRouteButtons = document.querySelectorAll('[data-open-route]');
  const closeRouteButton = routeDialog?.querySelector('.modal-close');
  const applyRouteButton = routeDialog?.querySelector('[data-route-apply]');
  const temporaryRouteLink = routeDialog?.querySelector('[data-route-temporary]');
  const otherInquiryLink = document.querySelector('[data-route-other]');
  const currentRouteLink = routeDialog?.querySelector('[data-route-current]');
  const priorityPopup = document.getElementById('priority-popup');
  const closePriorityButton = document.querySelector('[data-close-priority]');
  const routeStorageKey = 'moveon-html:route:v1';
  const routeCookieName = 'moveon_html_route';
  const routeCookiePath = new URL('.', document.baseURI).pathname;
  const validRouteModes = new Set(['normal', 'temporary', 'other']);
  const navigationEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
  const isReloadNavigation = navigationEntry?.type === 'reload'
    || window.performance?.navigation?.type === 1;
  if (isReloadNavigation) {
    window.history.scrollRestoration = 'manual';
    const cleanReloadUrl = new URL(window.location.href);
    cleanReloadUrl.searchParams.delete('route');
    cleanReloadUrl.hash = '';
    window.history.replaceState(null, '', cleanReloadUrl);
  }
  let activeRouteMode = 'normal';
  let priorityShowTimer;
  let priorityDismissed = false;

  const normalizeRouteMode = (value) => validRouteModes.has(value) ? value : 'normal';

  const readCookie = (name) => {
    const row = (document.cookie || '').split('; ').find((entry) => entry.startsWith(`${name}=`));
    return row ? decodeURIComponent(row.slice(name.length + 1)) : '';
  };

  const getRouteMode = () => {
    const queryMode = new URLSearchParams(window.location.search).get('route');
    if (validRouteModes.has(queryMode)) return queryMode;
    try {
      const storedMode = window.sessionStorage?.getItem(routeStorageKey);
      if (validRouteModes.has(storedMode)) return storedMode;
    } catch (_) {}
    try {
      const cookieMode = readCookie(routeCookieName);
      if (validRouteModes.has(cookieMode)) return cookieMode;
    } catch (_) {}
    return 'normal';
  };

  const hidePriorityPopup = () => {
    window.clearTimeout(priorityShowTimer);
    priorityPopup?.classList.remove('is-visible');
    window.setTimeout(() => {
      if (priorityPopup && !priorityPopup.classList.contains('is-visible')) priorityPopup.hidden = true;
    }, 220);
  };

  const schedulePriorityPopup = () => {
    hidePriorityPopup();
    if (priorityDismissed || activeRouteMode !== 'normal') return;
    if (document.querySelector('dialog[open]')) return;
    priorityShowTimer = window.setTimeout(() => {
      if (priorityDismissed || activeRouteMode !== 'normal' || document.querySelector('dialog[open]')) return;
      if (!priorityPopup) return;
      priorityPopup.hidden = false;
      window.requestAnimationFrame(() => priorityPopup.classList.add('is-visible'));
    }, 300);
  };

  const setRouteMode = (requestedMode) => {
    const mode = normalizeRouteMode(requestedMode);
    const previousMode = activeRouteMode;
    activeRouteMode = mode;
    try {
      if (mode === 'normal') window.sessionStorage?.removeItem(routeStorageKey);
      else window.sessionStorage?.setItem(routeStorageKey, mode);
    } catch (_) {}
    try {
      document.cookie = mode === 'normal'
        ? `${routeCookieName}=; path=${routeCookiePath}; max-age=0; SameSite=Lax`
        : `${routeCookieName}=${encodeURIComponent(mode)}; path=${routeCookiePath}; max-age=86400; SameSite=Lax`;
    } catch (_) {}
    const url = new URL(window.location.href);
    if (mode === 'normal') url.searchParams.delete('route');
    else url.searchParams.set('route', mode);
    window.history.replaceState(null, '', url);
    document.body.dataset.routeMode = mode;
    document.body.classList.toggle('temporary-mode', mode === 'temporary');
    document.body.classList.toggle('web-primary-mode', mode !== 'normal');
    if (mode !== 'normal') hidePriorityPopup();
    else {
      if (previousMode !== 'normal') priorityDismissed = false;
      schedulePriorityPopup();
    }
  };

  const openRouteDialog = () => {
    hidePriorityPopup();
    if (routeDialog && !routeDialog.open) routeDialog.showModal();
  };

  openRouteButtons.forEach((button) => button.addEventListener('click', openRouteDialog));
  closeRouteButton?.addEventListener('click', () => routeDialog.close());
  routeDialog?.addEventListener('click', (event) => {
    if (event.target === routeDialog) routeDialog.close();
  });
  applyRouteButton?.addEventListener('click', () => {
    setRouteMode('normal');
    routeDialog.close();
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  temporaryRouteLink?.addEventListener('click', () => {
    setRouteMode('temporary');
    routeDialog.close();
  });
  otherInquiryLink?.addEventListener('click', () => setRouteMode('other'));
  currentRouteLink?.addEventListener('click', () => {
    setRouteMode('other');
    routeDialog.close();
  });
  closePriorityButton?.addEventListener('click', () => {
    priorityDismissed = true;
    hidePriorityPopup();
  });
  routeDialog?.addEventListener('close', schedulePriorityPopup);

  const form = document.getElementById('application-form');
  const dateInput = document.getElementById('opening-date');
  const phoneInput = document.getElementById('phone');
  const notice = document.getElementById('form-notice');
  const submitButton = form?.querySelector('.submit-button');
  let formSubmitted = false;
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];

  document.querySelectorAll('[data-service-select]').forEach((link) => {
    link.addEventListener('click', () => {
      const service = link.dataset.serviceSelect;
      const option = form?.querySelector(`input[type="checkbox"][name="${service}"]`);
      if (option && !option.disabled) option.checked = true;
    });
  });

  document.querySelectorAll('[data-service-bundle]').forEach((link) => {
    link.addEventListener('click', () => {
      ['gas', 'internet'].forEach((name) => {
        const option = form?.querySelector(`input[type="checkbox"][name="${name}"]`);
        if (option && !option.disabled) option.checked = true;
      });
    });
  });

  if (dateInput) dateInput.min = localToday;

  const messages = {
    'opening-date': '本日以降の開通希望日を選択してください。',
    name: 'お名前を入力してください。',
    address: '引越し先住所を入力してください。'
  };

  const setFieldState = (field, message = '') => {
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    const error = document.getElementById(`${field.id}-error`);
    if (error) error.textContent = message;
  };

  const validatePhone = () => {
    const value = phoneInput.value.trim();
    let message = '';
    if (!value) message = '電話番号を入力してください。';
    else if (!/^[0-9]+$/.test(value)) message = '電話番号はハイフンなしの半角数字で入力してください。';
    else if (value.length < 10) message = '電話番号の桁数が不足しています。10桁または11桁で入力してください。';
    else if (value.length > 11) message = '電話番号の桁数が超過しています。10桁または11桁で入力してください。';
    phoneInput.setCustomValidity(message);
    setFieldState(phoneInput, message);
    return !message;
  };

  const validateDate = () => {
    let message = '';
    if (!dateInput.value || dateInput.value < localToday) message = messages['opening-date'];
    dateInput.setCustomValidity(message);
    setFieldState(dateInput, message);
    return !message;
  };

  phoneInput?.addEventListener('input', validatePhone);
  dateInput?.addEventListener('change', validateDate);
  form?.querySelectorAll('input[required]').forEach((field) => {
    if (field === phoneInput || field === dateInput) return;
    field.addEventListener('input', () => {
      const message = field.value.trim() ? '' : messages[field.id];
      field.setCustomValidity(message);
      setFieldState(field, message);
    });
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (formSubmitted) return;
    notice.classList.remove('is-visible', 'is-error');
    validateDate();
    validatePhone();
    form.querySelectorAll('input[required]').forEach((field) => {
      if (field === phoneInput || field === dateInput) return;
      const message = field.value.trim() ? '' : messages[field.id];
      field.setCustomValidity(message);
      setFieldState(field, message);
    });
    if (!form.reportValidity()) return;

    const webhookUrl = form.dataset.webhookUrl?.trim();
    const selectedGas = form.elements.gas.checked;
    const selectedInternet = form.elements.internet.checked;
    const selectedServices = ['電気'];
    if (selectedGas) selectedServices.push('ガス');
    if (selectedInternet) selectedServices.push('インターネット Wi‑Fi');
    const payload = {
      openingDate: dateInput.value,
      name: form.elements.name.value.trim(),
      phone: phoneInput.value.trim(),
      address: form.elements.address.value.trim(),
      electric: '希望する',
      gas: selectedGas ? '希望する' : '希望しない',
      internetWifi: selectedInternet ? '希望する' : '希望しない',
      selectedServices: selectedServices.join(' / '),
      routeMode: activeRouteMode,
      pageUrl: window.location.href,
      submittedAt: new Date().toISOString()
    };

    if (!webhookUrl) {
      notice.textContent = '入力内容を確認しました。WEBhook URLを設定すると、この内容で電気開通のお申し込みを送信できます。';
      notice.classList.add('is-visible');
      notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: new URLSearchParams(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      formSubmitted = true;
      notice.textContent = 'お申し込みを受け付けました。担当者からの連絡をお待ちください。';
      notice.classList.add('is-visible');
      const submitLabel = submitButton.querySelector('.action-copy strong');
      const submitSubLabel = submitButton.querySelector('.action-copy b');
      if (submitLabel) submitLabel.textContent = '送信を受け付けました';
      if (submitSubLabel) submitSubLabel.textContent = '担当者からの連絡をお待ちください';
    } catch (error) {
      notice.textContent = '送信できませんでした。入力内容は保持されています。時間をおいて再度お試しください。';
      notice.classList.add('is-visible', 'is-error');
      console.error('Webhook submission failed:', error);
    } finally {
      submitButton.removeAttribute('aria-busy');
      if (!formSubmitted) submitButton.disabled = false;
      notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  const addFaqStructuredData = () => {
    const questions = [...document.querySelectorAll('.faq-item')].map((item) => ({
      '@type': 'Question',
      name: item.querySelector('summary')?.textContent.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.querySelector('.faq-answer')?.textContent.trim()
      }
    })).filter((item) => item.name && item.acceptedAnswer.text);
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions });
    document.head.append(script);
  };

  window.addEventListener('DOMContentLoaded', () => {
    const routeMode = isReloadNavigation ? 'normal' : getRouteMode();
    setRouteMode(routeMode);
    addFaqStructuredData();
    if (isReloadNavigation) {
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    }
    if (routeMode === 'normal') openRouteDialog();
  }, { once: true });
  window.addEventListener('pageshow', () => {
    setRouteMode(isReloadNavigation ? 'normal' : getRouteMode());
    if (isReloadNavigation) window.scrollTo(0, 0);
  });
})();
