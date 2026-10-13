/* Progressive application form with acknowledged submission and retry support. */
(() => {
  'use strict';

  const config = window.LP_CONFIG || {};
  const setText = (selector, value) => {
    if (value == null) return;
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };

  const brandLink = document.querySelector('.l-header--mainTxt');
  if (brandLink && config.brand) {
    const textNode = Array.from(brandLink.childNodes).find((node) => node.nodeType === 3);
    if (textNode) textNode.textContent = config.brand;
  }
  setText('.l-header--subTxt', config.brandSubtitle);
  setText('.top-contact__telTitle, .c-telCta__title', config.contactCenter);
  setText('.top-contact__telDetailWrap > p, .c-telCta__number > p', config.phone || config.phonePlaceholder);
  setText('.top-contact__telNote, .c-telCta__time', config.hours);
  setText('[data-phone-number]', config.phone || config.phonePlaceholder);
  setText('[data-phone-hours]', config.hours);
  setText('[data-operator-name]', config.operatorName);
  document.querySelectorAll('[data-operator-url]').forEach((link) => {
    if (config.operatorUrl) link.href = config.operatorUrl;
  });
  document.querySelectorAll('[data-contract-contacts]').forEach((link) => {
    if (config.contractContactsUrl) link.href = config.contractContactsUrl;
  });
  setText('.top-mainVisual__title', config.heroTitle);
  setText('.top-mainVisual__desc > p', config.heroNote);
  document.body.classList.toggle('is-phone-pending', !config.phone);
  document.querySelectorAll('[data-phone-call]').forEach((link) => {
    if (config.phone) link.href = `tel:${config.phone}`;
    else link.removeAttribute('href');
  });

  const form = document.querySelector('.form-page__form');
  if (!form) return;

  const formView = document.querySelector('.form-page');
  const confirmView = document.querySelector('.confirm-page');
  const items = Array.from(form.querySelectorAll('.form-page__formItem'));
  const fields = {
    prefectures: form.querySelector('#prefectures'),
    date: form.querySelector('#date'),
    name: form.querySelector('#name'),
    tel: form.querySelector('#tel'),
    mail: form.querySelector('#mail'),
    agreement: form.querySelector('#agreement'),
  };
  const serviceInputs = Array.from(form.querySelectorAll('input[name="service"]'));
  const confirmButton = form.querySelector('[data-triggersevenbtn]');
  const today = window.LP_PRODUCTION.japanDate(new Date());
  fields.date.min = today;
  const words = ['one', 'two', 'three', 'four', 'five', 'six'];
  const completed = [false, false, false, false, false, false];
  let dateDeferred = false;

  const service = () => serviceInputs.find((input) => input.checked)?.value || '';
  const isValid = (step) => {
    switch (step) {
      case 0: return fields.prefectures.selectedIndex > 0;
      case 1: return Boolean(service());
      case 2: return (Boolean(fields.date.value) && fields.date.value >= today) || dateDeferred;
      case 3: return fields.name.value.trim().length > 0;
      case 4: return /^[0-9]{10,11}$/.test(fields.tel.value);
      case 5: return /.+@.+\..+/.test(fields.mail.value);
      default: return false;
    }
  };

  const error = (step, visible, message) => {
    const word = words[step] || 'seven';
    const wrapper = form.querySelector(`[data-validatemsg${word}]`);
    if (message) wrapper.querySelector('p').textContent = message;
    wrapper.classList.toggle('active', visible);
    const input = [fields.prefectures, null, fields.date, fields.name, fields.tel, fields.mail, fields.agreement][step];
    if (input) input.setAttribute('aria-invalid', String(visible));
  };

  const update = () => {
    completed.forEach((done, step) => {
      form.querySelector(`[data-target${words[step]}circle]`).classList.toggle('form-page__progressLineBlue', done);
      form.querySelector(`[data-target${words[step]}text]`).classList.toggle('form-page__progressCatBlue', done);
    });
    form.querySelector('[data-quenum]').textContent = String(completed.filter((done) => !done).length);
    confirmButton.classList.toggle('active', completed.every(Boolean) && fields.agreement.checked);
  };

  const reveal = (step) => {
    const item = items[step];
    if (!item) return;
    item.classList.add('active');
    item.removeAttribute('aria-hidden');
    item.inert = false;
  };

  items.forEach((item, index) => {
    if (index > 0) {
      item.setAttribute('aria-hidden', 'true');
      item.inert = true;
    }
  });

  const answer = (step) => {
    const valid = isValid(step);
    completed[step] = valid;
    const requiredMessages = [
      '※ご利用先を選択してください。',
      '※希望するサービスを選択してください。',
      '※本日以降の開始・開通希望日を選択してください。',
      '※名前を入力してください。',
      '※電話番号を入力してください。',
      '※メールアドレスを入力してください。',
    ];
    const message = step === 4 && fields.tel.value
      ? '※正しい形式の電話番号を入力してください。'
      : step === 5 && fields.mail.value
        ? '※正しい形式のメールアドレスを入力してください。'
        : requiredMessages[step];
    error(step, !valid, message);
    if (valid) reveal(step + 1);
    update();
    return valid;
  };

  fields.prefectures.addEventListener('change', () => answer(0));
  fields.prefectures.addEventListener('blur', () => error(0, !isValid(0)));
  serviceInputs.forEach((input) => input.addEventListener('change', () => answer(1)));
  fields.date.addEventListener('change', () => {
    dateDeferred = false;
    answer(2);
  });
  form.querySelector('[data-triggerthreebtn]').addEventListener('click', () => {
    fields.date.value = '';
    dateDeferred = true;
    answer(2);
  });

  [fields.name, fields.tel, fields.mail].forEach((input, index) => {
    const step = index + 3;
    form.querySelector(`[data-trigger${words[step]}btn]`).addEventListener('click', () => answer(step));
    input.addEventListener('input', () => {
      if (completed[step] && !isValid(step)) completed[step] = false;
      const wrapper = form.querySelector(`[data-validatemsg${words[step]}]`);
      if (wrapper.classList.contains('active') && isValid(step)) error(step, false);
      update();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        answer(step);
      }
    });
  });

  fields.agreement.addEventListener('change', () => {
    error(6, !fields.agreement.checked);
    update();
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  confirmButton.addEventListener('click', () => {
    const validation = words.map((_, step) => isValid(step));
    validation.forEach((valid, step) => error(step, !valid));
    error(6, !fields.agreement.checked);
    if (!validation.every(Boolean) || !fields.agreement.checked) {
      const firstInvalid = validation.findIndex((valid) => !valid);
      if (firstInvalid >= 0) {
        for (let step = 0; step <= firstInvalid; step += 1) reveal(step);
        items[firstInvalid].querySelector('input, select')?.focus();
      } else {
        fields.agreement.focus();
      }
      return;
    }

    const values = [fields.prefectures.value, service(), fields.date.value || '後日設定する',
      fields.name.value.trim(), fields.tel.value, fields.mail.value];
    values.forEach((value, step) => {
      confirmView.querySelector(`[data-confirm${words[step]}]`).textContent = value;
    });
    formView.classList.remove('active');
    confirmView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  confirmView.querySelector('[data-triggerbackbtn]').addEventListener('click', () => {
    confirmView.classList.remove('active');
    formView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  const sendButton = confirmView.querySelector('[data-triggereightbtn]');
  const backButton = confirmView.querySelector('[data-triggerbackbtn]');
  const status = confirmView.querySelector('[data-submission-status]');
  let sending = false;
  let sent = false;
  sendButton.addEventListener('click', async () => {
    if (sending || sent || form.elements.website?.value) return;
    const browser = window.LP_BROWSER;
    if (!browser?.onProductionHost) {
      status.textContent = 'この画面は確認用です。実際のお申し込みは公開サイトをご利用ください。';
      status.hidden = false;
      return;
    }
    if (!words.every((_, step) => isValid(step)) || !fields.agreement.checked) return;
    const payload = window.LP_PRODUCTION.buildPayload({
      prefectures: fields.prefectures.value, service: service(), date: fields.date.value,
      name: fields.name.value, tel: fields.tel.value, mail: fields.mail.value,
    }, { ...browser.attribution, pageUrl: window.location.href });
    sending = true;
    sendButton.disabled = true;
    backButton.disabled = true;
    sendButton.setAttribute('aria-busy', 'true');
    sendButton.textContent = '送信中…';
    status.hidden = true;
    try {
      const receipt = await window.LP_PRODUCTION.submitLead(config.submissionEndpoint, payload);
      sent = true;
      browser.saveReceipt(receipt);
      await browser.recordAndWait('generate_lead', {
        conversion_type: 'web_form', cta_location: 'contact', form_id: 'application-form',
        submission_id: payload.submissionId, selected_services: payload.selectedServices,
        route_mode: payload.routeMode, email_provided: Boolean(payload.email),
      });
      window.location.assign('./thanks/');
    } catch (_) {
      status.textContent = '送信できませんでした。入力内容は保持されています。時間をおいてもう一度お試しいただくか、電話でご相談ください。';
      status.hidden = false;
      status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      sending = false;
      sendButton.removeAttribute('aria-busy');
      if (!sent) {
        sendButton.disabled = false;
        backButton.disabled = false;
        sendButton.textContent = '送信する';
      }
    }
  });

  update();
})();
