// ══════════════════════════════════════════════════════════════════
// public-service.js — populates servicios/index.html from Supabase.
// Reads ?slug=... from the URL, fetches the matching published service,
// fills the [data-slot] elements, and reveals only the sections that
// have content.
// ══════════════════════════════════════════════════════════════════
import { supabasePublic } from './supabase-public.js';

const ICONS = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 5V3"/><path d="M12 13l4-4"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  thermometer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  pipe: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M4 22 L 60 22 M 4 42 L 60 42"/><path d="M10 22 L 10 42 M 54 22 L 54 42" opacity="0.45"/></svg>',
  elbow: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 32 Q 8 8 32 8 L 56 8 M 8 56 L 8 32"/><path d="M14 32 Q 14 14 32 14 L 56 14" opacity="0.45"/><path d="M14 56 L 14 32" opacity="0.45"/></svg>',
  tee: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M4 24 L 60 24 M 4 40 L 60 40 M 28 40 L 28 60 M 36 40 L 36 60"/></svg>',
  reducer: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M4 16 L 28 16 L 60 28 M 4 48 L 28 48 L 60 36"/><path d="M60 28 L 60 36" opacity="0.45"/></svg>',
  flange: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="10"/><circle cx="32" cy="14" r="2" fill="currentColor"/><circle cx="50" cy="32" r="2" fill="currentColor"/><circle cx="32" cy="50" r="2" fill="currentColor"/><circle cx="14" cy="32" r="2" fill="currentColor"/></svg>',
  circumferential: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" stroke-dasharray="4 4"/></svg>',
  longitudinal: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 32 L 56 32" stroke-dasharray="4 4"/></svg>',
  irregular: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M4 40 Q 14 28 24 38 Q 34 48 44 36 Q 54 26 60 34"/><path d="M4 50 Q 14 40 24 48 Q 34 56 44 46 Q 54 38 60 44" opacity="0.45"/></svg>',
};

const root = document.querySelector('[data-service-root]');
const stateLoading = document.querySelector('[data-state="loading"]');
const stateError = document.querySelector('[data-state="error"]');

function showState(name) {
  if (stateLoading) stateLoading.hidden = name !== 'loading';
  if (stateError) stateError.hidden = name !== 'error';
  // Note: this toggles loading/error states only. Section visibility is
  // controlled per-render so empty sections stay hidden.
  if (name !== 'ok') {
    document.querySelectorAll('[data-service-section]').forEach(el => {
      el.hidden = true;
    });
  }
}

function setText(key, value) {
  document.querySelectorAll(`[data-slot="${key}"]`).forEach(el => {
    el.textContent = value ?? '';
  });
}

function setHtml(key, html) {
  document.querySelectorAll(`[data-slot="${key}"]`).forEach(el => {
    el.innerHTML = html;
  });
}

function showSection(name, visible) {
  document.querySelectorAll(`[data-service-section="${name}"]`).forEach(el => {
    el.hidden = !visible;
  });
}

function showSlot(key, visible) {
  document.querySelectorAll(`[data-slot="${key}"]`).forEach(el => {
    el.hidden = !visible;
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getSlug() {
  // Clean URL form: /servicios/<slug>
  const path = location.pathname.replace(/\/+$/, '');
  const match = path.match(/\/servicios\/([^/]+?)(?:\.html)?$/);
  if (match && match[1] && match[1] !== 'index') return decodeURIComponent(match[1]);
  // Backward compat: ?slug=<slug>
  return new URLSearchParams(location.search).get('slug') || '';
}

async function fetchService(slug) {
  const { data, error } = await supabasePublic
    .from('servicios')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function renderHero(s) {
  document.title = `${s.titulo} — MTEC`;
  setText('breadcrumb-name', s.titulo);
  setText('eyebrow', s.eyebrow || '');
  setText('titulo', s.titulo);
  // Lead: rich text (HTML) from Trix in the admin, with fallback for
  // legacy plain-text leads (split on blank lines).
  const leadEl = document.querySelector('[data-slot="lead"]');
  if (leadEl) {
    const raw = String(s.lead || '');
    if (/<[a-z][^>]*>/i.test(raw)) {
      leadEl.innerHTML = raw;
    } else {
      const paragraphs = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      leadEl.innerHTML = paragraphs.map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
    }
  }

  const hero = s.hero || {};
  const heroImageWrap = document.querySelector('[data-slot="hero-image-wrap"]');
  const heroImg = document.querySelector('[data-slot="hero-image"]');
  if (hero.imagen) {
    heroImg.src = hero.imagen;
    heroImg.alt = s.titulo;
    heroImageWrap.hidden = false;
  } else {
    heroImageWrap.hidden = true;
  }

  // Alliance card: shown only when an allied partner logo was uploaded.
  const calloutWrap = document.querySelector('[data-slot="product-callout"]');
  const calloutLogo = (hero.productCallout?.imagen || '').trim();
  const calloutLogoEl = document.querySelector('[data-slot="callout-logo"]');
  if (calloutLogo) {
    calloutLogoEl.src = calloutLogo;
    calloutLogoEl.alt = 'Aliado';
    calloutWrap.hidden = false;
  } else {
    calloutLogoEl.removeAttribute('src');
    calloutWrap.hidden = true;
  }

  // Ficha técnica CTA — appears beside the alliance logo, or in its place.
  const ficha = s.certificacion?.fichaTecnicaPdf?.dataUrl?.trim();
  const fichaCta = document.querySelector('[data-slot="ficha-cta"]');
  const ctaRow = document.querySelector('[data-slot="hero-cta-row"]');
  if (ficha) {
    fichaCta.href = ficha;
    fichaCta.hidden = false;
  } else {
    fichaCta.hidden = true;
    fichaCta.removeAttribute('href');
  }
  // Row visible if either piece is present.
  ctaRow.hidden = !calloutLogo && !ficha;

  showSection('hero', true);
}

function renderSolucion(s) {
  const sol = s.solucion || {};
  const beneficios = Array.isArray(sol.beneficios) ? sol.beneficios : [];
  if (!sol.descripcion && beneficios.length === 0) return showSection('solucion', false);

  setText('solucion-descripcion', sol.descripcion || '');

  // KPIs: prefer new `kpis` array (up to 3). Fall back to legacy
  // `metricaClave` single object for older records.
  const kpiRow = document.querySelector('[data-slot="kpi-row"]');
  let kpis = Array.isArray(sol.kpis) ? sol.kpis.filter(k => k && (k.valor || k.label)) : [];
  if (kpis.length === 0 && sol.metricaClave && (sol.metricaClave.valor || sol.metricaClave.label)) {
    kpis = [{ valor: sol.metricaClave.valor, label: sol.metricaClave.label }];
  }
  kpis = kpis.slice(0, 3);
  if (kpis.length > 0) {
    kpiRow.innerHTML = kpis.map((k, i) => `
      <div class="kpi reveal" data-delay="${300 + i * 80}">
        <span class="kpi-value">${escapeHtml(k.valor || '')}</span>
        <span class="kpi-label">${escapeHtml(k.label || '')}</span>
      </div>
    `).join('');
    kpiRow.hidden = false;
  } else {
    kpiRow.innerHTML = '';
    kpiRow.hidden = true;
  }

  // Chunk beneficios into pages of 5; each page becomes a vertical
  // benefit-list that snap-scrolls horizontally inside .consid-track.
  const PAGE_SIZE = 5;
  const pages = [];
  for (let i = 0; i < beneficios.length; i += PAGE_SIZE) {
    pages.push(beneficios.slice(i, i + PAGE_SIZE));
  }
  const track = document.querySelector('[data-slot="beneficios-list"]');
  track.innerHTML = pages.map(items => `
    <div class="consid-page">
      <div class="benefit-list">
        ${items.map(b => `
          <div class="benefit-row">
            <span class="benefit-icon">${ICONS[b.icono] || ICONS.shield}</span>
            <span class="benefit-label">${escapeHtml(b.label)}</span>
            ${b.chip ? `<span class="benefit-chip">${escapeHtml(b.chip)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  initConsidCarousel(track, pages.length);

  showSection('solucion', true);
}

function initConsidCarousel(track, pageCount) {
  const paginator = document.querySelector('[data-consid-paginator]');
  const prev = document.querySelector('[data-consid-prev]');
  const next = document.querySelector('[data-consid-next]');
  const counter = document.querySelector('[data-consid-counter]');

  if (!track || !paginator || !prev || !next || !counter) return;

  if (pageCount <= 1) {
    paginator.hidden = true;
    return;
  }
  paginator.hidden = false;

  const pageWidth = () => track.clientWidth;
  const currentPage = () => Math.round(track.scrollLeft / Math.max(pageWidth(), 1)) + 1;
  const update = () => {
    const p = currentPage();
    counter.textContent = `${p} / ${pageCount}`;
    prev.disabled = p <= 1;
    next.disabled = p >= pageCount;
  };

  prev.onclick = () => track.scrollBy({ left: -pageWidth(), behavior: 'smooth' });
  next.onclick = () => track.scrollBy({ left: pageWidth(), behavior: 'smooth' });
  track.onscroll = () => update();
  window.addEventListener('resize', update);
  update();
}

function renderGeometrias(s) {
  const geo = s.geometrias || {};
  const items = Array.isArray(geo.items) ? geo.items : [];
  if (items.length === 0) return showSection('geometrias', false);

  setText('geo-descripcion', geo.descripcion || '');

  // Chunk into pages of 6 items (rendered as a 3-col grid; visually 2x3).
  const PAGE_SIZE = 6;
  const pages = [];
  for (let i = 0; i < items.length; i += PAGE_SIZE) {
    pages.push(items.slice(i, i + PAGE_SIZE));
  }
  const track = document.querySelector('[data-slot="geo-list"]');
  track.innerHTML = pages.map((pageItems, p) => `
    <div class="geo-page">
      <div class="geo-grid">
        ${pageItems.map((it, i) => `
          <div class="geo-card reveal-scale" data-delay="${(p * PAGE_SIZE + i) * 60}">
            <span class="geo-svg">${ICONS[it.icono] || ICONS.pipe}</span>
            <span class="geo-name">${escapeHtml(it.nombre)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  initGeoCarousel(track, pages.length);

  showSection('geometrias', true);
}

function initGeoCarousel(track, pageCount) {
  const paginator = document.querySelector('[data-geo-paginator]');
  const prev = document.querySelector('[data-geo-prev]');
  const next = document.querySelector('[data-geo-next]');
  const counter = document.querySelector('[data-geo-counter]');
  if (!track || !paginator || !prev || !next || !counter) return;

  if (pageCount <= 1) {
    paginator.hidden = true;
    return;
  }
  paginator.hidden = false;

  const pageWidth = () => track.clientWidth;
  const currentPage = () => Math.round(track.scrollLeft / Math.max(pageWidth(), 1)) + 1;
  const update = () => {
    const p = currentPage();
    counter.textContent = `${p} / ${pageCount}`;
    prev.disabled = p <= 1;
    next.disabled = p >= pageCount;
  };

  prev.onclick = () => track.scrollBy({ left: -pageWidth(), behavior: 'smooth' });
  next.onclick = () => track.scrollBy({ left: pageWidth(), behavior: 'smooth' });
  track.onscroll = () => update();
  window.addEventListener('resize', update);
  update();
}

// Normalize the certificacion payload into the new shape:
//   badges: [{ nombre, imagen, normas: [{ texto, certificadoPdf }] }]
// Legacy records may have a flat `normas` array alongside `badges` and a
// global `certificadosPdf`. We fold the flat normas into the first badge
// (preserving order) so old data renders without manual intervention.
function normalizeCertificacion(cert) {
  const badges = Array.isArray(cert.badges)
    ? cert.badges.map(b => ({
        nombre: b.nombre || '',
        imagen: b.imagen || '',
        sub: b.sub || '',
        normas: Array.isArray(b.normas)
          ? b.normas.map(n => ({
              texto: n.texto || '',
              certificadoPdf: n.certificadoPdf || null,
            }))
          : [],
      }))
    : [];

  const legacyNormas = Array.isArray(cert.normas) ? cert.normas : [];
  if (legacyNormas.length > 0 && badges.length > 0 && badges[0].normas.length === 0) {
    badges[0].normas = legacyNormas.map(n => ({ texto: n.texto || '', certificadoPdf: null }));
  }
  return badges;
}

function renderCertificacion(s) {
  const cert = s.certificacion || {};
  const badges = normalizeCertificacion(cert);
  if (badges.length === 0) return showSection('certificacion', false);

  const ARROW = '<svg class="cert-stack-norm-arrow" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const stackEl = document.querySelector('[data-slot="badges-list"]');
  stackEl.innerHTML = badges.map((b, i) => {
    const head = b.imagen
      ? `<img class="cert-badge-logo" src="${escapeHtml(b.imagen)}" alt="${escapeHtml(b.nombre || '')}">`
      : `<span class="cert-badge-name">${escapeHtml(b.nombre)}</span>${b.sub ? `<span class="cert-badge-sub">${escapeHtml(b.sub)}</span>` : ''}`;

    const normasHtml = b.normas.length > 0
      ? `<ul class="cert-stack-norms">${b.normas.map(n => {
          const text = escapeHtml(n.texto || '');
          const url = n.certificadoPdf?.dataUrl;
          return url
            ? `<li><a class="cert-stack-norm cert-stack-norm--link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${text}${ARROW}</a></li>`
            : `<li><span class="cert-stack-norm">${text}</span></li>`;
        }).join('')}</ul>`
      : '';

    return `
      <article class="cert-stack-card reveal-scale" data-delay="${i * 100}">
        <div class="cert-badge cert-badge--in-stack">${head}</div>
        ${normasHtml}
      </article>
    `;
  }).join('');

  showSection('certificacion', true);
}

function renderGaleria(s) {
  const items = Array.isArray(s.galeria) ? s.galeria : [];
  if (items.length === 0) return showSection('galeria', false);

  // Chunk into pages of 3 (1 row x 3 cols).
  const PAGE_SIZE = 3;
  const pages = [];
  for (let i = 0; i < items.length; i += PAGE_SIZE) {
    pages.push(items.slice(i, i + PAGE_SIZE));
  }
  const track = document.querySelector('[data-slot="galeria-list"]');
  track.innerHTML = pages.map((pageItems, p) => `
    <div class="gallery-page">
      ${pageItems.map((g, i) => `
        <div class="gallery-item reveal-scale" data-delay="${(p * PAGE_SIZE + i) * 80}">
          <img src="${escapeHtml(g.dataUrl)}" alt="${escapeHtml(g.caption || '')}">
          ${g.caption ? `<span class="gallery-caption">${escapeHtml(g.caption)}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');

  showSection('galeria', true);
  initGalleryCarousel(track, pages.length);
}

function initGalleryCarousel(track, pageCount) {
  const paginator = document.querySelector('[data-gallery-paginator]');
  const prev = document.querySelector('[data-gallery-prev]');
  const next = document.querySelector('[data-gallery-next]');
  const counter = document.querySelector('[data-gallery-counter]');
  if (!track || !paginator || !prev || !next || !counter) return;

  if (pageCount <= 1) {
    paginator.hidden = true;
    return;
  }
  paginator.hidden = false;

  const pageWidth = () => track.clientWidth;
  const currentPage = () => Math.round(track.scrollLeft / Math.max(pageWidth(), 1)) + 1;
  const update = () => {
    const p = currentPage();
    counter.textContent = `${p} / ${pageCount}`;
    prev.disabled = p <= 1;
    next.disabled = p >= pageCount;
  };

  prev.onclick = () => track.scrollBy({ left: -pageWidth(), behavior: 'smooth' });
  next.onclick = () => track.scrollBy({ left: pageWidth(), behavior: 'smooth' });
  track.onscroll = () => update();
  window.addEventListener('resize', update);
  update();
}

async function init() {
  const slug = getSlug();
  if (!slug) {
    showState('error');
    return;
  }

  showState('loading');

  let service;
  try {
    service = await fetchService(slug);
  } catch (err) {
    console.error('[public-service] fetch error:', err);
    showState('error');
    return;
  }

  if (!service) {
    showState('error');
    return;
  }

  renderHero(service);
  renderSolucion(service);
  renderGeometrias(service);
  renderCertificacion(service);
  renderGaleria(service);

  showState('ok');
  if (stateLoading) stateLoading.hidden = true;
  root.classList.add('is-ready');

  if (window.MTEC && typeof window.MTEC.initReveals === 'function') {
    window.MTEC.initReveals();
  }
}

init();
