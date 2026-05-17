// ══════════════════════════════════════════════════════════════════
// public-nav.js — repopulates the navbar's "Servicios" sub-dropdowns
// from Supabase. Runs after nav.html has been mounted (nav.js raises
// `mtec:nav-ready`). If the fetch fails, the static markup in
// partials/nav.html stays as a graceful fallback.
// ══════════════════════════════════════════════════════════════════
import { supabasePublic } from './supabase-public.js';

const PREFIX = computePrefix();

function computePrefix() {
  const path = location.pathname;
  const segments = path.split('/').filter(Boolean);
  const fileCount = path.endsWith('/') ? 0 : 1;
  const depth = Math.max(0, segments.length - fileCount);
  return '../'.repeat(depth);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ARROW = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function buildSubitem(s) {
  const href = `${PREFIX}servicios/?slug=${encodeURIComponent(s.slug)}`;
  return `
    <a href="${href}" class="nav-dd-subitem" role="menuitem">
      <span class="nav-dd-sub-name">${escapeHtml(s.titulo)}</span>
      <span class="nav-dd-sub-arrow" aria-hidden="true">${ARROW}</span>
    </a>
  `;
}

function populatePanel(panelId, items) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  if (items.length === 0) {
    panel.innerHTML = '<div class="nav-dd-soon">Próximamente</div>';
    return;
  }
  panel.innerHTML = items.map(buildSubitem).join('');
}

async function fetchServiciosByCategoria() {
  const { data, error } = await supabasePublic
    .from('servicios')
    .select('slug, titulo, categoria')
    .eq('estado', 'publicado')
    .order('titulo', { ascending: true });
  if (error) throw error;
  const groups = { 'servicios-especializados': [], 'representacion': [], 'comercializacion': [] };
  (data || []).forEach(row => {
    if (groups[row.categoria]) groups[row.categoria].push(row);
  });
  return groups;
}

async function refresh() {
  try {
    const groups = await fetchServiciosByCategoria();
    populatePanel('ddServiciosEspecializados', groups['servicios-especializados']);
    populatePanel('ddRepresentacion', groups['representacion']);
    populatePanel('ddComercializacion', groups['comercializacion']);
    document.dispatchEvent(new CustomEvent('mtec:nav-services-ready'));
  } catch (err) {
    console.warn('[public-nav] could not fetch services, leaving static fallback:', err);
  }
}

// nav.js does not currently emit an event; instead we wait for the
// dynamic placeholders to appear in the DOM.
function whenNavMounted(cb) {
  if (document.getElementById('ddServiciosEspecializados')) {
    cb();
    return;
  }
  const obs = new MutationObserver(() => {
    if (document.getElementById('ddServiciosEspecializados')) {
      obs.disconnect();
      cb();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  // Safety: bail after 5s.
  setTimeout(() => obs.disconnect(), 5000);
}

whenNavMounted(refresh);
