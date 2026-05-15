import { getServicios, deleteServicio, slugify } from './admin-data.js';

function fmtTime(iso) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'hace unos segundos';
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `hace ${days} días`;
  return d.toLocaleDateString('es-CL');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderDashboard(root, servicios) {
  if (servicios.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <h2>Aún no tienes servicios</h2>
        <p>Crea el primero para empezar a poblar la página de Qué Hacemos.</p>
        <a href="servicio.html" class="btn btn-primary">+ Nuevo servicio</a>
      </div>
    `;
    return;
  }

  const rows = servicios.map(s => `
    <tr class="row-clickable" data-slug="${escapeHtml(s.slug)}">
      <td class="col-slug">${escapeHtml(s.slug)}</td>
      <td class="col-title">${escapeHtml(s.titulo)}</td>
      <td><span class="chip-estado chip-${s.estado}">${s.estado === 'publicado' ? 'Publicado' : 'Borrador'}</span></td>
      <td class="col-edited">${fmtTime(s.fechaEdicion)}</td>
      <td class="col-actions">
        <a href="../servicios/${escapeHtml(s.slug)}.html" target="_blank" rel="noopener noreferrer" class="btn btn-ghost" data-action="view">Ver pública</a>
        <a href="servicio.html?slug=${escapeHtml(s.slug)}" class="btn btn-ghost" data-action="edit">Editar</a>
        <button class="btn btn-danger" data-action="delete" data-slug="${escapeHtml(s.slug)}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  root.innerHTML = `
    <div class="table-wrap">
      <table class="admin-table">
        <thead><tr>
          <th>Slug</th><th>Título</th><th>Estado</th><th>Última edición</th><th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  root.querySelectorAll('tr.row-clickable').forEach(tr => {
    tr.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      window.location.href = `servicio.html?slug=${tr.dataset.slug}`;
    });
  });

  root.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const slug = btn.dataset.slug;
      if (!confirm(`¿Eliminar el servicio "${slug}"? Esta acción no se puede deshacer.`)) return;
      await deleteServicio(slug);
      const next = await getServicios();
      renderDashboard(root, next);
    });
  });
}

async function init() {
  const root = document.getElementById('dashboardRoot');
  if (!root) return;
  const servicios = await getServicios();
  renderDashboard(root, servicios);
}

init();

// ── FORM PAGE ─────────────────────────────────────────
function initFormPage() {
  const tabsBar = document.getElementById('tabsBar');
  if (!tabsBar) return;

  const panes = document.querySelectorAll('.tab-pane');

  tabsBar.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const tab = btn.dataset.tab;

    tabsBar.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('is-active', b === btn));
    panes.forEach(p => p.classList.toggle('is-active', p.dataset.pane === tab));
  });
}

initFormPage();

// ══════════════════════════════════════════════════════
// FORM STATE + INTERACTIONS
// ══════════════════════════════════════════════════════
let isDirty = false;
function markDirty() { isDirty = true; }

function initHeroTab() {
  const titulo = document.getElementById('f-titulo');
  const slug = document.getElementById('f-slug');
  if (!titulo || !slug) return;

  // Auto-slug from title when slug is empty
  titulo.addEventListener('blur', () => {
    if (!slug.value && titulo.value) slug.value = slugify(titulo.value);
  });
  // Force slug formatting when user types in it
  slug.addEventListener('input', () => {
    slug.value = slug.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  });

  // All text inputs / textareas in form mark dirty
  document.querySelectorAll('#formRoot input, #formRoot textarea, #formRoot select').forEach(el => {
    el.addEventListener('input', markDirty);
  });

  // Image upload preview
  document.querySelectorAll('input[type="file"][data-upload]').forEach(input => {
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const key = input.dataset.upload;
      const preview = document.querySelector(`[data-preview="${key}"]`);
      const warn = document.querySelector(`[data-warn="${key}"]`);

      const reader = new FileReader();
      reader.onload = ev => {
        preview.innerHTML = `<img src="${ev.target.result}" alt="">`;
        if (ev.target.result.length > 2_000_000) {
          warn.hidden = false;
          warn.textContent = `Imagen pesada (${Math.round(ev.target.result.length / 1024)} KB en base64). Considera optimizarla.`;
        } else {
          warn.hidden = true;
        }
      };
      reader.readAsDataURL(file);
      markDirty();
    });
  });

  // Collapsible callout
  document.querySelectorAll('[data-toggle]').forEach(head => {
    head.addEventListener('click', () => {
      const target = document.getElementById(head.dataset.toggle);
      if (!target) return;
      const open = target.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
}

initHeroTab();

// Warn on unsaved changes
window.addEventListener('beforeunload', e => {
  if (!isDirty) return;
  e.preventDefault();
  e.returnValue = '';
});

// ══════════════════════════════════════════════════════
// ICONS — set predefinido reutilizado en beneficios y geometrías
// ══════════════════════════════════════════════════════
const ICONS = {
  shield:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  gauge:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 5V3"/><path d="M12 13l4-4"/></svg>',
  layers:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  thermometer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z"/></svg>',
  clock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  pipe:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="9" width="20" height="6" rx="1"/></svg>',
  elbow:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V11a8 8 0 0 1 8-8h10"/></svg>',
  tee:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h18M12 12v9"/></svg>',
  reducer:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8h8l4 4 8 4M2 16h8l4-4 8-4"/></svg>',
  flange:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
  circumferential: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/></svg>',
  longitudinal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="3 3"/></svg>',
  irregular: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12 Q 6 4, 10 12 T 18 12 T 22 12"/></svg>'
};

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }

function iconPickerHtml(name, selected) {
  const sel = (selected && ICONS[selected]) ? selected : 'shield';
  const opts = Object.keys(ICONS).map(k => `
    <button type="button" class="icon-picker-opt ${k === sel ? 'is-selected' : ''}" data-icon="${k}" data-field="${name}" title="${k}" aria-label="${k}">${ICONS[k]}</button>
  `).join('');
  return `
    <div class="icon-picker is-collapsed" data-picker="${name}">
      <button type="button" class="icon-picker-trigger" data-trigger="${name}" aria-expanded="false">
        <span class="icon-slot" data-icon-slot>${ICONS[sel]}</span>
        <span data-current="${name}">${sel}</span>
      </button>
      <div class="icon-picker-grid">${opts}</div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════
// REPEATERS
// ══════════════════════════════════════════════════════
const repeaterRenderers = {
  beneficios(item = { icono: 'shield', label: '', chip: '' }) {
    return `
      <div class="repeater-item">
        <div class="repeater-drag" aria-hidden="true">⋮⋮</div>
        <div class="repeater-fields">
          <div class="field">
            <label>Icono</label>
            ${iconPickerHtml('beneficio-icono', item.icono)}
          </div>
          <div class="field">
            <label>Label</label>
            <input type="text" data-rk="label" value="${escapeAttr(item.label)}" placeholder="Sin detener el flujo">
          </div>
          <div class="field">
            <label>Chip / etiqueta</label>
            <input type="text" data-rk="chip" value="${escapeAttr(item.chip)}" placeholder="En operación">
          </div>
        </div>
        <button type="button" class="repeater-remove" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
  consideraciones(item = { titulo: '', descripcion: '' }) {
    return `
      <div class="repeater-item">
        <div class="repeater-drag" aria-hidden="true">⋮⋮</div>
        <div class="repeater-fields">
          <div class="field">
            <label>Título</label>
            <input type="text" data-rk="titulo" value="${escapeAttr(item.titulo)}" placeholder="Tipo de daño">
          </div>
          <div class="field">
            <label>Descripción</label>
            <textarea data-rk="descripcion" placeholder="Corrosión externa, mecánica, abolladuras...">${escapeAttr(item.descripcion)}</textarea>
          </div>
        </div>
        <button type="button" class="repeater-remove" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
  geometrias(item = { nombre: '', icono: 'pipe' }) {
    return `
      <div class="repeater-item">
        <div class="repeater-drag" aria-hidden="true">⋮⋮</div>
        <div class="repeater-fields">
          <div class="field">
            <label>Nombre</label>
            <input type="text" data-rk="nombre" value="${escapeAttr(item.nombre)}" placeholder="Codos">
          </div>
          <div class="field">
            <label>Icono</label>
            ${iconPickerHtml('geometria-icono', item.icono)}
          </div>
        </div>
        <button type="button" class="repeater-remove" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
  badges(item = { nombre: '' }) {
    return `
      <div class="repeater-item">
        <div class="repeater-drag" aria-hidden="true">⋮⋮</div>
        <div class="repeater-fields">
          <div class="field">
            <label>Nombre</label>
            <input type="text" data-rk="nombre" value="${escapeAttr(item.nombre)}" placeholder="API">
          </div>
        </div>
        <button type="button" class="repeater-remove" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
  normas(item = { texto: '' }) {
    return `
      <div class="repeater-item">
        <div class="repeater-drag" aria-hidden="true">⋮⋮</div>
        <div class="repeater-fields">
          <div class="field">
            <label>Norma</label>
            <input type="text" data-rk="texto" value="${escapeAttr(item.texto)}" placeholder="ASME PCC-2 Art. 4.1">
          </div>
        </div>
        <button type="button" class="repeater-remove" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
};

function initRepeater(containerId, key) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.dataset.repeaterKey = key;

  container.addEventListener('click', e => {
    if (e.target.closest('.repeater-remove')) {
      e.target.closest('.repeater-item').remove();
      markDirty();
      return;
    }
    const trigger = e.target.closest('.icon-picker-trigger');
    if (trigger) {
      const picker = trigger.closest('.icon-picker');
      picker.classList.toggle('is-collapsed');
      trigger.setAttribute('aria-expanded', picker.classList.contains('is-collapsed') ? 'false' : 'true');
      return;
    }
    const opt = e.target.closest('.icon-picker-opt');
    if (opt) {
      const picker = opt.closest('.icon-picker');
      picker.querySelectorAll('.icon-picker-opt').forEach(o => o.classList.toggle('is-selected', o === opt));
      const trig = picker.querySelector('.icon-picker-trigger');
      const slot = trig.querySelector('[data-icon-slot]');
      if (slot) slot.innerHTML = ICONS[opt.dataset.icon] || '';
      trig.querySelector('[data-current]').textContent = opt.dataset.icon;
      picker.classList.add('is-collapsed');
      trig.setAttribute('aria-expanded', 'false');
      markDirty();
      return;
    }
  });

  container.addEventListener('input', e => {
    if (e.target.closest('.repeater-item')) markDirty();
  });
}

function initRepeaterAddButtons() {
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.add;
      const renderer = repeaterRenderers[key];
      if (!renderer) return;
      const container = document.querySelector(`[data-repeater-key="${key}"]`);
      if (!container) return;
      container.insertAdjacentHTML('beforeend', renderer());
      markDirty();
    });
  });
}

initRepeater('repeaterBeneficios', 'beneficios');
initRepeater('repeaterConsideraciones', 'consideraciones');
initRepeater('repeaterGeometrias', 'geometrias');
initRepeater('repeaterBadges', 'badges');
initRepeater('repeaterNormas', 'normas');
initRepeaterAddButtons();

function initPdfUploads() {
  document.querySelectorAll('input[type="file"][data-pdf-input]').forEach(input => {
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const key = input.dataset.pdfInput;
      const nameEl = document.querySelector(`[data-name="${key}"]`);
      const sizeEl = document.querySelector(`[data-size="${key}"]`);
      if (nameEl) nameEl.textContent = file.name;
      if (sizeEl) sizeEl.textContent = `${Math.round(file.size / 1024)} KB · listo para guardar`;
      markDirty();
    });
  });
}

initPdfUploads();
