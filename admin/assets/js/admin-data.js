// ══════════════════════════════════════════════════════════════════
// admin-data.js — única capa que toca localStorage
// Para migrar a API: reemplazar el cuerpo de las 4 funciones por fetch().
// ══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'mtec_admin_servicios';

const SEED = [{
  slug: 'encintado-de-lineas',
  titulo: 'Encintado de Líneas',
  categoria: 'servicios-especializados',
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
