# Admin MTEC — Maqueta de gestión de servicios

**Estado:** Spec aprobada · pendiente plan de implementación
**Fecha:** 2026-05-14
**Autor:** Claude + mauriciocastelblanco

## Contexto

El sitio web de MTEC tiene hoy una sola página de servicio concreta (`servicios/encintado-de-lineas.html`) construida a partir de un template (`servicios/_template.html`) de 7 secciones. Crear nuevos servicios requiere editar HTML a mano, lo que no es sostenible cuando MTEC tenga 5+ servicios.

El cliente necesita un panel de admin donde pueda:
1. Ver la lista de servicios existentes.
2. Crear un nuevo servicio llenando un formulario con todos los campos del template.
3. Editar o eliminar servicios existentes.
4. Que el servicio creado aparezca como entrada nueva en el dropdown "Servicios Especializados" de la navbar pública.
5. Que el servicio creado tenga su propia página pública (estilo encintado-de-lineas) generada automáticamente.

**Esta entrega es solo la maqueta del admin:** el UI completo del panel, con persistencia local (localStorage) que simula la BBDD. La conexión real a base de datos, la inyección dinámica de la navbar y la generación de páginas estáticas quedan para fases posteriores. La capa de persistencia está aislada en 4 funciones (`getServicios`, `getServicio`, `saveServicio`, `deleteServicio`) para que la migración a API sea quirúrgica.

## Objetivo

Entregar un admin funcional visualmente y persistente localmente, donde el cliente pueda recorrer el flujo completo "crear → ver lista → editar → publicar" sin que el sitio público se modifique todavía. El admin sirve como prototipo navegable para validar UX y campos antes de invertir en backend.

## Alcance

**Dentro del alcance:**
- 4 páginas HTML del admin: dashboard, formulario de servicio, biblioteca de medios (placeholder), configuración (placeholder).
- Estilos exclusivos del admin en `admin/assets/css/admin.css`.
- JS para persistencia (`admin-data.js`) e interacciones de UI (`admin-ui.js`).
- Seed inicial con datos del servicio "Encintado de Líneas" extraídos del HTML actual.
- Imágenes y PDFs almacenados como data-URLs base64 dentro del JSON de localStorage.
- Banner persistente "Modo maqueta — los servicios no se publican aún en el sitio público" visible en todas las páginas del admin.

**Fuera del alcance (próxima fase):**
- Login / autenticación.
- Backend real (API, BBDD).
- Inyección dinámica del partial de navbar con la lista de servicios.
- Build/SSR de páginas de servicio desde el JSON.
- Upload real de archivos (los archivos se guardan como base64 en localStorage).
- Búsqueda en el admin.
- Drag & drop funcional en repeaters.
- Stats/métricas en el dashboard.
- Páginas Media y Configuración con contenido funcional (quedan como placeholders).

## Arquitectura de archivos

```
admin/
  index.html                  Dashboard: tabla de servicios + botón nuevo
  servicio.html               Form único; ?slug=X edita, sin query crea
  media.html                  Placeholder: lista visual de PDFs/imágenes seedeados
  config.html                 Placeholder: ajustes generales del sitio
  assets/
    css/
      admin.css               Todos los estilos del admin (sidebar, topbar, tabla, form, repeaters)
    js/
      admin-data.js           4 funciones públicas + seed inicial; única capa que toca localStorage
      admin-ui.js             Tabs, repeaters, image preview, save flow, autoslug, beforeunload
```

Nada del admin importa CSS/JS del sitio público (`page-chrome.css`, `nav.css`, etc.) — son universos visuales separados. Solo se reutilizan el archivo de logo (`deliverables/logos/PNG/Logo MTEC_final_Blanco.png`) y los valores de la paleta de marca (re-declarados localmente en `admin.css`).

## Layout común

Todas las páginas del admin comparten el mismo chrome:

```
┌─────────────────────────────────────────────────────────┐
│ ┌─Sidebar──┐ ┌─Top bar──────────────────────────────────┐│
│ │ MTEC     │ │ Breadcrumb / Título                       ││
│ │          │ ├──────────────────────────────────────────┤│
│ │ ● Servic │ │  ┌─Banner "Modo maqueta" (amber, sutil)─┐ ││
│ │   Media  │ │  └─────────────────────────────────────┘ ││
│ │   Config │ │                                          ││
│ │          │ │       Contenido de la vista              ││
│ │ ← Sitio  │ │                                          ││
│ │   públ.  │ │                                          ││
│ └──────────┘ └──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

- **Sidebar** fijo, ~240px: logo MTEC, 3 items de nav, separador, link "← Volver al sitio público".
- **Top bar** ~64px: breadcrumb (Servicios / Nuevo · Servicios / Editar: Nombre), avatar usuario placeholder.
- **Banner "Modo maqueta"**: barra horizontal de bajo contraste con icono info y texto "Los servicios que crees aquí se guardan en tu navegador. No aparecerán todavía en el sitio público — eso se activa cuando conectemos la base de datos."
- **Main scroll**: contenido específico de cada página.

## Vista 1 — Dashboard (`admin/index.html`)

**Composición:**
- Header de sección: título "Servicios" + descripción "Crea, edita y publica las páginas de servicio que aparecen en la navbar." + botón principal **"+ Nuevo servicio"** alineado a la derecha.
- Tabla:
  - Columnas: Slug · Título · Estado · Última edición · Acciones (`···` con menú: Ver pública · Editar · Eliminar).
  - Chip de estado: verde "Publicado" / gris "Borrador".
  - Click en fila completa o "Editar" navega a `servicio.html?slug=<slug>`.
  - "Ver pública" abre `servicios/<slug>.html` en nueva pestaña (en la maqueta solo funciona para `encintado-de-lineas`).
  - "Eliminar" abre confirmación nativa (`confirm()`) antes de borrar.
- Estado vacío (cuando no hay servicios, ej. localStorage limpiado): card centrada con icono SVG inline (carpeta vacía o similar) + texto "Aún no tienes servicios. Crea el primero." + botón "+ Nuevo servicio".

**Datos al cargar:** llama a `getServicios()` y renderiza filas en JS. Si el array está vacío, muestra estado vacío.

## Vista 2 — Formulario de servicio (`admin/servicio.html`)

**Modos:**
- Sin query string → modo "nuevo servicio" (form en blanco).
- `?slug=encintado-de-lineas` → modo "editar" (form prepoblado desde `getServicio('encintado-de-lineas')`).

**Estructura visual:**
- Top bar con breadcrumb dinámico: "Servicios / Nuevo servicio" o "Servicios / Editar: <título>".
- Acciones globales arriba-derecha: `Cancelar` (link) · `Guardar borrador` · `Guardar y publicar` (primary).
- **Barra de tabs horizontales**, sticky bajo el top bar: Hero · Solución · Consideraciones · Geometrías · Certificación · Galería · CTA.
- Solo la tab activa renderiza sus campos; las otras quedan ocultas. JS maneja el switch.
- **Save bar inferior sticky**: duplica las acciones (Cancelar · Guardar borrador · Guardar y publicar) para evitar scrolls al tope.

**Campos por tab:**

### Tab 1 — Hero
- `slug` (text) — autogenerado desde título al perder foco si está vacío; validado (lowercase, ASCII, guiones).
- `eyebrow` (text) — ej. "Servicio Especializado · Operación".
- `titulo` (text, requerido).
- `lead` (textarea, max ~240 caracteres) — descripción corta del hero.
- `heroImagen` (file input + preview) — única imagen.
- `productCallout` opcional, colapsable:
  - `textoSuperior` (ej. "Tecnología aplicada")
  - `nombreProducto` (ej. "Iridium Wrap")
  - `textoInferior` (ej. "AKKAIM INTEGRITY")
  - `imagen` (file + preview) — la imagen pequeña del producto.

### Tab 2 — Solución
- `titulo` (text) — título de la sección.
- `descripcion` (textarea) — descripción larga.
- `metricaClave` opcional:
  - `valor` (text, ej. "MAOP")
  - `label` (text, ej. "original")
- **Repeater "Beneficios"** (ideal 6 items, sin tope rígido):
  - Cada item: `icono` (select de un set predefinido de ~12 SVGs inline que se extraen de los iconos ya usados en `servicios/encintado-de-lineas.html` — escudo, check, válvula, presión, etc.) + `label` (text corto) + `chip` (text de etiqueta).
  - Botón "+ Agregar beneficio" al final.

### Tab 3 — Consideraciones técnicas
- `titulo` (text) + `lead` (textarea).
- **Repeater "Consideraciones"**:
  - Cada item: `numero` (auto, no editable; se recalcula al reordenar) + `titulo` (text) + `descripcion` (textarea).

### Tab 4 — Geometrías aplicables
- `titulo` (text) + `descripcion` (textarea).
- **Repeater "Geometrías"**:
  - Cada item: `nombre` (text, ej. "Codos") + `icono` (select del mismo set predefinido de SVGs).

### Tab 5 — Certificación & Normativa
- **Repeater "Badges"**: solo `nombre` (text, ej. "API", "ASME", "ISO"). Renderiza como chip grande.
- **Repeater "Normas específicas"**: solo `texto` (text libre, ej. "ASME PCC-2 Art. 4.1").
- `fichaTecnicaPdf` (file input + nombre del archivo + link "Ver" si ya hay uno).
- `certificadosPdf` (file input + nombre del archivo + link "Ver" si ya hay uno).

### Tab 6 — Galería
- **Repeater "Imágenes"**:
  - Cada item: `imagen` (file + preview) + `caption` (text opcional) + `tamano` (select: Pequeño / Mediano / Grande — afecta cómo se ubica en el bento grid).

### Tab 7 — CTA final
- `headline` (text, con default "¿Tu activo necesita esta solución?").
- `botonTexto` (text, con default "Agenda una reunión").

**Comportamiento:**
- Al cambiar de tab, el form NO pierde la data: todo se mantiene en un objeto JS en memoria hasta guardar.
- `beforeunload` con confirmación nativa si hay cambios sin guardar.
- Validaciones inline al intentar guardar: `titulo` y `slug` son obligatorios; `slug` único (chequea contra `getServicios()`).
- Botón "Guardar borrador" → `saveServicio({ ...data, estado: 'borrador' })` → toast "Borrador guardado" → quedarse en la página.
- Botón "Guardar y publicar" → `saveServicio({ ...data, estado: 'publicado' })` → toast "Publicado. Cuando conectemos la base de datos, aparecerá en la navbar bajo Servicios > Servicios Especializados." → redirigir al dashboard tras 2s.

## Vistas 3 y 4 — Media y Configuración (placeholders)

- **Media** (`admin/media.html`): título + descripción + grid de cards mostrando los assets que ya están en localStorage (PDFs de fichas técnicas + imágenes hero + galería), agrupados por servicio. Solo lectura en esta fase — no se puede subir archivos sueltos sin asociarlos a un servicio. Sirve para mostrar visualmente la huella de assets.
- **Configuración** (`admin/config.html`): título + secciones esqueleto sin lógica:
  - "Información de la empresa" (campos teléfono, dirección, email — solo placeholder).
  - "Redes sociales" (LinkedIn, Instagram — solo placeholder).
  - Banner amarillo: "Esta sección estará disponible cuando conectemos la base de datos."

Ambas existen para que el sidebar nav tenga destinos reales (no dead links) y para que el cliente vea hacia dónde va el admin.

## Persistencia — `admin/assets/js/admin-data.js`

**Forma del JSON guardado en `localStorage['mtec_admin_servicios']`:**

```js
[
  {
    slug: 'encintado-de-lineas',
    titulo: 'Encintado de Líneas',
    eyebrow: 'Servicio Especializado · Operación',
    lead: 'Sistema de matriz compuesta…',
    estado: 'publicado',
    fechaCreacion: '2026-05-01T10:00:00Z',
    fechaEdicion: '2026-05-14T22:30:00Z',
    hero: {
      imagen: 'data:image/png;base64,…',
      productCallout: {
        textoSuperior: 'Tecnología aplicada',
        nombreProducto: 'Iridium Wrap',
        textoInferior: 'AKKAIM INTEGRITY',
        imagen: 'data:image/png;base64,…'
      }
    },
    solucion: {
      titulo: '…',
      descripcion: '…',
      metricaClave: { valor: 'MAOP', label: 'original' },
      beneficios: [
        { icono: 'shield', label: 'Sin detener el flujo', chip: 'En operación' },
        // ...
      ]
    },
    consideraciones: {
      titulo: '…',
      lead: '…',
      items: [
        { titulo: '…', descripcion: '…' },
        // ...
      ]
    },
    geometrias: {
      titulo: '…',
      descripcion: '…',
      items: [
        { nombre: 'Codos', icono: 'elbow' },
        // ...
      ]
    },
    certificacion: {
      badges: [{ nombre: 'API' }, { nombre: 'ASME' }, { nombre: 'ISO' }],
      normas: [{ texto: 'ASME PCC-2 Art. 4.1' }, /* … */],
      fichaTecnicaPdf: { nombre: 'IridiumWrap - TDS (Spanish).pdf', dataUrl: 'data:application/pdf;base64,…' },
      certificadosPdf: null
    },
    galeria: [
      { dataUrl: '…', caption: '…', tamano: 'L' },
      // ...
    ],
    cta: { headline: '¿Tu activo necesita esta solución?', botonTexto: 'Agenda una reunión' }
  }
]
```

**API pública de `admin-data.js`:**

```js
// Lee todos los servicios. Si no hay key, escribe el seed y devuelve.
getServicios() => Promise<Servicio[]>

// Lee uno. Devuelve null si no existe.
getServicio(slug) => Promise<Servicio | null>

// Upsert por slug. Actualiza fechaEdicion. Si slug ya existe en modo "nuevo", lanza error.
saveServicio(data) => Promise<Servicio>

// Borra por slug. Devuelve true si borró algo.
deleteServicio(slug) => Promise<boolean>
```

Todas son `async` (devuelven Promises) para que la migración a `fetch()` sea reemplazo directo de los internals — los callers ya están preparados con `await`.

**Seed inicial:** la primera vez que se abre el admin, si la key no existe, `getServicios()` escribe un array con un único objeto correspondiente a "Encintado de Líneas", con datos extraídos del HTML actual de `servicios/encintado-de-lineas.html`. Las imágenes se referencian por path (no se convierten a base64 para el seed — son archivos del repo). Los nuevos uploads sí se convierten a base64.

**Edge cases:**
- Slug duplicado al crear: error inline + bloquea guardado.
- Slug con acentos o caracteres especiales: autoslugify (NFD → eliminar diacríticos → lowercase → reemplazar no-alfanuméricos por `-`).
- Imagen pesada (>2MB en base64): warning amarillo bajo el preview, "Imagen grande. Considera optimizarla antes de publicar."
- Cuota de localStorage excedida: try/catch alrededor de `setItem`; si falla, alert "Se llenó la memoria del navegador. Elimina servicios antiguos o exporta tu trabajo."

## Estilo visual

Identidad de marca consistente con el sitio público pero más utilitaria:

- **Paleta**: misma de MTEC (`#1B6CA8`, `#0B3554`, `#EDF1F5`, `#B2BEC9`) más `#0F1B2A` para fondo base.
- **Fondo**: sólido `#0F1B2A`. Sin textura blueprint — sería ruido visual en forms largos.
- **Tipografía**: Inter exclusivamente. Sin display/serif. Títulos en peso 600. Body normal 14-15px.
- **Sidebar**: fondo `#0B1A28` (apenas más oscuro), borde derecho `1px rgba(255,255,255,0.06)`, item activo con fondo `rgba(43,130,185,0.15)` + barra lateral azul `#2B82B9`.
- **Topbar**: fondo `#0F1B2A` con borde inferior `1px rgba(255,255,255,0.06)`.
- **Cards / inputs**: superficie `rgba(255,255,255,0.04)`, borde `rgba(255,255,255,0.10)`, radius 6px. Hover: borde `rgba(255,255,255,0.20)`. Focus: borde `#2B82B9` + ring `0 0 0 3px rgba(43,130,185,0.20)`.
- **Botones primary**: blanco con texto `#0B3554`, hover `#EDF1F5`. **Secundario/ghost**: outline `rgba(255,255,255,0.20)` con texto vapor, hover background `rgba(255,255,255,0.06)`.
- **Tabs**: pill style. Activa: fondo blanco + texto deep blue. Inactivas: texto `rgba(255,255,255,0.55)`, hover texto vapor.
- **Repeater items**: cada uno en una card con drag handle visual (icono `⋮⋮` a la izquierda, no funcional en v1) + botón "Eliminar" con icono trash en hover. Botón "+ Agregar" como ghost con dashed border al final del repeater.
- **Animaciones**: solo transiciones rápidas de hover/focus (~150ms). Sin reveal animations.
- **Chips de estado**: "Publicado" → texto blanco sobre `rgba(34,197,94,0.20)` con borde `rgba(34,197,94,0.40)`. "Borrador" → texto `rgba(255,255,255,0.65)` sobre `rgba(255,255,255,0.06)`.
- **Banner "Modo maqueta"**: fondo `rgba(251,191,36,0.10)`, borde `rgba(251,191,36,0.30)`, texto vapor, icono info a la izquierda.

## Flujo navbar — maqueta vs próxima fase

**Hoy (maqueta):**
- Publicar un servicio guarda el JSON en localStorage.
- Toast confirma que aparecerá en la navbar "cuando conectemos la base de datos".
- La navbar pública (`partials/nav.html`) no se modifica.
- La página pública del servicio (`servicios/<slug>.html`) no se genera.

**Próxima fase (cuando exista BBDD):**
- El JSON migra a tablas en la BBDD; las 4 funciones de `admin-data.js` se reescriben para llamar a una API.
- `partials/nav.html` se vuelve un template parcial; `assets/js/partials.js` hidrata el dropdown "Servicios Especializados" con un fetch a `/api/servicios?estado=publicado`.
- Las páginas de servicio se renderizan dinámicamente desde el JSON. Dos opciones (decisión próxima fase): build script Node que regenera HTML estático en cada cambio, o migración a un framework con SSR (Astro/Next).
- El banner "Modo maqueta" se quita.

## Verificación end-to-end (cuando se implemente)

1. `node serve.mjs` corriendo en `localhost:1112`.
2. Abrir `http://localhost:1112/admin/`.
3. Ver banner "Modo maqueta" visible.
4. Ver tabla con una fila: "Encintado de Líneas" en estado "Publicado".
5. Click en "Editar" → form se abre prepoblado con todos los datos del servicio.
6. Cambiar el título → ver que el breadcrumb actualiza dinámicamente.
7. Cambiar de tab → la data anterior persiste.
8. Click en "Guardar y publicar" → toast aparece → redirección al dashboard → fila muestra "hace unos segundos".
9. Click en "+ Nuevo servicio" → form vacío → llenar campos mínimos (título + slug) → "Guardar borrador" → toast → redirección.
10. Dashboard muestra dos filas (Encintado publicado + nuevo en borrador).
11. Refrescar la página → ambos servicios siguen ahí (localStorage persiste).
12. Eliminar el nuevo → confirmación → desaparece de la lista.
13. Limpiar localStorage manualmente → recargar admin → ver estado vacío + botón crear.
14. Click "← Volver al sitio público" en sidebar → navega a `/index.html`.
15. Verificar visualmente que la navbar pública NO incluye el nuevo servicio (esperado en maqueta).
