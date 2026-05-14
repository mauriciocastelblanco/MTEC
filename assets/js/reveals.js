/* ══════════════════════════════════════
   MTEC — Bidirectional Scroll Reveal Observer
   Toggles `.visible` on every reveal-class element as it crosses
   the viewport edge. Elements re-hide when scrolling up past them,
   so the site feels alive on every scroll direction.

   Usage:  MTEC.initReveals(['extraSelector', '.another-class'])
   Safe to call multiple times — already-observed elements are skipped.
   ══════════════════════════════════════ */
(function () {
  const MTEC = (window.MTEC = window.MTEC || {});

  const DEFAULT_SELECTOR =
    '.reveal,.reveal-x,.reveal-x-r,.reveal-scale,' +
    '.line-reveal,.blur-reveal,.section-tag';

  let io = null;
  const observed = new WeakSet();

  function ensureObserver() {
    if (io) return io;
    io = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        target.classList.toggle('visible', isIntersecting);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    return io;
  }

  MTEC.initReveals = function (extraSelectors = []) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const selector = [DEFAULT_SELECTOR].concat(extraSelectors).join(',');
    const els = document.querySelectorAll(selector);

    if (reducedMotion) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = ensureObserver();
    els.forEach(el => {
      if (observed.has(el)) return;
      observed.add(el);
      observer.observe(el);
    });
  };
})();
