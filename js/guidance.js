/* Local guidance UI only. No tracking, storage, or application submission. */
(() => {
  'use strict';

  const config = window.LP_CONFIG || {};
  const entryDialog = document.querySelector('#entry-guidance');
  const phoneDialog = document.querySelector('#phone-guidance');
  const sticky = document.querySelector('.sticky-cta');
  if (!entryDialog && !phoneDialog) return;

  const syncDialogState = () => {
    document.body.classList.toggle('guidance-open', Boolean(document.querySelector('dialog[open]')));
  };
  const openDialog = (dialog) => {
    if (!dialog.open) dialog.showModal();
    syncDialogState();
  };
  [entryDialog, phoneDialog].filter(Boolean).forEach((dialog) => {
    dialog.querySelectorAll('[data-close-guidance]').forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('close', syncDialogState);
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });

  if (entryDialog) document.querySelectorAll('[data-open-guidance]').forEach((button) => {
    button.addEventListener('click', () => openDialog(entryDialog));
  });

  const receptionClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo', hour: '2-digit', hourCycle: 'h23',
  });
  const isReceptionOpen = () => {
    const hour = Number(receptionClock.format(new Date()));
    return hour >= (config.phoneHoursStart ?? 10) && hour < (config.phoneHoursEnd ?? 19);
  };
  const stickyPhone = sticky?.querySelector('[data-sticky-phone]');
  if (stickyPhone && config.phone) {
    stickyPhone.href = `tel:${config.phone}`;
    stickyPhone.querySelector('small').textContent = config.phone;
  } else if (stickyPhone) {
    stickyPhone.querySelector('small').textContent = '電話窓口は準備中';
  }
  if (phoneDialog) document.querySelectorAll('[data-sticky-phone], [data-phone-call]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (config.phone && isReceptionOpen()) return;
      event.preventDefault();
      phoneDialog.querySelector('h2').textContent = config.phone
        ? 'ただいま電話受付は営業時間外です' : '電話窓口は準備中です';
      phoneDialog.querySelector('.phone-guidance__schedule').textContent = config.hours || '';
      openDialog(phoneDialog);
    });
  });

  const primaryCta = document.querySelector('#primary-web-cta');
  if (sticky && 'IntersectionObserver' in window && primaryCta) {
    const observer = new IntersectionObserver(([entry]) => {
      sticky.hidden = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(primaryCta);
  } else if (sticky) {
    sticky.hidden = false;
  }

  // Display the selector on landing-page arrival; a direct section link stays direct.
  if (entryDialog && !window.location.hash) openDialog(entryDialog);
})();
