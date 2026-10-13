(() => {
  'use strict';
  const browser = window.LP_BROWSER;
  if (!browser || !browser.onProductionHost) return;
  document.querySelectorAll('[data-phone-call], [data-sticky-phone]').forEach((link) => {
    link.addEventListener('click', (event) => {
      browser.record(event.defaultPrevented ? 'phone_after_hours' : 'click_to_call', {
        ...(!event.defaultPrevented ? { conversion_type: 'phone_click' } : {}),
        phone_number: (link.getAttribute('href') || '').replace('tel:', ''),
        page_path: window.location.pathname,
        route_mode: browser.attribution.routeMode,
        cta_location: link.closest('.sticky-cta') ? 'sticky'
          : link.closest('.hero-contact') ? 'hero'
            : link.closest('dialog') ? 'modal'
              : link.closest('.form-phone') ? 'form' : 'contact',
        cta_text: link.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
      });
    });
  });
})();
