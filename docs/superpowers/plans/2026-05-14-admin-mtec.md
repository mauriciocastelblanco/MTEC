# Admin MTEC — Maqueta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static admin UI under `/admin/` where a client can list/create/edit/delete service pages. Persistence via `localStorage`; no backend yet. UI mirrors all 7 sections of the public service template and follows the MTEC brand language but in a utilitarian admin tone.

**Architecture:** 4 static HTML pages (`admin/index.html`, `servicio.html`, `media.html`, `config.html`) sharing a CSS file (`admin/assets/css/admin.css`) and two JS files: `admin-data.js` (4 async functions wrapping localStorage; intercambiable por API después) and `admin-ui.js` (tabs, repeaters, image preview, save flow, autoslug, beforeunload). No frameworks, no build step. Vanilla JS modules.

**Tech Stack:** Static HTML + CSS + vanilla JS (ES modules). Server: `node serve.mjs` on `localhost:1112` (already exists). Verification: visual via `node screenshot.mjs` + browser console checks. No test framework — this is a UI maqueta verified by sight.

**Spec:** [docs/superpowers/specs/2026-05-14-admin-mtec-design.md](../specs/2026-05-14-admin-mtec-design.md)

---

## File structure

```
admin/
  index.html                  Dashboard view
  servicio.html               Form view (?slug=X edits, no query = new)
  media.html                  Placeholder
  config.html                 Placeholder
  assets/
    css/admin.css             All admin styles (palette, layout, components, form)
    js/
      admin-data.js           getServicios, getServicio, saveServicio, deleteServicio + seed
      admin-ui.js             Tab switching, repeaters, image preview, save flow, autoslug
```

Each file has one clear responsibility. `admin-data.js` is the *only* file that touches `localStorage` — when we connect a real backend later, only this file changes.

---

## Task 1: Shared chrome (sidebar + topbar + banner) + base CSS

**Files:**
- Create: `admin/index.html` (skeleton only — real dashboard content comes in Task 3)
- Create: `admin/assets/css/admin.css`

**Goal:** Render the admin layout shell (sidebar, topbar, "Modo maqueta" banner) with a placeholder main content area. No data yet.

- [ ] **Step 1: Create `admin/assets/css/admin.css` with palette, reset, layout, sidebar, topbar, banner**

```css
/* ══════════════════════════════════════════════════════════════════
   MTEC Admin — admin.css
   Local re-declaration of brand palette + admin chrome + form components.
   No reuse of public site CSS (separate visual universe).
   ══════════════════════════════════════════════════════════════════ */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:           #0F1B2A;
  --bg-elevated: #0B1A28;
  --acero:       #1B6CA8;
  --acero-light: #2B82B9;
  --acero-deep:  #0B3554;
  --vapor:       #EDF1F5;
  --platino:     #B2BEC9;
  --plomo:       rgba(255,255,255,0.55);
  --border:      rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.20);
  --surface:     rgba(255,255,255,0.04);
  --surface-hover: rgba(255,255,255,0.06);

  --green:       rgba(34,197,94,0.20);
  --green-border:rgba(34,197,94,0.40);
  --amber-bg:    rgba(251,191,36,0.10);
  --amber-border:rgba(251,191,36,0.30);
  --amber-text:  #FBBF24;

  --radius:      6px;
  --transition:  150ms ease;
}

html { -webkit-text-size-adjust: 100%; }
body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 400; font-size: 14px; line-height: 1.5;
  color: var(--vapor);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
a { text-decoration: none; color: inherit; }
button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; }
input, textarea, select { font: inherit; color: inherit; }
img { max-width: 100%; display: block; }

/* ── LAYOUT ────────────────────────────────────────── */
.admin-shell { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }

.sidebar {
  background: var(--bg-elevated);
  border-right: 1px solid var(--border);
  padding: 24px 0;
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh;
}
.sidebar-logo { padding: 0 20px 24px; }
.sidebar-logo img { height: 32px; width: auto; }
.sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }
.sidebar-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: var(--radius);
  font-size: 13.5px; color: var(--plomo);
  transition: background var(--transition), color var(--transition);
}
.sidebar-item:hover { background: var(--surface-hover); color: var(--vapor); }
.sidebar-item.is-active {
  background: rgba(43,130,185,0.15); color: var(--vapor);
  position: relative;
}
.sidebar-item.is-active::before {
  content: ''; position: absolute; left: -8px; top: 6px; bottom: 6px;
  width: 3px; background: var(--acero-light); border-radius: 2px;
}
.sidebar-item svg { width: 16px; height: 16px; flex-shrink: 0; }

.sidebar-spacer { flex: 1; }
.sidebar-foot { padding: 0 8px 8px; }

/* ── MAIN ──────────────────────────────────────────── */
.admin-main { display: flex; flex-direction: column; min-width: 0; }

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 32px; border-bottom: 1px solid var(--border);
  background: var(--bg);
}
.topbar-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--plomo); }
.topbar-breadcrumb a { color: var(--plomo); transition: color var(--transition); }
.topbar-breadcrumb a:hover { color: var(--vapor); }
.topbar-breadcrumb .sep { color: rgba(255,255,255,0.30); }
.topbar-breadcrumb .current { color: var(--vapor); font-weight: 500; }

.topbar-user {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--surface); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
}

/* ── BANNER MODO MAQUETA ──────────────────────────── */
.admin-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 32px;
  background: var(--amber-bg);
  border-bottom: 1px solid var(--amber-border);
  font-size: 13px;
}
.admin-banner svg { width: 16px; height: 16px; color: var(--amber-text); flex-shrink: 0; }
.admin-banner span { color: var(--vapor); }

/* ── CONTENT WRAP ─────────────────────────────────── */
.admin-content { padding: 32px; max-width: 1280px; width: 100%; }
.admin-content h1 { font-size: 24px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 4px; }
.admin-content .page-description { color: var(--plomo); font-size: 14px; margin-bottom: 28px; }
```

- [ ] **Step 2: Create `admin/index.html` with the shared chrome**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin MTEC — Servicios</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/admin.css">
</head>
<body>

<div class="admin-shell">

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <img src="../deliverables/logos/PNG/Logo MTEC_final_Blanco.png" alt="MTEC">
    </div>
    <nav class="sidebar-nav">
      <a href="index.html" class="sidebar-item is-active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Servicios
      </a>
      <a href="media.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        Media
      </a>
      <a href="config.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Configuración
      </a>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-foot">
      <a href="../index.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver al sitio público
      </a>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="admin-main">

    <div class="topbar">
      <div class="topbar-breadcrumb">
        <span class="current">Servicios</span>
      </div>
      <div class="topbar-user">M</div>
    </div>

    <div class="admin-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Modo maqueta — los servicios que crees aquí se guardan en tu navegador. No aparecerán todavía en el sitio público; eso se activa cuando conectemos la base de datos.</span>
    </div>

    <div class="admin-content">
      <h1>Servicios</h1>
      <p class="page-description">Crea, edita y publica las páginas de servicio que aparecen en la navbar.</p>
      <!-- Tabla viene en Task 3 -->
    </div>

  </main>

</div>

</body>
</html>
```

- [ ] **Step 3: Verify visually**

Confirm dev server is running on `localhost:1112` (no need to restart):

```bash
curl -s -o NUL -w "%{http_code}\n" http://localhost:1112/admin/index.html
```

Expected: `200`.

Run:
```bash
node screenshot.mjs http://localhost:1112/admin/index.html admin-chrome
```

Open the resulting PNG. Verify:
- Sidebar on left (~240px) with logo, 3 nav items (Servicios highlighted with blue bar), separator, "Volver al sitio público" at bottom.
- Topbar across top with "Servicios" breadcrumb and "M" avatar circle on the right.
- Amber banner under topbar with info icon and "Modo maqueta..." text.
- Empty content area with "Servicios" h1 and description.
- Dark blue background `#0F1B2A`.

- [ ] **Step 4: Commit**

```bash
git add admin/index.html admin/assets/css/admin.css
git commit -m "feat(admin): admin shell — sidebar, topbar, modo maqueta banner"
```

---

## Task 2: Persistence layer — `admin-data.js` with seed

**Files:**
- Create: `admin/assets/js/admin-data.js`

**Goal:** Expose 4 async functions wrapping `localStorage` + a seed for `encintado-de-lineas`. The only file that touches `localStorage`.

- [ ] **Step 1: Create `admin/assets/js/admin-data.js`**

```js
// ══════════════════════════════════════════════════════════════════
// admin-data.js — única capa que toca localStorage
// Para migrar a API: reemplazar el cuerpo de las 4 funciones por fetch().
// ══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'mtec_admin_servicios';

const SEED = [{
  slug: 'encintado-de-lineas',
  titulo: 'Encintado de Líneas',
  eyebrow: 'Servicio Especializado · Operación',
  lead: 'Sistema de matriz compuesta basado en fibra de carbono que rehabilita y restablece la capacidad MAOP original de tubos y tuberías con daños, corrosión o erosión — sin necesidad de detener el flujo.',
  estado: 'publicado',
  fechaCreacion: '2026-05-01T10:00:00Z',
  fechaEdicion: '2026-05-14T22:30:00Z',
  hero: {
    imagen: '../brand_assets/site_pictures/servicios_especializados.png',
    productCallout: {
      textoSuperior: 'Tecnología aplicada',
      nombreProducto: 'Iridium Wrap',
      textoInferior: 'AKKAIM INTEGRITY',
      imagen: ''
    }
  },
  solucion: {
    titulo: 'La solución',
    descripcion: 'Matriz compuesta de fibra de carbono curada en sitio que restituye la capacidad estructural de la tubería sin paro de operación.',
    metricaClave: { valor: 'MAOP', label: 'original' },
    beneficios: [
      { icono: 'shield', label: 'Sin detener el flujo', chip: 'En operación' },
      { icono: 'check', label: 'Restituye MAOP original', chip: 'Estructural' },
      { icono: 'gauge', label: 'Resistente a altas presiones', chip: 'Hasta 1500 psi' },
      { icono: 'layers', label: 'Múltiples capas compuestas', chip: 'Diseño a medida' },
      { icono: 'thermometer', label: 'Tolerante a temperatura', chip: '-29 a 149°C' },
      { icono: 'clock', label: 'Vida útil extendida', chip: '20+ años' }
    ]
  },
  consideraciones: {
    titulo: 'Consideraciones técnicas',
    lead: 'Variables que evaluamos en la ingeniería previa para diseñar el encintado correcto.',
    items: [
      { titulo: 'Tipo de daño', descripcion: 'Corrosión externa, mecánica, abolladuras, fisuras longitudinales o erosión interna.' },
      { titulo: 'Geometría de la tubería', descripcion: 'Rectos, codos, tees, reducciones, bridas y conexiones especiales.' },
      { titulo: 'Presión de operación', descripcion: 'MAOP, presión de prueba hidrostática y régimen de operación.' },
      { titulo: 'Temperatura', descripcion: 'Temperatura del fluido y exposición ambiental.' },
      { titulo: 'Producto transportado', descripcion: 'Compatibilidad química con la matriz seleccionada.' },
      { titulo: 'Normativa aplicable', descripcion: 'ASME PCC-2, ISO 24817, API 570 según industria y jurisdicción.' }
    ]
  },
  geometrias: {
    titulo: 'Geometrías aplicables',
    descripcion: 'El sistema se adapta a múltiples configuraciones de tubería y accesorios.',
    items: [
      { nombre: 'Tubería recta', icono: 'pipe' },
      { nombre: 'Codos', icono: 'elbow' },
      { nombre: 'Tees', icono: 'tee' },
      { nombre: 'Reducciones', icono: 'reducer' },
      { nombre: 'Bridas', icono: 'flange' },
      { nombre: 'Defectos circunferenciales', icono: 'circumferential' },
      { nombre: 'Defectos longitudinales', icono: 'longitudinal' },
      { nombre: 'Superficies irregulares', icono: 'irregular' }
    ]
  },
  certificacion: {
    badges: [{ nombre: 'API' }, { nombre: 'ASME' }, { nombre: 'ISO' }],
    normas: [
      { texto: 'ASME PCC-2 Art. 4.1' },
      { texto: 'ISO 24817 Clase 1, 2 y 3' },
      { texto: 'API 570' },
      { texto: 'API 1160' }
    ],
    fichaTecnicaPdf: { nombre: 'IridiumWrap - TDS (Spanish).pdf', dataUrl: '../deliverables/fichas-tecnicas/IridiumWrap%20-%20TDS%20(Spanish).pdf' },
    certificadosPdf: null
  },
  galeria: [],
  cta: { headline: '¿Tu activo necesita esta solución?', botonTexto: 'Agenda una reunión' }
}];

function read() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return JSON.parse(JSON.stringify(SEED));
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('[admin-data] JSON corrupto, restaurando seed', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return JSON.parse(JSON.stringify(SEED));
  }
}

function write(servicios) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(servicios));
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      alert('Se llenó la memoria del navegador. Elimina servicios antiguos o imágenes pesadas antes de guardar.');
      throw err;
    }
    throw err;
  }
}

export async function getServicios() {
  return read();
}

export async function getServicio(slug) {
  const all = read();
  return all.find(s => s.slug === slug) ?? null;
}

export async function saveServicio(data) {
  if (!data.slug) throw new Error('saveServicio: slug requerido');
  if (!data.titulo) throw new Error('saveServicio: titulo requerido');

  const all = read();
  const idx = all.findIndex(s => s.slug === data.slug);
  const now = new Date().toISOString();

  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data, fechaEdicion: now };
  } else {
    all.push({ ...data, fechaCreacion: now, fechaEdicion: now });
  }
  write(all);
  return idx >= 0 ? all[idx] : all[all.length - 1];
}

export async function deleteServicio(slug) {
  const all = read();
  const next = all.filter(s => s.slug !== slug);
  if (next.length === all.length) return false;
  write(next);
  return true;
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 2: Verify in browser console**

Open `http://localhost:1112/admin/index.html` in browser, open devtools console, paste:

```js
import('./assets/js/admin-data.js').then(async (m) => {
  console.log('All:', await m.getServicios());
  console.log('Encintado:', await m.getServicio('encintado-de-lineas'));
  console.log('Missing:', await m.getServicio('foo'));
});
```

Expected:
- `All:` array with one object (encintado-de-lineas).
- `Encintado:` the full object.
- `Missing:` `null`.

Check `localStorage` in Application tab → Local Storage → `localhost:1112` → `mtec_admin_servicios` exists with seed.

- [ ] **Step 3: Commit**

```bash
git add admin/assets/js/admin-data.js
git commit -m "feat(admin): persistence layer with localStorage and seed"
```

---

## Task 3: Dashboard table + empty state + delete confirmation

**Files:**
- Modify: `admin/index.html` (replace placeholder content with table)
- Modify: `admin/assets/css/admin.css` (append table styles)
- Create: `admin/assets/js/admin-ui.js` (initial scaffold for dashboard rendering)

**Goal:** Show seeded service in a table. Empty state renders when no services. Wire up "Nuevo servicio", "Editar", "Eliminar" buttons.

- [ ] **Step 1: Append table + button styles to `admin/assets/css/admin.css`**

```css
/* ── BUTTONS ───────────────────────────────────────── */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 500; transition: background var(--transition), border-color var(--transition), transform var(--transition); white-space: nowrap; }
.btn svg { width: 14px; height: 14px; }
.btn-primary { background: var(--vapor); color: var(--acero-deep); }
.btn-primary:hover { background: #fff; transform: translateY(-1px); }
.btn-ghost { background: var(--surface); border: 1px solid var(--border); color: var(--vapor); }
.btn-ghost:hover { background: var(--surface-hover); border-color: var(--border-strong); }
.btn-danger { background: rgba(239,68,68,0.10); border: 1px solid rgba(239,68,68,0.40); color: #FCA5A5; }
.btn-danger:hover { background: rgba(239,68,68,0.20); }

/* ── PAGE HEADER ──────────────────────────────────── */
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.page-head h1 { margin-bottom: 4px; }
.page-head .page-description { margin-bottom: 0; }

/* ── TABLE ────────────────────────────────────────── */
.table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
table.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--plomo); background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); }
.admin-table td { padding: 14px 16px; font-size: 13.5px; border-bottom: 1px solid var(--border); }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr.row-clickable { cursor: pointer; transition: background var(--transition); }
.admin-table tr.row-clickable:hover { background: rgba(255,255,255,0.03); }
.admin-table .col-slug { font-family: ui-monospace, "JetBrains Mono", monospace; font-size: 12px; color: var(--platino); }
.admin-table .col-title { font-weight: 500; }
.admin-table .col-edited { color: var(--plomo); font-size: 12.5px; }
.admin-table .col-actions { text-align: right; width: 1%; white-space: nowrap; }
.admin-table .col-actions .btn { padding: 6px 10px; font-size: 12px; }
.admin-table .col-actions .btn + .btn { margin-left: 4px; }

.chip-estado { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
.chip-publicado { background: var(--green); border: 1px solid var(--green-border); color: #86EFAC; }
.chip-borrador { background: var(--surface); border: 1px solid var(--border); color: var(--plomo); }

/* ── EMPTY STATE ──────────────────────────────────── */
.empty-state { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 64px 32px; text-align: center; }
.empty-state svg { width: 48px; height: 48px; color: var(--plomo); margin-bottom: 16px; }
.empty-state h2 { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.empty-state p { color: var(--plomo); font-size: 13.5px; margin-bottom: 20px; }
```

- [ ] **Step 2: Replace `admin-content` block in `admin/index.html` with table markup**

Replace the existing `<div class="admin-content">...</div>` block with:

```html
    <div class="admin-content">
      <div class="page-head">
        <div>
          <h1>Servicios</h1>
          <p class="page-description">Crea, edita y publica las páginas de servicio que aparecen en la navbar.</p>
        </div>
        <a href="servicio.html" class="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo servicio
        </a>
      </div>

      <div id="dashboardRoot"></div>
    </div>
```

Add the JS module import right before `</body>`:

```html
<script type="module" src="assets/js/admin-ui.js"></script>
```

- [ ] **Step 3: Create `admin/assets/js/admin-ui.js` with the dashboard renderer**

```js
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
        <a href="../servicios/${escapeHtml(s.slug)}.html" target="_blank" class="btn btn-ghost" data-action="view">Ver pública</a>
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

  // Row click → navigate to edit (except when clicking buttons/links)
  root.querySelectorAll('tr.row-clickable').forEach(tr => {
    tr.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      window.location.href = `servicio.html?slug=${tr.dataset.slug}`;
    });
  });

  // Delete buttons
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
  if (!root) return; // Only dashboard has this
  const servicios = await getServicios();
  renderDashboard(root, servicios);
}

init();
```

- [ ] **Step 4: Verify**

Run:
```bash
node screenshot.mjs http://localhost:1112/admin/index.html admin-dashboard
```

Open the PNG. Verify:
- "+ Nuevo servicio" button top-right (white background).
- Table with header row (Slug · Título · Estado · Última edición · empty).
- One row: `encintado-de-lineas` · `Encintado de Líneas` · green "Publicado" chip · "hace X" · 3 buttons (Ver pública / Editar / Eliminar).

Open the page in a real browser and:
- Hover over the row → background brightens slightly.
- Click "Eliminar" → confirm dialog appears → cancel.
- Click "Eliminar" again → confirm → row disappears → empty state appears.
- Reload page → empty state still there (deletion persisted in localStorage).
- In devtools console: `localStorage.removeItem('mtec_admin_servicios')` then reload → seed re-applies, encintado row back.

- [ ] **Step 5: Commit**

```bash
git add admin/index.html admin/assets/css/admin.css admin/assets/js/admin-ui.js
git commit -m "feat(admin): dashboard with services table, delete, empty state"
```

---

## Task 4: Service form skeleton — chrome reuse + tabs nav + save bar + tab switching

**Files:**
- Create: `admin/servicio.html`
- Modify: `admin/assets/css/admin.css` (append form styles)
- Modify: `admin/assets/js/admin-ui.js` (add tab-switching logic — keep dashboard logic intact)

**Goal:** Render the form page with the same chrome, tabs row, and sticky save bar. Tabs switchable; no fields yet (each tab pane shows placeholder).

- [ ] **Step 1: Append form-shell styles to `admin/assets/css/admin.css`**

```css
/* ── FORM SHELL ───────────────────────────────────── */
.form-actions { display: flex; align-items: center; gap: 8px; }

.tabs-bar {
  display: flex; gap: 4px;
  padding: 12px 32px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 5;
  overflow-x: auto;
}
.tab-btn {
  padding: 8px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 500;
  color: var(--plomo);
  transition: background var(--transition), color var(--transition);
  white-space: nowrap;
}
.tab-btn:hover { color: var(--vapor); background: var(--surface); }
.tab-btn.is-active { background: var(--vapor); color: var(--acero-deep); }

.tab-pane { display: none; }
.tab-pane.is-active { display: block; }

.form-content { padding: 32px; max-width: 960px; padding-bottom: 120px; }

/* Sticky save bar */
.save-bar {
  position: fixed; left: 240px; right: 0; bottom: 0;
  padding: 16px 32px;
  background: rgba(15,27,42,0.92);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: 8px;
  z-index: 10;
}
```

- [ ] **Step 2: Create `admin/servicio.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin MTEC — Servicio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/admin.css">
</head>
<body>

<div class="admin-shell">

  <aside class="sidebar">
    <div class="sidebar-logo"><img src="../deliverables/logos/PNG/Logo MTEC_final_Blanco.png" alt="MTEC"></div>
    <nav class="sidebar-nav">
      <a href="index.html" class="sidebar-item is-active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Servicios
      </a>
      <a href="media.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        Media
      </a>
      <a href="config.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Configuración
      </a>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-foot">
      <a href="../index.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver al sitio público
      </a>
    </div>
  </aside>

  <main class="admin-main">

    <div class="topbar">
      <div class="topbar-breadcrumb">
        <a href="index.html">Servicios</a>
        <span class="sep">/</span>
        <span class="current" id="crumbCurrent">Nuevo servicio</span>
      </div>
      <div class="form-actions">
        <a href="index.html" class="btn btn-ghost">Cancelar</a>
        <button class="btn btn-ghost" id="btnDraftTop">Guardar borrador</button>
        <button class="btn btn-primary" id="btnPublishTop">Guardar y publicar</button>
      </div>
    </div>

    <div class="admin-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Modo maqueta — los servicios que crees aquí se guardan en tu navegador. No aparecerán todavía en el sitio público; eso se activa cuando conectemos la base de datos.</span>
    </div>

    <nav class="tabs-bar" id="tabsBar">
      <button class="tab-btn is-active" data-tab="hero">Hero</button>
      <button class="tab-btn" data-tab="solucion">Solución</button>
      <button class="tab-btn" data-tab="consideraciones">Consideraciones</button>
      <button class="tab-btn" data-tab="geometrias">Geometrías</button>
      <button class="tab-btn" data-tab="certificacion">Certificación</button>
      <button class="tab-btn" data-tab="galeria">Galería</button>
      <button class="tab-btn" data-tab="cta">CTA</button>
    </nav>

    <div class="form-content" id="formRoot">
      <div class="tab-pane is-active" data-pane="hero"><p>Hero fields — Task 5</p></div>
      <div class="tab-pane" data-pane="solucion"><p>Solución — Task 6</p></div>
      <div class="tab-pane" data-pane="consideraciones"><p>Consideraciones — Task 7</p></div>
      <div class="tab-pane" data-pane="geometrias"><p>Geometrías — Task 8</p></div>
      <div class="tab-pane" data-pane="certificacion"><p>Certificación — Task 9</p></div>
      <div class="tab-pane" data-pane="galeria"><p>Galería — Task 10</p></div>
      <div class="tab-pane" data-pane="cta"><p>CTA — Task 11</p></div>
    </div>

    <div class="save-bar">
      <a href="index.html" class="btn btn-ghost">Cancelar</a>
      <button class="btn btn-ghost" id="btnDraftBottom">Guardar borrador</button>
      <button class="btn btn-primary" id="btnPublishBottom">Guardar y publicar</button>
    </div>

  </main>

</div>

<script type="module" src="assets/js/admin-ui.js"></script>
</body>
</html>
```

- [ ] **Step 3: Append tab-switching to `admin/assets/js/admin-ui.js`**

Append at the end of `admin-ui.js` (after the `init();` call):

```js
// ── FORM PAGE ─────────────────────────────────────────
function initFormPage() {
  const tabsBar = document.getElementById('tabsBar');
  if (!tabsBar) return; // Only form page has tabs

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
```

- [ ] **Step 4: Verify**

Run:
```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-skeleton
```

Open PNG. Verify:
- Same sidebar/topbar/banner chrome.
- Breadcrumb says "Servicios / Nuevo servicio".
- Three buttons in topbar: Cancelar (ghost) · Guardar borrador (ghost) · Guardar y publicar (primary).
- Tabs row below banner: pill-style, "Hero" active (white pill).
- Content shows "Hero fields — Task 5".
- Sticky save bar at bottom with the same three buttons.

In browser, click each tab. Verify only one pane is visible at a time and the active pill moves.

- [ ] **Step 5: Commit**

```bash
git add admin/servicio.html admin/assets/css/admin.css admin/assets/js/admin-ui.js
git commit -m "feat(admin): service form skeleton with tabs and save bar"
```

---

## Task 5: Tab 1 — Hero fields (+ shared form components: input, textarea, image upload)

**Files:**
- Modify: `admin/servicio.html` (replace Hero tab content)
- Modify: `admin/assets/css/admin.css` (append form-component styles)
- Modify: `admin/assets/js/admin-ui.js` (auto-slug, image preview, in-memory state)

**Goal:** Hero tab has all its fields. Image upload shows preview. Slug auto-generates from title when empty.

- [ ] **Step 1: Append form-component styles to `admin/assets/css/admin.css`**

```css
/* ── FORM COMPONENTS ─────────────────────────────── */
.form-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 20px; }
.form-section-title { font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--platino); margin-bottom: 4px; }
.form-section-desc { font-size: 13px; color: var(--plomo); margin-bottom: 20px; }

.field { margin-bottom: 16px; }
.field:last-child { margin-bottom: 0; }
.field label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--platino); margin-bottom: 6px; }
.field .hint { display: block; font-size: 12px; color: var(--plomo); margin-top: 4px; }
.field input[type="text"],
.field textarea,
.field select {
  width: 100%; padding: 10px 12px;
  background: rgba(0,0,0,0.20);
  border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--vapor); font-size: 14px;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.field input:hover, .field textarea:hover, .field select:hover { border-color: var(--border-strong); }
.field input:focus, .field textarea:focus, .field select:focus {
  outline: none;
  border-color: var(--acero-light);
  box-shadow: 0 0 0 3px rgba(43,130,185,0.20);
}
.field textarea { min-height: 100px; resize: vertical; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field-error { display: none; color: #FCA5A5; font-size: 12px; margin-top: 6px; }
.field.has-error input, .field.has-error textarea { border-color: #EF4444; }
.field.has-error .field-error { display: block; }

/* Image upload */
.img-upload { display: flex; gap: 12px; align-items: flex-start; }
.img-preview {
  width: 120px; height: 120px; flex-shrink: 0;
  background: rgba(0,0,0,0.30);
  border: 1px dashed var(--border); border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.img-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-preview .img-placeholder { color: var(--plomo); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.img-upload-actions { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.img-upload input[type="file"] { font-size: 12px; color: var(--plomo); }
.img-upload input[type="file"]::file-selector-button { background: var(--surface); border: 1px solid var(--border); color: var(--vapor); padding: 6px 10px; border-radius: var(--radius); font: inherit; margin-right: 8px; cursor: pointer; }
.img-upload input[type="file"]::file-selector-button:hover { background: var(--surface-hover); }
.img-warn { font-size: 12px; color: #FBBF24; }

/* Collapsible */
.collapsible-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0;
  cursor: pointer;
  border-top: 1px solid var(--border);
  margin-top: 16px;
}
.collapsible-head:hover { color: var(--vapor); }
.collapsible-head .chevron { transition: transform var(--transition); }
.collapsible.is-open .collapsible-head .chevron { transform: rotate(90deg); }
.collapsible-body { display: none; padding-top: 8px; }
.collapsible.is-open .collapsible-body { display: block; }
```

- [ ] **Step 2: Replace the Hero pane in `admin/servicio.html`**

Replace `<div class="tab-pane is-active" data-pane="hero"><p>Hero fields — Task 5</p></div>` with:

```html
      <div class="tab-pane is-active" data-pane="hero">

        <div class="form-section">
          <div class="form-section-title">Identificación</div>
          <p class="form-section-desc">Lo que identifica al servicio en la URL y en la navbar.</p>

          <div class="field-row">
            <div class="field" data-field="titulo">
              <label for="f-titulo">Título</label>
              <input type="text" id="f-titulo" name="titulo" placeholder="Ej. Encintado de Líneas" required>
              <div class="field-error">El título es obligatorio.</div>
            </div>
            <div class="field" data-field="slug">
              <label for="f-slug">Slug (URL)</label>
              <input type="text" id="f-slug" name="slug" placeholder="encintado-de-lineas" required>
              <span class="hint">Se autogenera desde el título. Solo minúsculas, números y guiones.</span>
              <div class="field-error">Slug obligatorio y único.</div>
            </div>
          </div>

          <div class="field">
            <label for="f-eyebrow">Eyebrow / categoría</label>
            <input type="text" id="f-eyebrow" name="eyebrow" placeholder="Servicio Especializado · Operación">
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title">Hero</div>
          <p class="form-section-desc">El primer bloque visual de la página del servicio.</p>

          <div class="field">
            <label for="f-lead">Descripción corta</label>
            <textarea id="f-lead" name="lead" maxlength="280" placeholder="Resumen de qué es y para qué sirve este servicio."></textarea>
            <span class="hint">Máximo 280 caracteres.</span>
          </div>

          <div class="field">
            <label>Imagen principal</label>
            <div class="img-upload">
              <div class="img-preview" data-preview="heroImagen">
                <span class="img-placeholder">Sin imagen</span>
              </div>
              <div class="img-upload-actions">
                <input type="file" accept="image/*" data-upload="heroImagen">
                <span class="hint">Recomendado: JPG/PNG, mínimo 1200×800. Se ajusta automáticamente.</span>
                <span class="img-warn" data-warn="heroImagen" hidden></span>
              </div>
            </div>
          </div>

          <div class="collapsible" id="calloutGroup">
            <div class="collapsible-head" data-toggle="calloutGroup">
              <span><strong>Product callout</strong> · opcional</span>
              <svg class="chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>
            </div>
            <div class="collapsible-body">
              <div class="field-row">
                <div class="field">
                  <label for="f-callout-top">Texto superior</label>
                  <input type="text" id="f-callout-top" name="callout-textoSuperior" placeholder="Tecnología aplicada">
                </div>
                <div class="field">
                  <label for="f-callout-bottom">Texto inferior</label>
                  <input type="text" id="f-callout-bottom" name="callout-textoInferior" placeholder="AKKAIM INTEGRITY">
                </div>
              </div>
              <div class="field">
                <label for="f-callout-name">Nombre del producto</label>
                <input type="text" id="f-callout-name" name="callout-nombreProducto" placeholder="Iridium Wrap">
              </div>
              <div class="field">
                <label>Imagen del producto</label>
                <div class="img-upload">
                  <div class="img-preview" data-preview="calloutImagen"><span class="img-placeholder">Sin imagen</span></div>
                  <div class="img-upload-actions">
                    <input type="file" accept="image/*" data-upload="calloutImagen">
                    <span class="img-warn" data-warn="calloutImagen" hidden></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
```

- [ ] **Step 3: Append in-memory state + auto-slug + image preview + collapsible to `admin/assets/js/admin-ui.js`**

Append after `initFormPage();`:

```js
// ══════════════════════════════════════════════════════
// FORM STATE + INTERACTIONS
// ══════════════════════════════════════════════════════
import { slugify } from './admin-data.js';

const formState = {
  slug: '', titulo: '', eyebrow: '', lead: '',
  hero: { imagen: '', productCallout: { textoSuperior: '', nombreProducto: '', textoInferior: '', imagen: '' } },
  solucion: {}, consideraciones: {}, geometrias: {}, certificacion: {}, galeria: [], cta: {}
};

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
      if (target) target.classList.toggle('is-open');
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
```

- [ ] **Step 4: Verify**

Run:
```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-hero
```

Open PNG and verify:
- Hero tab shows "Identificación" section with Título + Slug (in a 2-col row) + Eyebrow.
- Below: "Hero" section with Descripción + Imagen principal upload + collapsed "Product callout · opcional" toggle.
- Inputs have dark background, subtle border, labels in uppercase platino.

In browser:
1. Type "Encintado Test" into Título → tab out → Slug auto-fills with "encintado-test".
2. Edit Slug to include accents like "ñ" → they're stripped immediately.
3. Click "Product callout · opcional" header → expands showing 4 fields.
4. Click the file input under "Imagen principal" → select any image → preview shows the image as a 120×120 thumbnail.
5. Refresh the page → beforeunload prompt appears (confirming dirty state warning).

- [ ] **Step 5: Commit**

```bash
git add admin/servicio.html admin/assets/css/admin.css admin/assets/js/admin-ui.js
git commit -m "feat(admin): hero tab fields with autoslug, image preview, collapsible callout"
```

---

## Task 6: Tab 2 — Solución (establishes repeater pattern + icon picker)

**Files:**
- Modify: `admin/servicio.html` (replace Solución tab content)
- Modify: `admin/assets/css/admin.css` (append repeater + icon picker styles)
- Modify: `admin/assets/js/admin-ui.js` (repeater render + icon set)

**Goal:** Solución tab with title, description, metric, and a repeater of 6 beneficios each with icon picker + label + chip. Establishes the repeater pattern that Tasks 7-10 will reuse.

- [ ] **Step 1: Append repeater styles to `admin/assets/css/admin.css`**

```css
/* ── REPEATER ─────────────────────────────────────── */
.repeater { margin-top: 8px; }
.repeater-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.repeater-head label { font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--platino); margin: 0; }

.repeater-item {
  background: rgba(0,0,0,0.20);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 10px;
  display: grid;
  grid-template-columns: 16px 1fr auto;
  gap: 12px;
  align-items: start;
}
.repeater-item:hover { border-color: var(--border-strong); }
.repeater-drag {
  color: rgba(255,255,255,0.30);
  font-family: monospace; font-size: 14px;
  cursor: grab; user-select: none;
  margin-top: 6px;
}
.repeater-fields { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.repeater-fields .field { margin: 0; }
.repeater-remove {
  width: 28px; height: 28px;
  background: transparent; border: 1px solid transparent;
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  color: var(--plomo);
  transition: background var(--transition), color var(--transition);
}
.repeater-remove:hover { background: rgba(239,68,68,0.10); color: #FCA5A5; border-color: rgba(239,68,68,0.30); }
.repeater-remove svg { width: 14px; height: 14px; }

.repeater-add {
  width: 100%; padding: 12px;
  background: transparent;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  color: var(--plomo);
  font-size: 13px;
  transition: background var(--transition), color var(--transition), border-color var(--transition);
}
.repeater-add:hover { background: var(--surface); color: var(--vapor); border-color: var(--vapor); }

/* Icon picker */
.icon-picker { display: flex; flex-direction: column; gap: 6px; }
.icon-picker-trigger {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  background: rgba(0,0,0,0.20);
  border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--vapor); font-size: 13px;
  cursor: pointer;
  transition: border-color var(--transition);
}
.icon-picker-trigger:hover { border-color: var(--border-strong); }
.icon-picker-trigger svg { width: 18px; height: 18px; flex-shrink: 0; }
.icon-picker-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;
  background: rgba(0,0,0,0.30);
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 8px;
  margin-top: 4px;
}
.icon-picker.is-collapsed .icon-picker-grid { display: none; }
.icon-picker-opt {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  cursor: pointer; color: var(--platino);
  transition: background var(--transition), color var(--transition), border-color var(--transition);
}
.icon-picker-opt:hover { background: var(--surface-hover); color: var(--vapor); }
.icon-picker-opt.is-selected { border-color: var(--acero-light); color: var(--vapor); background: rgba(43,130,185,0.15); }
.icon-picker-opt svg { width: 18px; height: 18px; }
```

- [ ] **Step 2: Replace the Solución pane in `admin/servicio.html`**

Replace `<div class="tab-pane" data-pane="solucion"><p>Solución — Task 6</p></div>` with:

```html
      <div class="tab-pane" data-pane="solucion">

        <div class="form-section">
          <div class="form-section-title">Solución — encabezado</div>
          <div class="field">
            <label for="f-sol-titulo">Título</label>
            <input type="text" id="f-sol-titulo" name="sol-titulo" placeholder="La solución">
          </div>
          <div class="field">
            <label for="f-sol-desc">Descripción</label>
            <textarea id="f-sol-desc" name="sol-desc" placeholder="Explica brevemente cómo funciona."></textarea>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="f-sol-metricaValor">Métrica clave — valor</label>
              <input type="text" id="f-sol-metricaValor" name="sol-metricaValor" placeholder="MAOP">
            </div>
            <div class="field">
              <label for="f-sol-metricaLabel">Métrica clave — etiqueta</label>
              <input type="text" id="f-sol-metricaLabel" name="sol-metricaLabel" placeholder="original">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="repeater-head">
            <label>Beneficios</label>
            <span class="hint">6 beneficios funciona mejor visualmente.</span>
          </div>
          <div class="repeater" id="repeaterBeneficios"></div>
          <button type="button" class="repeater-add" data-add="beneficios">+ Agregar beneficio</button>
        </div>

      </div>
```

- [ ] **Step 3: Append icon set + repeater logic to `admin/assets/js/admin-ui.js`**

Append at the end of `admin-ui.js`:

```js
// ══════════════════════════════════════════════════════
// ICONS — set predefinido reutilizado en beneficios y geometrías
// ══════════════════════════════════════════════════════
const ICONS = {
  shield:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  gauge:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 5V3"/><path d="M12 13l4-4"/></svg>',
  layers:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  thermometer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z"/></svg>',
  clock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  pipe:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="20" height="6" rx="1"/></svg>',
  elbow:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V11a8 8 0 0 1 8-8h10"/></svg>',
  tee:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M12 12v9"/></svg>',
  reducer:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h8l4 4 8 4M2 16h8l4-4 8-4"/></svg>',
  flange:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
  circumferential: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/></svg>',
  longitudinal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="3 3"/></svg>',
  irregular: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12 Q 6 4, 10 12 T 18 12 T 22 12"/></svg>'
};

function iconPickerHtml(name, selected) {
  const sel = selected || 'shield';
  const opts = Object.keys(ICONS).map(k => `
    <button type="button" class="icon-picker-opt ${k === sel ? 'is-selected' : ''}" data-icon="${k}" data-field="${name}" title="${k}">${ICONS[k]}</button>
  `).join('');
  return `
    <div class="icon-picker is-collapsed" data-picker="${name}">
      <button type="button" class="icon-picker-trigger" data-trigger="${name}">
        ${ICONS[sel]}
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  }
};

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }

function initRepeater(containerId, key) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Render initial empty repeater
  container.dataset.repeaterKey = key;

  // Event delegation: remove + icon picker
  container.addEventListener('click', e => {
    if (e.target.closest('.repeater-remove')) {
      e.target.closest('.repeater-item').remove();
      markDirty();
      return;
    }
    const trigger = e.target.closest('.icon-picker-trigger');
    if (trigger) {
      trigger.closest('.icon-picker').classList.toggle('is-collapsed');
      return;
    }
    const opt = e.target.closest('.icon-picker-opt');
    if (opt) {
      const picker = opt.closest('.icon-picker');
      picker.querySelectorAll('.icon-picker-opt').forEach(o => o.classList.toggle('is-selected', o === opt));
      const trigger = picker.querySelector('.icon-picker-trigger');
      trigger.querySelector('svg')?.remove();
      trigger.insertAdjacentHTML('afterbegin', ICONS[opt.dataset.icon]);
      trigger.querySelector('[data-current]').textContent = opt.dataset.icon;
      picker.classList.add('is-collapsed');
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
initRepeaterAddButtons();
```

- [ ] **Step 4: Verify**

Run:
```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-solucion
```

Then in browser:
1. Click the "Solución" tab.
2. See "Solución — encabezado" form section + "Beneficios" repeater section with empty list and "+ Agregar beneficio" button.
3. Click "+ Agregar beneficio" 6 times → 6 cards appear, each with drag handle (⋮⋮), icon picker (collapsed), Label input, Chip input, trash button.
4. Click an icon trigger → grid of 14 icons expands. Click "gauge" → trigger updates to show gauge icon + text "gauge". Grid collapses.
5. Click trash icon → item disappears.
6. Take a screenshot after these interactions: `node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-solucion-populated`.

- [ ] **Step 5: Commit**

```bash
git add admin/servicio.html admin/assets/css/admin.css admin/assets/js/admin-ui.js
git commit -m "feat(admin): solución tab with beneficios repeater and icon picker"
```

---

## Task 7: Tab 3 — Consideraciones técnicas (repeater with auto-numbering)

**Files:**
- Modify: `admin/servicio.html` (replace Consideraciones tab content)
- Modify: `admin/assets/js/admin-ui.js` (add `consideraciones` renderer + init)

- [ ] **Step 1: Replace the Consideraciones pane in `admin/servicio.html`**

Replace `<div class="tab-pane" data-pane="consideraciones"><p>Consideraciones — Task 7</p></div>` with:

```html
      <div class="tab-pane" data-pane="consideraciones">

        <div class="form-section">
          <div class="form-section-title">Consideraciones técnicas — encabezado</div>
          <div class="field">
            <label for="f-cons-titulo">Título</label>
            <input type="text" id="f-cons-titulo" name="cons-titulo" placeholder="Consideraciones técnicas">
          </div>
          <div class="field">
            <label for="f-cons-lead">Lead</label>
            <textarea id="f-cons-lead" name="cons-lead" placeholder="Variables que evaluamos en la ingeniería previa."></textarea>
          </div>
        </div>

        <div class="form-section">
          <div class="repeater-head">
            <label>Consideraciones</label>
            <span class="hint">6 items recomendado.</span>
          </div>
          <div class="repeater" id="repeaterConsideraciones"></div>
          <button type="button" class="repeater-add" data-add="consideraciones">+ Agregar consideración</button>
        </div>

      </div>
```

- [ ] **Step 2: Append `consideraciones` renderer + init to `admin/assets/js/admin-ui.js`**

Add to `repeaterRenderers` object (insert as a new key after `beneficios`):

```js
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
```

Add this line after `initRepeater('repeaterBeneficios', 'beneficios');`:

```js
initRepeater('repeaterConsideraciones', 'consideraciones');
```

- [ ] **Step 3: Verify**

In browser:
1. Click "Consideraciones" tab.
2. See the header form section + empty repeater.
3. Click "+ Agregar consideración" 3 times → 3 cards appear with Título + Descripción textarea + trash button.
4. Type in fields; click trash → removes the item.

Screenshot:
```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-consideraciones
```

- [ ] **Step 4: Commit**

```bash
git add admin/servicio.html admin/assets/js/admin-ui.js
git commit -m "feat(admin): consideraciones tab with repeater"
```

---

## Task 8: Tab 4 — Geometrías aplicables (repeater + icon picker)

**Files:**
- Modify: `admin/servicio.html` (replace Geometrías tab content)
- Modify: `admin/assets/js/admin-ui.js` (add `geometrias` renderer + init)

- [ ] **Step 1: Replace the Geometrías pane in `admin/servicio.html`**

```html
      <div class="tab-pane" data-pane="geometrias">

        <div class="form-section">
          <div class="form-section-title">Geometrías — encabezado</div>
          <div class="field">
            <label for="f-geo-titulo">Título</label>
            <input type="text" id="f-geo-titulo" name="geo-titulo" placeholder="Geometrías aplicables">
          </div>
          <div class="field">
            <label for="f-geo-desc">Descripción</label>
            <textarea id="f-geo-desc" name="geo-desc" placeholder="El sistema se adapta a múltiples configuraciones."></textarea>
          </div>
        </div>

        <div class="form-section">
          <div class="repeater-head">
            <label>Geometrías</label>
            <span class="hint">8 items recomendado para llenar el grid.</span>
          </div>
          <div class="repeater" id="repeaterGeometrias"></div>
          <button type="button" class="repeater-add" data-add="geometrias">+ Agregar geometría</button>
        </div>

      </div>
```

- [ ] **Step 2: Append `geometrias` renderer + init to `admin/assets/js/admin-ui.js`**

Add to `repeaterRenderers`:

```js
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
```

Add init line:

```js
initRepeater('repeaterGeometrias', 'geometrias');
```

- [ ] **Step 3: Verify**

In browser, click Geometrías tab → header + repeater. Add 4 items, change names + icons. Screenshot:

```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-geometrias
```

- [ ] **Step 4: Commit**

```bash
git add admin/servicio.html admin/assets/js/admin-ui.js
git commit -m "feat(admin): geometrías tab with repeater"
```

---

## Task 9: Tab 5 — Certificación & Normativa (badges + normas repeaters + PDF uploads)

**Files:**
- Modify: `admin/servicio.html` (replace Certificación tab content)
- Modify: `admin/assets/css/admin.css` (append PDF upload styles)
- Modify: `admin/assets/js/admin-ui.js` (add `badges` and `normas` renderers + PDF upload handler)

- [ ] **Step 1: Append PDF upload styles to `admin/assets/css/admin.css`**

```css
/* ── PDF UPLOAD ──────────────────────────────────── */
.pdf-upload {
  background: rgba(0,0,0,0.20);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  padding: 14px;
  display: flex; align-items: center; gap: 14px;
}
.pdf-upload svg { width: 22px; height: 22px; color: var(--platino); flex-shrink: 0; }
.pdf-upload .pdf-meta { flex: 1; font-size: 13px; }
.pdf-upload .pdf-meta strong { display: block; color: var(--vapor); margin-bottom: 2px; word-break: break-all; }
.pdf-upload .pdf-meta span { color: var(--plomo); font-size: 12px; }
.pdf-upload input[type="file"] { font-size: 12px; }
.pdf-upload-actions { display: flex; gap: 6px; align-items: center; }
```

- [ ] **Step 2: Replace the Certificación pane in `admin/servicio.html`**

```html
      <div class="tab-pane" data-pane="certificacion">

        <div class="form-section">
          <div class="repeater-head">
            <label>Badges (estándares)</label>
            <span class="hint">API, ASME, ISO — los que apliquen.</span>
          </div>
          <div class="repeater" id="repeaterBadges"></div>
          <button type="button" class="repeater-add" data-add="badges">+ Agregar badge</button>
        </div>

        <div class="form-section">
          <div class="repeater-head">
            <label>Normas específicas</label>
            <span class="hint">Una norma por línea (ASME PCC-2 Art. 4.1, ISO 24817, etc.).</span>
          </div>
          <div class="repeater" id="repeaterNormas"></div>
          <button type="button" class="repeater-add" data-add="normas">+ Agregar norma</button>
        </div>

        <div class="form-section">
          <div class="form-section-title">Documentos</div>

          <div class="field">
            <label>Ficha técnica (PDF)</label>
            <div class="pdf-upload" data-pdf="fichaTecnicaPdf">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div class="pdf-meta">
                <strong data-name="fichaTecnicaPdf">Sin archivo</strong>
                <span data-size="fichaTecnicaPdf">Sube un PDF de la ficha técnica del producto.</span>
              </div>
              <div class="pdf-upload-actions">
                <input type="file" accept="application/pdf" data-pdf-input="fichaTecnicaPdf">
              </div>
            </div>
          </div>

          <div class="field">
            <label>Certificados (PDF)</label>
            <div class="pdf-upload" data-pdf="certificadosPdf">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div class="pdf-meta">
                <strong data-name="certificadosPdf">Sin archivo</strong>
                <span data-size="certificadosPdf">Sube un PDF con los certificados aplicables.</span>
              </div>
              <div class="pdf-upload-actions">
                <input type="file" accept="application/pdf" data-pdf-input="certificadosPdf">
              </div>
            </div>
          </div>
        </div>

      </div>
```

- [ ] **Step 3: Append `badges`, `normas` renderers + PDF upload handler to `admin/assets/js/admin-ui.js`**

Add to `repeaterRenderers`:

```js
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
```

Add init lines:

```js
initRepeater('repeaterBadges', 'badges');
initRepeater('repeaterNormas', 'normas');
```

Add a PDF upload handler (place near the existing image-preview handler):

```js
function initPdfUploads() {
  document.querySelectorAll('input[type="file"][data-pdf-input]').forEach(input => {
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const key = input.dataset.pdfInput;
      const nameEl = document.querySelector(`[data-name="${key}"]`);
      const sizeEl = document.querySelector(`[data-size="${key}"]`);
      nameEl.textContent = file.name;
      sizeEl.textContent = `${Math.round(file.size / 1024)} KB · listo para guardar`;
      markDirty();
    });
  });
}

initPdfUploads();
```

- [ ] **Step 4: Verify**

In browser:
1. Click Certificación tab.
2. Add 3 badges (API/ASME/ISO).
3. Add 2 normas.
4. Click the file input next to Ficha técnica → pick any PDF → "Sin archivo" → updates to the filename + size in KB.

Screenshot:
```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-certificacion
```

- [ ] **Step 5: Commit**

```bash
git add admin/servicio.html admin/assets/css/admin.css admin/assets/js/admin-ui.js
git commit -m "feat(admin): certificación tab with badges, normas, PDF uploads"
```

---

## Task 10: Tab 6 — Galería (image repeater with size selector)

**Files:**
- Modify: `admin/servicio.html` (replace Galería tab content)
- Modify: `admin/assets/js/admin-ui.js` (add `galeria` renderer + image upload inside repeater items)

- [ ] **Step 1: Replace the Galería pane in `admin/servicio.html`**

```html
      <div class="tab-pane" data-pane="galeria">

        <div class="form-section">
          <div class="repeater-head">
            <label>Imágenes de galería</label>
            <span class="hint">5 imágenes funcionan bien con el bento grid.</span>
          </div>
          <div class="repeater" id="repeaterGaleria"></div>
          <button type="button" class="repeater-add" data-add="galeria">+ Agregar imagen</button>
        </div>

      </div>
```

- [ ] **Step 2: Append `galeria` renderer to `admin/assets/js/admin-ui.js`**

Add to `repeaterRenderers`:

```js
  galeria(item = { dataUrl: '', caption: '', tamano: 'M' }) {
    return `
      <div class="repeater-item">
        <div class="repeater-drag" aria-hidden="true">⋮⋮</div>
        <div class="repeater-fields">
          <div class="field">
            <label>Imagen</label>
            <div class="img-upload">
              <div class="img-preview" data-gallery-preview>${item.dataUrl ? `<img src="${item.dataUrl}" alt="">` : '<span class="img-placeholder">Sin imagen</span>'}</div>
              <div class="img-upload-actions">
                <input type="file" accept="image/*" data-gallery-input>
              </div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Caption (opcional)</label>
              <input type="text" data-rk="caption" value="${escapeAttr(item.caption)}" placeholder="Aplicación en planta">
            </div>
            <div class="field">
              <label>Tamaño en grid</label>
              <select data-rk="tamano">
                <option value="S" ${item.tamano === 'S' ? 'selected' : ''}>Pequeño</option>
                <option value="M" ${item.tamano === 'M' ? 'selected' : ''}>Mediano</option>
                <option value="L" ${item.tamano === 'L' ? 'selected' : ''}>Grande</option>
              </select>
            </div>
          </div>
        </div>
        <button type="button" class="repeater-remove" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    `;
  },
```

Init the repeater:

```js
initRepeater('repeaterGaleria', 'galeria');
```

Add a delegated handler for gallery image inputs (place after `initPdfUploads();`):

```js
function initGalleryUploads() {
  document.body.addEventListener('change', e => {
    const input = e.target.closest('input[type="file"][data-gallery-input]');
    if (!input) return;
    const file = input.files[0];
    if (!file) return;
    const preview = input.closest('.img-upload').querySelector('[data-gallery-preview]');
    const reader = new FileReader();
    reader.onload = ev => {
      preview.innerHTML = `<img src="${ev.target.result}" alt="">`;
      markDirty();
    };
    reader.readAsDataURL(file);
  });
}

initGalleryUploads();
```

- [ ] **Step 3: Verify**

In browser:
1. Click Galería tab.
2. Add 3 items.
3. Each card shows: empty preview · file input · Caption input · Tamaño dropdown (S/M/L).
4. Pick an image in one card → preview updates.

Screenshot:
```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-galeria
```

- [ ] **Step 4: Commit**

```bash
git add admin/servicio.html admin/assets/js/admin-ui.js
git commit -m "feat(admin): galería tab with image repeater"
```

---

## Task 11: Tab 7 — CTA (headline + boton)

**Files:**
- Modify: `admin/servicio.html` (replace CTA tab content)

- [ ] **Step 1: Replace the CTA pane in `admin/servicio.html`**

```html
      <div class="tab-pane" data-pane="cta">

        <div class="form-section">
          <div class="form-section-title">Call to Action — final de la página</div>
          <p class="form-section-desc">El bloque que cierra cada página de servicio.</p>

          <div class="field">
            <label for="f-cta-head">Headline</label>
            <input type="text" id="f-cta-head" name="cta-headline" placeholder="¿Tu activo necesita esta solución?" value="¿Tu activo necesita esta solución?">
          </div>

          <div class="field">
            <label for="f-cta-btn">Texto del botón</label>
            <input type="text" id="f-cta-btn" name="cta-botonTexto" placeholder="Agenda una reunión" value="Agenda una reunión">
            <span class="hint">El botón siempre redirige a /contacto.html — el texto es lo único editable.</span>
          </div>
        </div>

      </div>
```

- [ ] **Step 2: Verify**

Click CTA tab → see two inputs prepopulated with defaults. Screenshot:

```bash
node screenshot.mjs http://localhost:1112/admin/servicio.html admin-form-cta
```

- [ ] **Step 3: Commit**

```bash
git add admin/servicio.html
git commit -m "feat(admin): cta tab with editable headline and button text"
```

---

## Task 12: Save flow (collect → validate → persist → toast → redirect/stay) + load existing on `?slug=`

**Files:**
- Modify: `admin/assets/js/admin-ui.js` (collect form, validate, wire save buttons, prepopulate from URL slug)
- Modify: `admin/assets/css/admin.css` (append toast styles)
- Modify: `admin/servicio.html` (add empty `<div id="toastRoot"></div>` before `</body>`)

**Goal:** Pressing "Guardar borrador" or "Guardar y publicar" reads all field values into a `Servicio` object, validates (title + slug required, slug unique unless editing same slug), calls `saveServicio()`, shows toast. Publishing redirects to dashboard after 2s; borrador stays. Loading `?slug=X` prepopulates the form.

- [ ] **Step 1: Append toast styles to `admin/assets/css/admin.css`**

```css
/* ── TOAST ────────────────────────────────────────── */
#toastRoot { position: fixed; bottom: 92px; right: 32px; display: flex; flex-direction: column; gap: 8px; z-index: 100; pointer-events: none; }
.toast {
  background: rgba(11,53,84,0.96);
  border: 1px solid var(--acero-light);
  color: var(--vapor);
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  max-width: 380px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  pointer-events: auto;
  animation: toastIn 200ms ease;
}
.toast.toast-success { border-color: rgba(34,197,94,0.50); }
.toast.toast-error { background: rgba(127,29,29,0.95); border-color: rgba(239,68,68,0.50); }
@keyframes toastIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

- [ ] **Step 2: Add toast root + servicio.html script reference**

In `admin/servicio.html`, add right before the closing `</body>` tag (above the `<script>` line):

```html
<div id="toastRoot"></div>
```

- [ ] **Step 3: Append save flow + load flow to `admin/assets/js/admin-ui.js`**

Append at the very end:

```js
// ══════════════════════════════════════════════════════
// SAVE FLOW
// ══════════════════════════════════════════════════════
import { getServicio, saveServicio, getServicios } from './admin-data.js';

function readVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function readRepeater(containerId, fields) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('.repeater-item')).map(item => {
    const obj = {};
    fields.forEach(f => {
      if (f === 'icono') {
        const cur = item.querySelector('[data-current]');
        obj.icono = cur?.textContent ?? 'shield';
      } else {
        const input = item.querySelector(`[data-rk="${f}"]`);
        obj[f] = input ? input.value.trim() : '';
      }
    });
    return obj;
  });
}

function readGaleriaRepeater() {
  const container = document.getElementById('repeaterGaleria');
  if (!container) return [];
  return Array.from(container.querySelectorAll('.repeater-item')).map(item => {
    const img = item.querySelector('[data-gallery-preview] img');
    return {
      dataUrl: img ? img.src : '',
      caption: item.querySelector('[data-rk="caption"]')?.value.trim() ?? '',
      tamano: item.querySelector('[data-rk="tamano"]')?.value ?? 'M'
    };
  });
}

function readImagePreview(key) {
  const img = document.querySelector(`[data-preview="${key}"] img`);
  return img ? img.src : '';
}

function readPdf(key) {
  const nameEl = document.querySelector(`[data-name="${key}"]`);
  const name = nameEl?.textContent.trim();
  if (!name || name === 'Sin archivo') return null;
  // For maqueta: store the filename but we don't persist the actual file data
  // (would blow up localStorage). When BBDD exists, this goes to a file upload endpoint.
  return { nombre: name, dataUrl: '' };
}

function collectForm() {
  return {
    slug: readVal('f-slug'),
    titulo: readVal('f-titulo'),
    eyebrow: readVal('f-eyebrow'),
    lead: readVal('f-lead'),
    hero: {
      imagen: readImagePreview('heroImagen'),
      productCallout: {
        textoSuperior: readVal('f-callout-top'),
        nombreProducto: readVal('f-callout-name'),
        textoInferior: readVal('f-callout-bottom'),
        imagen: readImagePreview('calloutImagen')
      }
    },
    solucion: {
      titulo: readVal('f-sol-titulo'),
      descripcion: readVal('f-sol-desc'),
      metricaClave: {
        valor: readVal('f-sol-metricaValor'),
        label: readVal('f-sol-metricaLabel')
      },
      beneficios: readRepeater('repeaterBeneficios', ['icono', 'label', 'chip'])
    },
    consideraciones: {
      titulo: readVal('f-cons-titulo'),
      lead: readVal('f-cons-lead'),
      items: readRepeater('repeaterConsideraciones', ['titulo', 'descripcion'])
    },
    geometrias: {
      titulo: readVal('f-geo-titulo'),
      descripcion: readVal('f-geo-desc'),
      items: readRepeater('repeaterGeometrias', ['nombre', 'icono'])
    },
    certificacion: {
      badges: readRepeater('repeaterBadges', ['nombre']),
      normas: readRepeater('repeaterNormas', ['texto']),
      fichaTecnicaPdf: readPdf('fichaTecnicaPdf'),
      certificadosPdf: readPdf('certificadosPdf')
    },
    galeria: readGaleriaRepeater(),
    cta: {
      headline: readVal('f-cta-head'),
      botonTexto: readVal('f-cta-btn')
    }
  };
}

function setFieldError(fieldKey, message) {
  const field = document.querySelector(`[data-field="${fieldKey}"]`);
  if (!field) return;
  field.classList.add('has-error');
  const errorEl = field.querySelector('.field-error');
  if (errorEl && message) errorEl.textContent = message;
}

function clearFieldErrors() {
  document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
}

async function validate(data, originalSlug) {
  clearFieldErrors();
  const errors = [];
  if (!data.titulo) { errors.push('titulo'); setFieldError('titulo', 'El título es obligatorio.'); }
  if (!data.slug) { errors.push('slug'); setFieldError('slug', 'Slug obligatorio.'); }
  else {
    const all = await getServicios();
    if (all.some(s => s.slug === data.slug && s.slug !== originalSlug)) {
      errors.push('slug');
      setFieldError('slug', 'Ya existe un servicio con ese slug.');
    }
  }
  return errors.length === 0;
}

function showToast(message, kind = 'success') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

let originalSlug = null; // Tracks the slug we loaded from ?slug= (null in create mode)

async function handleSave(estado) {
  const data = collectForm();
  data.estado = estado;
  const ok = await validate(data, originalSlug);
  if (!ok) {
    showToast('Revisa los campos marcados.', 'error');
    return;
  }
  // If editing under a different slug, we need to delete the old one first
  if (originalSlug && originalSlug !== data.slug) {
    const { deleteServicio } = await import('./admin-data.js');
    await deleteServicio(originalSlug);
  }
  await saveServicio(data);
  isDirty = false;
  originalSlug = data.slug;
  if (estado === 'publicado') {
    showToast(`Publicado. Cuando conectemos la base de datos, aparecerá en la navbar bajo Servicios > Servicios Especializados.`);
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
  } else {
    showToast('Borrador guardado.');
  }
}

function initSaveButtons() {
  document.querySelectorAll('#btnDraftTop, #btnDraftBottom').forEach(b => b.addEventListener('click', () => handleSave('borrador')));
  document.querySelectorAll('#btnPublishTop, #btnPublishBottom').forEach(b => b.addEventListener('click', () => handleSave('publicado')));
}

initSaveButtons();

// ══════════════════════════════════════════════════════
// LOAD EXISTING SERVICIO ON ?slug=
// ══════════════════════════════════════════════════════
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v ?? ''; }
function setImage(key, src) {
  if (!src) return;
  const preview = document.querySelector(`[data-preview="${key}"]`);
  if (preview) preview.innerHTML = `<img src="${src}" alt="">`;
}
function setPdf(key, pdf) {
  if (!pdf) return;
  const nameEl = document.querySelector(`[data-name="${key}"]`);
  const sizeEl = document.querySelector(`[data-size="${key}"]`);
  if (nameEl) nameEl.textContent = pdf.nombre;
  if (sizeEl) sizeEl.textContent = 'Existente';
}
function populateRepeater(containerId, key, items) {
  const container = document.getElementById(containerId);
  if (!container || !items) return;
  container.innerHTML = items.map(it => repeaterRenderers[key](it)).join('');
}

async function loadExistingIfAny() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;
  const s = await getServicio(slug);
  if (!s) { showToast(`No se encontró el servicio "${slug}".`, 'error'); return; }
  originalSlug = s.slug;

  setVal('f-titulo', s.titulo);
  setVal('f-slug', s.slug);
  setVal('f-eyebrow', s.eyebrow);
  setVal('f-lead', s.lead);
  setImage('heroImagen', s.hero?.imagen);

  setVal('f-callout-top', s.hero?.productCallout?.textoSuperior);
  setVal('f-callout-name', s.hero?.productCallout?.nombreProducto);
  setVal('f-callout-bottom', s.hero?.productCallout?.textoInferior);
  setImage('calloutImagen', s.hero?.productCallout?.imagen);

  setVal('f-sol-titulo', s.solucion?.titulo);
  setVal('f-sol-desc', s.solucion?.descripcion);
  setVal('f-sol-metricaValor', s.solucion?.metricaClave?.valor);
  setVal('f-sol-metricaLabel', s.solucion?.metricaClave?.label);
  populateRepeater('repeaterBeneficios', 'beneficios', s.solucion?.beneficios);

  setVal('f-cons-titulo', s.consideraciones?.titulo);
  setVal('f-cons-lead', s.consideraciones?.lead);
  populateRepeater('repeaterConsideraciones', 'consideraciones', s.consideraciones?.items);

  setVal('f-geo-titulo', s.geometrias?.titulo);
  setVal('f-geo-desc', s.geometrias?.descripcion);
  populateRepeater('repeaterGeometrias', 'geometrias', s.geometrias?.items);

  populateRepeater('repeaterBadges', 'badges', s.certificacion?.badges);
  populateRepeater('repeaterNormas', 'normas', s.certificacion?.normas);
  setPdf('fichaTecnicaPdf', s.certificacion?.fichaTecnicaPdf);
  setPdf('certificadosPdf', s.certificacion?.certificadosPdf);

  populateRepeater('repeaterGaleria', 'galeria', s.galeria);

  setVal('f-cta-head', s.cta?.headline);
  setVal('f-cta-btn', s.cta?.botonTexto);

  document.getElementById('crumbCurrent').textContent = `Editar: ${s.titulo}`;
  isDirty = false; // Loading is not a user edit
}

loadExistingIfAny();
```

- [ ] **Step 4: Verify — new service flow**

In browser:
1. Open `http://localhost:1112/admin/servicio.html` (no `?slug=`).
2. Hit "Guardar y publicar" with empty fields → red border on Título and Slug + toast "Revisa los campos marcados."
3. Type "Test Service" in Título, blur → Slug becomes `test-service`.
4. Hit "Guardar borrador" → toast "Borrador guardado."
5. Go to `http://localhost:1112/admin/index.html` → table shows 2 rows now (encintado + test-service).
6. Click "Editar" on test-service → form opens with prepopulated fields, breadcrumb says "Editar: Test Service".

- [ ] **Step 5: Verify — duplicate slug check**

1. New service (`admin/servicio.html`), set Título = "Otro" but slug = "encintado-de-lineas" (manually). Click publicar → toast "Revisa los campos marcados.", red border on slug, error message "Ya existe un servicio con ese slug."
2. Edit existing encintado (`?slug=encintado-de-lineas`), don't change slug, click publicar → succeeds, redirects to dashboard after 2s.

- [ ] **Step 6: Verify — beforeunload**

1. Open form, type in any field, try to close tab/reload → browser shows native confirmation.
2. Click "Guardar borrador" → reload → no prompt (dirty flag cleared).

Screenshot the populated edit view:
```bash
node screenshot.mjs "http://localhost:1112/admin/servicio.html?slug=encintado-de-lineas" admin-form-edit-mode
```

- [ ] **Step 7: Commit**

```bash
git add admin/servicio.html admin/assets/css/admin.css admin/assets/js/admin-ui.js
git commit -m "feat(admin): save flow with validation, toast, edit mode load"
```

---

## Task 13: Media placeholder page

**Files:**
- Create: `admin/media.html`

**Goal:** Page exists at the sidebar destination, shows visual list of assets the admin knows about (extracted from `getServicios()`).

- [ ] **Step 1: Create `admin/media.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin MTEC — Media</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/admin.css">
<style>
  .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
  .media-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .media-card .thumb { aspect-ratio: 4/3; background: rgba(0,0,0,0.30); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .media-card .thumb img { width: 100%; height: 100%; object-fit: cover; }
  .media-card .thumb svg { width: 32px; height: 32px; color: var(--platino); }
  .media-card .meta { padding: 10px 12px; }
  .media-card .meta strong { display: block; font-size: 12.5px; color: var(--vapor); margin-bottom: 2px; word-break: break-word; }
  .media-card .meta span { font-size: 11.5px; color: var(--plomo); }
</style>
</head>
<body>

<div class="admin-shell">

  <aside class="sidebar">
    <div class="sidebar-logo"><img src="../deliverables/logos/PNG/Logo MTEC_final_Blanco.png" alt="MTEC"></div>
    <nav class="sidebar-nav">
      <a href="index.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Servicios
      </a>
      <a href="media.html" class="sidebar-item is-active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        Media
      </a>
      <a href="config.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Configuración
      </a>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-foot">
      <a href="../index.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver al sitio público
      </a>
    </div>
  </aside>

  <main class="admin-main">
    <div class="topbar">
      <div class="topbar-breadcrumb"><span class="current">Media</span></div>
      <div class="topbar-user">M</div>
    </div>
    <div class="admin-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Modo maqueta — los archivos se gestionan por servicio. Cuando conectemos la base de datos, podrás subir y reutilizar archivos sueltos desde aquí.</span>
    </div>

    <div class="admin-content">
      <h1>Media</h1>
      <p class="page-description">Resumen de las imágenes y PDFs que tus servicios están usando hoy.</p>
      <div class="media-grid" id="mediaGrid"></div>
    </div>
  </main>
</div>

<script type="module">
import { getServicios } from './assets/js/admin-data.js';

const grid = document.getElementById('mediaGrid');
const servicios = await getServicios();
const cards = [];

const PDF_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

servicios.forEach(s => {
  if (s.hero?.imagen) cards.push({ thumb: s.hero.imagen, name: 'Hero', service: s.titulo, type: 'imagen' });
  if (s.hero?.productCallout?.imagen) cards.push({ thumb: s.hero.productCallout.imagen, name: s.hero.productCallout.nombreProducto || 'Producto', service: s.titulo, type: 'imagen' });
  if (s.certificacion?.fichaTecnicaPdf) cards.push({ thumb: null, name: s.certificacion.fichaTecnicaPdf.nombre, service: s.titulo, type: 'pdf' });
  if (s.certificacion?.certificadosPdf) cards.push({ thumb: null, name: s.certificacion.certificadosPdf.nombre, service: s.titulo, type: 'pdf' });
  (s.galeria || []).forEach((g, i) => {
    if (g.dataUrl) cards.push({ thumb: g.dataUrl, name: g.caption || `Galería ${i + 1}`, service: s.titulo, type: 'imagen' });
  });
});

grid.innerHTML = cards.length === 0
  ? '<p style="color:var(--plomo)">Aún no hay archivos. Crea o edita un servicio para agregar imágenes y PDFs.</p>'
  : cards.map(c => `
    <div class="media-card">
      <div class="thumb">${c.thumb ? `<img src="${c.thumb}" alt="">` : PDF_ICON}</div>
      <div class="meta">
        <strong>${c.name}</strong>
        <span>${c.service} · ${c.type}</span>
      </div>
    </div>
  `).join('');
</script>

</body>
</html>
```

- [ ] **Step 2: Verify**

Run:
```bash
node screenshot.mjs http://localhost:1112/admin/media.html admin-media
```

Open PNG. Verify:
- Sidebar shows "Media" highlighted.
- Title "Media" + description.
- Grid with cards: one for hero image (`servicios_especializados.png`), one for the ficha técnica PDF.
- Each card shows thumb + name + service + type.

In browser, click sidebar items to navigate between Servicios / Media / Configuración and confirm active state updates.

- [ ] **Step 3: Commit**

```bash
git add admin/media.html
git commit -m "feat(admin): media placeholder page listing assets from existing servicios"
```

---

## Task 14: Configuración placeholder page

**Files:**
- Create: `admin/config.html`

**Goal:** Sidebar destination exists with skeleton sections.

- [ ] **Step 1: Create `admin/config.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin MTEC — Configuración</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/admin.css">
</head>
<body>

<div class="admin-shell">

  <aside class="sidebar">
    <div class="sidebar-logo"><img src="../deliverables/logos/PNG/Logo MTEC_final_Blanco.png" alt="MTEC"></div>
    <nav class="sidebar-nav">
      <a href="index.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Servicios
      </a>
      <a href="media.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        Media
      </a>
      <a href="config.html" class="sidebar-item is-active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Configuración
      </a>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="sidebar-foot">
      <a href="../index.html" class="sidebar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Volver al sitio público
      </a>
    </div>
  </aside>

  <main class="admin-main">
    <div class="topbar">
      <div class="topbar-breadcrumb"><span class="current">Configuración</span></div>
      <div class="topbar-user">M</div>
    </div>
    <div class="admin-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Modo maqueta — esta sección estará disponible cuando conectemos la base de datos.</span>
    </div>

    <div class="admin-content">
      <h1>Configuración</h1>
      <p class="page-description">Información de empresa y ajustes globales del sitio.</p>

      <div class="form-section">
        <div class="form-section-title">Información de la empresa</div>
        <div class="field"><label>Teléfono</label><input type="text" value="+56 (32) 2818996" disabled></div>
        <div class="field"><label>Email</label><input type="text" value="contacto@mtec.cl" disabled></div>
        <div class="field"><label>Dirección</label><input type="text" value="Calle Punta Arenas 856, Concón, Región de Valparaíso - Chile" disabled></div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Redes sociales</div>
        <div class="field"><label>LinkedIn</label><input type="text" placeholder="URL del perfil" disabled></div>
        <div class="field"><label>Instagram</label><input type="text" placeholder="@usuario" disabled></div>
      </div>
    </div>
  </main>
</div>

</body>
</html>
```

- [ ] **Step 2: Verify**

```bash
node screenshot.mjs http://localhost:1112/admin/config.html admin-config
```

Verify two form sections rendered with disabled inputs prepopulated with the real contact info from the public site.

- [ ] **Step 3: End-to-end verification**

Walk the spec's verification list (see [docs/superpowers/specs/2026-05-14-admin-mtec-design.md](../specs/2026-05-14-admin-mtec-design.md) — Verification end-to-end section). Run through all 15 steps in the browser:

1. `localhost:1112/admin/` → banner, table with encintado-de-lineas row.
2. Click "Editar" → form prepopulates → breadcrumb "Editar: Encintado de Líneas".
3. Change title → breadcrumb live-update (will happen via input listener — *check this works; if not, add an input listener on titulo to update crumbCurrent*).
4. Cycle tabs → fields persist.
5. "Guardar y publicar" → toast → redirect → row shows "hace unos segundos".
6. "+ Nuevo servicio" → fill minimum → "Guardar borrador" → dashboard has 2 rows.
7. Refresh → both persist.
8. Eliminar the new one → confirm → removed.
9. Devtools: `localStorage.removeItem('mtec_admin_servicios')` → reload → empty state.
10. Sidebar links navigate between pages → active state correct.
11. "Volver al sitio público" → goes to /index.html.
12. Public navbar does NOT contain new services (expected in maqueta).

If "title update reflects in breadcrumb live" is missing, add this to `admin-ui.js`:

```js
const tituloEl = document.getElementById('f-titulo');
const crumbCurrent = document.getElementById('crumbCurrent');
if (tituloEl && crumbCurrent) {
  tituloEl.addEventListener('input', () => {
    crumbCurrent.textContent = originalSlug ? `Editar: ${tituloEl.value || '…'}` : 'Nuevo servicio';
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add admin/config.html admin/assets/js/admin-ui.js
git commit -m "feat(admin): config placeholder page + end-to-end polish"
```

---

## Self-review notes

**Spec coverage check:** every section of the spec maps to a task:
- "File structure" → Tasks 1, 2, 4 establish all 7 files.
- "Layout común" → Task 1 (chrome + banner).
- "Dashboard" → Task 3.
- "Service form" → Tasks 4-12.
- "Tab 1 Hero" → Task 5. "Tab 2 Solución" → Task 6. "Tab 3 Consideraciones" → Task 7. "Tab 4 Geometrías" → Task 8. "Tab 5 Certificación" → Task 9. "Tab 6 Galería" → Task 10. "Tab 7 CTA" → Task 11.
- "Persistencia" → Task 2.
- "Estilo visual" → Task 1 (palette/base) + Tasks 3, 5, 6, 9 (components).
- "Edge cases" → Task 12 (slug validation, duplicate check, beforeunload). QuotaExceeded handled in Task 2.
- "Media / Config placeholders" → Tasks 13, 14.

**PDF persistence caveat:** the spec said PDFs would be stored as base64 data-URLs in localStorage. Task 12's `readPdf` only stores the filename — not the actual file bytes — to avoid blowing up localStorage with multi-MB base64 strings. The spec note "limita el tamaño total (localStorage tope ~5-10MB por dominio)" already acknowledged this trade-off. The seed entry has a relative path to the real PDF on disk (which works because the file exists). When BBDD comes, PDFs go to a bucket. Document this explicitly in the implementation: the maqueta does not round-trip uploaded PDFs.

**Icon names used consistently:** `shield, check, gauge, layers, thermometer, clock, pipe, elbow, tee, reducer, flange, circumferential, longitudinal, irregular` — defined in Task 6, referenced in seed (Task 2). No mismatches.

**No "TBD"/"TODO" markers found in plan body.** ✅

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-14-admin-mtec.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for a 14-task plan where each task is self-contained.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, with batch execution and checkpoints for review.

Which approach?
