// ══════════════════════════════════════════════════════════════════
// admin-contactos.js — list, filter, view, update and delete contact
// form submissions. Auth is handled by auth-init.js; this module
// assumes the user is authenticated (RLS gives authenticated all
// rights on the contactos table).
// ══════════════════════════════════════════════════════════════════

import { supabase } from './supabase-client.js';

const ESTADO_LABEL = {
  nuevo:      'Nuevo',
  leido:      'Leído',
  respondido: 'Respondido',
  archivado:  'Archivado',
};

const SECTOR_FALLBACK = '—';

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtRelative(iso) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1)  return 'hace unos segundos';
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `hace ${days} días`;
  return d.toLocaleDateString('es-CL');
}

function fmtFullDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function truncate(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// ── DATA ──────────────────────────────────────────────────────────

async function fetchContactos() {
  // is_test = true is used by the daily keepalive cron to keep the
  // free-tier project warm. Those rows must not appear in the inbox.
  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .eq('is_test', false)
    .order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updateContactoEstado(id, estado) {
  const { error } = await supabase
    .from('contactos')
    .update({ estado })
    .eq('id', id);
  if (error) throw error;
}

async function deleteContacto(id) {
  const { error } = await supabase
    .from('contactos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── STATE ─────────────────────────────────────────────────────────

const state = {
  contactos: [],
  filter:    'todos',
  currentId: null,
};

// ── RENDER ────────────────────────────────────────────────────────

const root = document.querySelector('[data-contactos-root]');
const filterBar = document.querySelector('[data-filter-bar]');
const sidebarBadge = document.querySelector('[data-sidebar-unread]');

function renderTable() {
  const filtered = state.filter === 'todos'
    ? state.contactos
    : state.contactos.filter(c => c.estado === state.filter);

  if (state.contactos.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <h2>Aún no hay solicitudes</h2>
        <p>Cuando alguien envíe el formulario público aparecerá aquí.</p>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <h2>Sin resultados</h2>
        <p>No hay contactos en estado <strong>${escapeHtml(ESTADO_LABEL[state.filter] || state.filter)}</strong>.</p>
      </div>
    `;
    return;
  }

  const rows = filtered.map(c => `
    <tr data-id="${escapeHtml(c.id)}" class="${c.estado === 'nuevo' ? 'is-unread' : ''}">
      <td class="col-estado">
        ${c.estado === 'nuevo' ? '<span class="unread-dot" aria-label="No leído" title="No leído"></span>' : ''}
        <span class="chip-contacto chip-${escapeHtml(c.estado)}">${escapeHtml(ESTADO_LABEL[c.estado] || c.estado)}</span>
      </td>
      <td class="col-nombre">${escapeHtml(c.nombre)}</td>
      <td class="col-empresa">${escapeHtml(c.empresa || SECTOR_FALLBACK)}</td>
      <td class="col-sector">${escapeHtml(c.sector || SECTOR_FALLBACK)}</td>
      <td class="col-preview">${escapeHtml(truncate(c.mensaje, 90))}</td>
      <td class="col-fecha" title="${escapeHtml(fmtFullDate(c.fecha_creacion))}">${escapeHtml(fmtRelative(c.fecha_creacion))}</td>
    </tr>
  `).join('');

  root.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table admin-table--rows">
        <thead><tr>
          <th class="col-estado">Estado</th>
          <th>Nombre</th>
          <th>Empresa</th>
          <th>Sector</th>
          <th>Mensaje</th>
          <th class="col-fecha">Recibido</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  root.querySelectorAll('tbody tr').forEach(tr => {
    tr.addEventListener('click', () => openModal(tr.dataset.id));
  });
}

function renderCounts() {
  const counts = state.contactos.reduce((acc, c) => {
    acc.todos = (acc.todos || 0) + 1;
    acc[c.estado] = (acc[c.estado] || 0) + 1;
    return acc;
  }, {});
  document.querySelectorAll('[data-count]').forEach(el => {
    const k = el.dataset.count;
    el.textContent = counts[k] || 0;
  });
  // Update sidebar badge with the "nuevo" count.
  if (sidebarBadge) {
    const nuevos = counts.nuevo || 0;
    sidebarBadge.textContent = String(nuevos);
    sidebarBadge.hidden = nuevos === 0;
  }
}

function applyActiveFilter() {
  document.querySelectorAll('.filter-pill').forEach(p => {
    const active = p.dataset.filter === state.filter;
    p.classList.toggle('is-active', active);
    p.setAttribute('aria-selected', String(active));
  });
}

filterBar?.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-pill');
  if (!btn) return;
  state.filter = btn.dataset.filter;
  applyActiveFilter();
  renderTable();
});

// ── MODAL ─────────────────────────────────────────────────────────

const modalBackdrop = document.querySelector('[data-modal-backdrop]');
const modal         = document.querySelector('[data-modal]');
const modalClose    = document.querySelector('[data-modal-close]');
const deleteBtn     = modal.querySelector('[data-action="delete"]');
const replyLink     = modal.querySelector('[data-slot="reply-link"]');
const radios        = modal.querySelectorAll('input[name="estadoRadio"]');

function setSlot(name, value) {
  const el = modal.querySelector(`[data-slot="${name}"]`);
  if (el) el.textContent = value ?? '';
}

async function openModal(id) {
  const c = state.contactos.find(x => x.id === id);
  if (!c) return;
  state.currentId = id;

  setSlot('nombre', c.nombre);
  const empresaSector = [c.empresa, c.sector].filter(Boolean).join(' · ') || SECTOR_FALLBACK;
  setSlot('empresa-sector', empresaSector);
  setSlot('fecha', fmtFullDate(c.fecha_creacion));
  setSlot('mensaje', c.mensaje);

  // Email + reply link
  const emailEl = modal.querySelector('[data-slot="email-link"]');
  if (emailEl) {
    emailEl.textContent = c.email;
    emailEl.href = `mailto:${c.email}`;
  }
  if (replyLink) {
    const subject = encodeURIComponent('Re: tu consulta a MTEC');
    const body    = encodeURIComponent(
      `Hola ${c.nombre.split(' ')[0] || ''},\n\n` +
      `Gracias por escribirnos.\n\n` +
      `— Equipo MTEC\n\n` +
      `--\nMensaje original (${fmtFullDate(c.fecha_creacion)}):\n${c.mensaje}`
    );
    replyLink.href = `mailto:${c.email}?subject=${subject}&body=${body}`;
  }

  // Diagnostic
  const uaRow = modal.querySelector('[data-slot="user-agent-row"]');
  const uaEl  = modal.querySelector('[data-slot="user-agent"]');
  if (c.user_agent) {
    uaEl.textContent = c.user_agent;
    uaRow.hidden = false;
  } else {
    uaRow.hidden = true;
  }

  // Radio
  radios.forEach(r => { r.checked = r.value === c.estado; });

  modalBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';

  // Auto-mark as "leido" if it was "nuevo"
  if (c.estado === 'nuevo') {
    await changeEstadoOptimistic(id, 'leido');
  }
}

function closeModal() {
  modalBackdrop.hidden = true;
  state.currentId = null;
  document.body.style.overflow = '';
}

async function changeEstadoOptimistic(id, estado) {
  const idx = state.contactos.findIndex(c => c.id === id);
  if (idx === -1) return;
  const previous = state.contactos[idx].estado;
  if (previous === estado) return;

  // Optimistic update
  state.contactos[idx] = { ...state.contactos[idx], estado };
  renderCounts();
  renderTable();
  // Keep the modal radio in sync if the same record is open
  if (state.currentId === id) {
    radios.forEach(r => { r.checked = r.value === estado; });
  }

  try {
    await updateContactoEstado(id, estado);
  } catch (err) {
    console.error('[contactos] update estado failed:', err);
    // Roll back on error
    state.contactos[idx] = { ...state.contactos[idx], estado: previous };
    renderCounts();
    renderTable();
    if (state.currentId === id) {
      radios.forEach(r => { r.checked = r.value === previous; });
    }
    alert('No pudimos actualizar el estado. Intenta de nuevo.');
  }
}

radios.forEach(r => {
  r.addEventListener('change', () => {
    if (r.checked && state.currentId) {
      changeEstadoOptimistic(state.currentId, r.value);
    }
  });
});

modalClose?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalBackdrop.hidden) closeModal();
});

deleteBtn?.addEventListener('click', async () => {
  if (!state.currentId) return;
  const c = state.contactos.find(x => x.id === state.currentId);
  if (!c) return;
  if (!confirm(`¿Eliminar la solicitud de ${c.nombre}? Esta acción no se puede deshacer.`)) return;
  try {
    await deleteContacto(state.currentId);
    state.contactos = state.contactos.filter(x => x.id !== state.currentId);
    closeModal();
    renderCounts();
    renderTable();
  } catch (err) {
    console.error('[contactos] delete failed:', err);
    alert('No pudimos eliminar la solicitud. Intenta de nuevo.');
  }
});

// ── INIT ──────────────────────────────────────────────────────────

async function init() {
  try {
    state.contactos = await fetchContactos();
    applyActiveFilter();
    renderCounts();
    renderTable();
  } catch (err) {
    console.error('[contactos] init failed:', err);
    root.innerHTML = `
      <div class="empty-state">
        <h2>Error al cargar</h2>
        <p>${escapeHtml(err.message || 'No pudimos cargar los contactos.')}</p>
      </div>
    `;
  }
}

init();
