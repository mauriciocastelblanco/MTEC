import { getServicios, deleteServicio } from './admin-data.js';

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
