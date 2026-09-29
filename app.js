(() => {
  'use strict';

  const routeDialog = document.getElementById('route-dialog');
  const phoneHoursDialog = document.getElementById('phone-hours-dialog');
  const phoneReceptionClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    hourCycle: 'h23'
  });
  // Check on every click so an open page also respects the 10:00 / 19:00 boundaries.
  const isPhoneReceptionOpen = () => {
    const japanHour = Number(phoneReceptionClock.format(new Date()));
    return japanHour >= 10 && japanHour < 19;
  };
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
  const routeCookieSecure = window.location.protocol === 'https:' ? '; Secure' : '';
  const validRouteModes = new Set(['normal', 'temporary', 'other']);
  const initialLandingUrl = window.location.href;
  const initialReferrer = document.referrer;
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'wbraid', 'gbraid'];
  const initialSearchParams = new URL(initialLandingUrl).searchParams;
  const trackingData = Object.fromEntries(trackingKeys.map((key) => [key, initialSearchParams.get(key) || '']));
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
  const resetReloadScroll = () => {
    if (!isReloadNavigation) return;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
    window.setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.style.removeProperty('scroll-behavior');
    }, 180);
  };
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
    if (priorityDismissed || activeRouteMode !== 'normal' || !isPhoneReceptionOpen()) return;
    if (document.querySelector('dialog[open]')) return;
    priorityShowTimer = window.setTimeout(() => {
      if (priorityDismissed || activeRouteMode !== 'normal' || !isPhoneReceptionOpen() || document.querySelector('dialog[open]')) return;
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
        ? `${routeCookieName}=; path=${routeCookiePath}; max-age=0; SameSite=Lax${routeCookieSecure}`
        : `${routeCookieName}=${encodeURIComponent(mode)}; path=${routeCookiePath}; max-age=86400; SameSite=Lax${routeCookieSecure}`;
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
  phoneHoursDialog?.querySelector('.modal-close')?.addEventListener('click', () => phoneHoursDialog.close());
  phoneHoursDialog?.addEventListener('click', (event) => {
    if (event.target !== phoneHoursDialog) return;
    const bounds = phoneHoursDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) phoneHoursDialog.close();
  });
  phoneHoursDialog?.addEventListener('close', schedulePriorityPopup);
  phoneHoursDialog?.querySelector('[data-after-hours-web]')?.addEventListener('click', () => {
    phoneHoursDialog.close();
    window.requestAnimationFrame(() => document.getElementById('opening-date')?.focus({ preventScroll: true }));
  });

  const form = document.getElementById('application-form');
  const dateInput = document.getElementById('opening-date');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const notice = document.getElementById('form-notice');
  const submitButton = form?.querySelector('.submit-button');
  const successPanel = document.getElementById('form-success');
  const successReceipt = successPanel?.querySelector('[data-success-receipt]');
  const successServices = successPanel?.querySelector('[data-success-services]');
  let formSubmitted = false;
  const pushDataLayer = (event, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...details });
  };
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

  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const details = {
        phone_number: link.getAttribute('href')?.replace('tel:', '') || '',
        page_path: window.location.pathname,
        route_mode: activeRouteMode,
        cta_location: link.closest('.sticky-cta') ? 'sticky'
          : link.closest('#top') ? 'hero'
            : link.closest('.steps-section') ? 'steps'
              : link.closest('.reasons-section') ? 'reasons'
                : link.closest('.internet-section') ? 'internet'
                  : link.closest('.faq-section') ? 'faq'
                    : link.closest('#contact') ? 'contact'
                      : 'other',
        cta_text: link.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)
      };
      if (!isPhoneReceptionOpen()) {
        event.preventDefault();
        hidePriorityPopup();
        if (phoneHoursDialog && !phoneHoursDialog.open) phoneHoursDialog.showModal();
        pushDataLayer('phone_after_hours', details);
        return;
      }
      pushDataLayer('click_to_call', { conversion_type: 'phone_click', ...details });
    });
  });

  if (dateInput) dateInput.min = localToday;

  const messages = {
    'opening-date': '本日以降の開通希望日を選択してください。',
    name: 'お名前を入力してください。'
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

  const validateEmail = () => {
    if (!emailInput) return true;
    emailInput.setCustomValidity('');
    const value = emailInput.value.trim();
    const message = value && emailInput.validity.typeMismatch
      ? 'メールアドレスの形式を確認してください。'
      : '';
    emailInput.setCustomValidity(message);
    setFieldState(emailInput, message);
    return !message;
  };

  phoneInput?.addEventListener('input', validatePhone);
  dateInput?.addEventListener('change', validateDate);
  emailInput?.addEventListener('input', validateEmail);
  emailInput?.addEventListener('blur', validateEmail);
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
    if (form.elements.website?.value) return;
    notice.classList.remove('is-visible', 'is-error');
    validateDate();
    validatePhone();
    validateEmail();
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
    const submissionId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const receiptId = `MO-${localToday.replace(/-/g, '')}-${submissionId.slice(0, 6).toUpperCase()}`;
    const payload = {
      submissionId,
      receiptId,
      openingDate: dateInput.value,
      name: form.elements.name.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput?.value.trim() || '',
      address: '電話でヒアリング',
      electric: '希望する',
      gas: selectedGas ? '希望する' : '希望しない',
      internetWifi: selectedInternet ? '希望する' : '希望しない',
      selectedServices: selectedServices.join(' / '),
      routeMode: activeRouteMode,
      pageUrl: window.location.href,
      landingPageUrl: initialLandingUrl,
      referrer: initialReferrer,
      ...trackingData,
      submittedAt: new Date().toISOString()
    };

    if (!webhookUrl) {
      notice.textContent = '入力内容を確認しました。WEBhook URLを設定すると、この内容で電気開通のお申し込みを送信できます。';
      notice.classList.add('is-visible');
      notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const submitLabel = submitButton.querySelector('.action-copy strong');
    const submitSubLabel = submitButton.querySelector('.action-copy b');
    const originalSubmitLabel = submitLabel?.textContent || '';
    const originalSubmitSubLabel = submitSubLabel?.textContent || '';
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    form.setAttribute('aria-busy', 'true');
    if (submitLabel) submitLabel.textContent = '送信中です';
    if (submitSubLabel) submitSubLabel.textContent = '画面を閉じずにお待ちください';
    const requestController = new AbortController();
    const requestTimeout = window.setTimeout(() => requestController.abort(), 15000);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: new URLSearchParams(payload),
        signal: requestController.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      formSubmitted = true;
      if (successReceipt) successReceipt.textContent = receiptId;
      if (successServices) successServices.textContent = selectedServices.join('・');
      if (successPanel) successPanel.hidden = false;
      form.classList.add('is-complete');
      form.removeAttribute('aria-busy');
      document.body.classList.add('form-complete');
      pushDataLayer('generate_lead', {
        conversion_type: 'web_form',
        cta_location: 'contact',
        form_id: 'application-form',
        submission_id: submissionId,
        selected_services: selectedServices.join(' / '),
        route_mode: activeRouteMode,
        email_provided: Boolean(emailInput?.value.trim())
      });
      successPanel?.focus({ preventScroll: true });
      successPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      notice.textContent = '送信できませんでした。入力内容は保持されています。時間をおいて再度お試しください。';
      notice.classList.add('is-visible', 'is-error');
      form.removeAttribute('aria-busy');
      if (submitLabel) submitLabel.textContent = originalSubmitLabel;
      if (submitSubLabel) submitSubLabel.textContent = originalSubmitSubLabel;
      console.error('Webhook submission failed:', error);
    } finally {
      window.clearTimeout(requestTimeout);
      submitButton.removeAttribute('aria-busy');
      if (!formSubmitted) submitButton.disabled = false;
      if (!formSubmitted) notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    resetReloadScroll();
    // Keep the new FV visible on arrival; the footer still opens the route dialog.
    const fvCard = document.querySelector('.fv-card');
    if (fvCard && 'IntersectionObserver' in window) {
      const fvObserver = new IntersectionObserver(([entry]) => {
        document.body.classList.toggle('fv-in-view', entry.isIntersecting);
      });
      fvObserver.observe(fvCard);
    } else {
      document.body.classList.remove('fv-in-view');
    }
  }, { once: true });
  window.addEventListener('pageshow', () => {
    setRouteMode(isReloadNavigation ? 'normal' : getRouteMode());
    resetReloadScroll();
  });
  window.addEventListener('load', resetReloadScroll, { once: true });
})();
