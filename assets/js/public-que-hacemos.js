// ══════════════════════════════════════════════════════════════════
// public-que-hacemos.js — populates the services list under each
// business line on que-hacemos.html from Supabase. Each linea-card
// has a sibling container `[data-services-for="<categoria>"]` that
// receives the published services for that category. Empty
// categories fall back to a "Próximamente" placeholder.
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

const ARROW = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function buildServiceItem(s) {
  const href = `${PREFIX}servicios/${encodeURIComponent(s.slug)}`;
  return `
    <a class="linea-service" href="${href}">
      <span class="linea-service-name">${escapeHtml(s.titulo)}</span>
      <span class="linea-service-arrow" aria-hidden="true">${ARROW}</span>
    </a>
  `;
}

function renderList(container, items) {
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = '<div class="linea-services-empty">Próximamente</div>';
    return;
  }
  container.innerHTML = items.map(buildServiceItem).join('');
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

function observeReveals(root) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = root.querySelectorAll('.reveal');
  if (reducedMotion) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(({ isIntersecting, target }) => {
      target.classList.toggle('visible', isIntersecting);
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
}

async function init() {
  const containers = document.querySelectorAll('[data-services-for]');
  if (containers.length === 0) return;

  try {
    const groups = await fetchServiciosByCategoria();
    containers.forEach(c => {
      const key = c.dataset.servicesFor;
      renderList(c, groups[key] || []);
      observeReveals(c);
    });
  } catch (err) {
    console.warn('[public-que-hacemos] could not load services, leaving fallback:', err);
  }
}

init();
