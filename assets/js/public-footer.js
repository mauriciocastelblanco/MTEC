// ══════════════════════════════════════════════════════════════════
// public-footer.js — repopulates the footer's "Servicios" column from
// Supabase. As services are published in the admin they appear here
// automatically, alphabetically, capped at MAX_ITEMS so the footer
// never grows unbounded; a "Ver todos los servicios" link always
// closes the list. Runs after partials/footer.html has been mounted.
// If the fetch fails, the static markup in partials/footer.html stays
// as a graceful fallback.
// ══════════════════════════════════════════════════════════════════
import { supabasePublic } from './supabase-public.js';

const MAX_ITEMS = 6;
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

const ARROW = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function buildItem(s) {
  const href = `${PREFIX}servicios/${encodeURIComponent(s.slug)}`;
  return `<li><a href="${href}">${escapeHtml(s.titulo)}</a></li>`;
}

function buildMoreLink() {
  return `
    <li class="footer-links-more">
      <a href="${PREFIX}que-hacemos.html">
        Ver todos los servicios
        ${ARROW}
      </a>
    </li>
  `;
}

async function fetchServicios() {
  const { data, error } = await supabasePublic
    .from('servicios')
    .select('slug, titulo')
    .eq('estado', 'publicado')
    .order('titulo', { ascending: true })
    .limit(MAX_ITEMS);
  if (error) throw error;
  return data || [];
}

function populate(list, items) {
  if (items.length === 0) {
    list.innerHTML = '<li><span class="footer-link-static">Próximamente</span></li>';
    return;
  }
  list.innerHTML = items.map(buildItem).join('') + buildMoreLink();
}

async function refresh(list) {
  try {
    populate(list, await fetchServicios());
    document.dispatchEvent(new CustomEvent('mtec:footer-services-ready'));
  } catch (err) {
    console.warn('[public-footer] could not fetch services, leaving static fallback:', err);
  }
}

// The footer is mounted asynchronously by MTEC.loadPartial, so wait for
// the list to appear in the DOM before touching it.
function whenFooterMounted(cb) {
  const found = () => document.querySelector('[data-footer-servicios]');
  if (found()) {
    cb(found());
    return;
  }
  const obs = new MutationObserver(() => {
    const list = found();
    if (list) {
      obs.disconnect();
      cb(list);
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  // Safety: bail after 5s.
  setTimeout(() => obs.disconnect(), 5000);
}

whenFooterMounted(refresh);
