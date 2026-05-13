/* ══════════════════════════════════════
   MTEC — Shared Navbar Loader + Handlers
   Fetches partials/nav.html, injects at #nav-mount,
   then wires up mobile toggle + dropdown interactions.
══════════════════════════════════════ */
(function() {
  const mount = document.getElementById('nav-mount');
  if (!mount) return;

  fetch('partials/nav.html', { cache: 'no-cache' })
    .then(r => {
      if (!r.ok) throw new Error('nav.html ' + r.status);
      return r.text();
    })
    .then(html => {
      mount.outerHTML = html;
      initNav();
    })
    .catch(err => console.error('[nav] failed to load:', err));

  function initNav() {
    applyActiveState();
    setupMobileNav();
    setupDropdowns();
    setupSubDropdowns();
  }

  /* Active state — only "Quiénes Somos" highlights.
     Other pages (que-hacemos, tecnologia, contacto, index) have no
     active link by design. */
  function applyActiveState() {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (file === 'quienes-somos.html') {
      const link = document.querySelector('.nav-links a[data-nav="quienes-somos"]');
      if (link) link.classList.add('active');
    }
  }

  function setupMobileNav() {
    const t = document.getElementById('navToggle');
    const m = document.getElementById('navMenu');
    if (!t || !m) return;
    const close = () => {
      t.classList.remove('open'); m.classList.remove('open');
      t.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    t.addEventListener('click', () => {
      const open = !t.classList.contains('open');
      t.classList.toggle('open', open);
      m.classList.toggle('open', open);
      t.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    m.addEventListener('click', e => {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && t.classList.contains('open')) close();
    });
  }

  function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(dd => {
      const trigger = dd.querySelector('.nav-dropdown-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const open = !dd.classList.contains('open');
        dropdowns.forEach(other => {
          if (other !== dd) {
            other.classList.remove('open');
            other.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
          }
        });
        dd.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', String(open));
        if (!open) closeAllSubs();
      });
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-dropdown')) {
        dropdowns.forEach(dd => {
          dd.classList.remove('open');
          dd.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
        });
        closeAllSubs();
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        dropdowns.forEach(dd => {
          dd.classList.remove('open');
          dd.querySelector('.nav-dropdown-trigger')?.setAttribute('aria-expanded', 'false');
        });
        closeAllSubs();
      }
    });
  }

  /* Nested sub-dropdowns inside a panel (e.g. Servicios Especializados → service list).
     Desktop: CSS handles hover open. Click on the sub-trigger toggles open state
     (covers tap on touch devices and accessibility). Mobile: same toggle drives the
     inline accordion via the .open class. */
  function setupSubDropdowns() {
    const subs = document.querySelectorAll('.nav-dd-has-sub');
    subs.forEach(sub => {
      const trigger = sub.querySelector('.nav-dd-sub-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const open = !sub.classList.contains('open');
        subs.forEach(other => {
          if (other !== sub) {
            other.classList.remove('open');
            other.querySelector('.nav-dd-sub-trigger')?.setAttribute('aria-expanded', 'false');
          }
        });
        sub.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', String(open));
      });
    });
  }

  function closeAllSubs() {
    document.querySelectorAll('.nav-dd-has-sub.open').forEach(sub => {
      sub.classList.remove('open');
      sub.querySelector('.nav-dd-sub-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
})();
