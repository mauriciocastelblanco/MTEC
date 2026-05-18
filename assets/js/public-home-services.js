// ══════════════════════════════════════════════════════════════════
// public-home-services.js — populates the chips of each service
// card on the home page from Supabase. As services are added in the
// admin, their titles appear automatically as chips under the matching
// category. Empty categories fall back to a "Próximamente" chip.
// ══════════════════════════════════════════════════════════════════
import { supabasePublic } from './supabase-public.js';

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function fetchPublishedServicios() {
  const { data, error } = await supabasePublic
    .from('servicios')
    .select('slug, titulo, categoria')
    .eq('estado', 'publicado')
    .order('titulo', { ascending: true });
  if (error) throw error;
  return data || [];
}

function renderChips(card, items) {
  const chipsEl = card.querySelector('.serv-card-tags');
  if (!chipsEl) return;
  if (items.length === 0) {
    chipsEl.innerHTML = '<span class="serv-card-soon">Próximamente</span>';
  } else {
    chipsEl.innerHTML = items
      .map(s => `<span>${escapeHtml(s.titulo)}</span>`)
      .join('');
  }
}

async function init() {
  const cards = document.querySelectorAll('.serv-card[data-category]');
  if (cards.length === 0) return;

  try {
    const servicios = await fetchPublishedServicios();
    const byCategory = servicios.reduce((acc, s) => {
      (acc[s.categoria] ||= []).push(s);
      return acc;
    }, {});
    cards.forEach(card => {
      renderChips(card, byCategory[card.dataset.category] || []);
    });
  } catch (err) {
    console.warn('[home-services] could not load services, leaving static fallback:', err);
  }
}

init();
