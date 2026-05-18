/* ══════════════════════════════════════
   MTEC — Shared Navbar Loader + Handlers
   Fetches partials/nav.html, injects at #nav-mount,
   then wires up mobile toggle + dropdown interactions.
══════════════════════════════════════ */
(function() {
  const mount = document.getElementById('nav-mount');
  if (!mount) return;

  /* Subdirectory awareness — pages under /servicios/, /etc/ load the
     nav partial from one level up and need relative hrefs/srcs in the
     injected HTML rewritten with the same prefix. */
  const path = location.pathname;
  const segments = path.split('/').filter(Boolean);
  // If pathname ends in "/" the last segment is implicit index.html → file count = 0
  const fileCount = path.endsWith('/') ? 0 : 1;
  const depth = Math.max(0, segments.length - fileCount);
  const prefix = '../'.repeat(depth);

  fetch(prefix + 'partials/nav.html', { cache: 'no-cache' })
    .then(r => {
      if (!r.ok) throw new Error('nav.html ' + r.status);
      return r.text();
    })
    .then(html => {
      // Rewrite relative href/src so links resolve from subdirectory pages.
      // Skip absolute (http, /, #), protocol-relative (//), and mailto/tel.
      const rewritten = prefix
        ? html.replace(/\b(href|src)="(?!https?:|\/|#|mailto:|tel:|\.\.\/)([^"]+)"/g,
                       (_, attr, url) => `${attr}="${prefix}${url}"`)
        : html;
      mount.outerHTML = rewritten;
      initNav();
    })
    .catch(err => console.error('[nav] failed to load:', err));

  function initNav() {
    applyActiveState();
    setupMobileNav();
    setupDropdowns();
    setupSubDropdowns();
  }

  /* Active state — highlights the relevant nav entry for the current page.
     - quienes-somos.html → top-level "Quiénes Somos" link
     - que-hacemos.html → the "Qué Hacemos" dropdown trigger
     - any page under /servicios/ → the "Qué Hacemos" dropdown trigger
       and the nested "Servicios Especializados" sub-trigger */
  function applyActiveState() {
    const path = location.pathname;
    const file = (path.split('/').pop() || 'index.html').toLowerCase();

    if (file === 'quienes-somos.html') {
      const link = document.querySelector('.nav-links a[data-nav="quienes-somos"]');
      if (link) link.classList.add('active');
    }

    if (file === 'que-hacemos.html') {
      const ddTrigger = document.querySelector('.nav-dropdown-trigger[data-nav="que-hacemos"]');
      if (ddTrigger) ddTrigger.classList.add('active');
    }

    if (path.includes('/servicios/')) {
      const ddTrigger = document.querySelector('.nav-dropdown-trigger[aria-controls="ddQueHacemos"]');
      const subTrigger = document.querySelector('.nav-dd-sub-trigger[aria-controls="ddServiciosEspecializados"]');
      if (ddTrigger)  ddTrigger.classList.add('active');
      if (subTrigger) subTrigger.classList.add('active');
      // Also highlight the specific service sub-link if present.
      const subLinks = document.querySelectorAll('#ddServiciosEspecializados a.nav-dd-subitem');
      subLinks.forEach(a => {
        if (a.getAttribute('href') && path.endsWith(a.getAttribute('href').replace(/^\.\.\//, '/'))) {
          a.classList.add('active');
        }
      });
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

  /* The main dropdown trigger is now an <a> that navigates to the
     overview page on click. The panel opens on hover (CSS-driven) on
     desktop. We only need to handle: closing the panel + any open
     sub-panels when the user clicks outside or presses Escape. */
  function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    if (dropdowns.length === 0) return;
    const closeAll = () => {
      dropdowns.forEach(dd => dd.classList.remove('open'));
      closeAllSubs();
    };
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-dropdown')) closeAll();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll();
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
