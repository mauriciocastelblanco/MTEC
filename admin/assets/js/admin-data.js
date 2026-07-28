// ══════════════════════════════════════════════════════════════════
// admin-data.js — data access layer backed by Supabase.
// Same public API as the previous localStorage version so admin-ui.js
// keeps working without changes to the form/dashboard logic.
// ══════════════════════════════════════════════════════════════════

import { supabase } from './supabase-client.js';

const BUCKET = 'servicios-media';

function fromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    titulo: row.titulo,
    categoria: row.categoria,
    eyebrow: row.eyebrow,
    lead: row.lead,
    estado: row.estado,
    hero: row.hero || {},
    solucion: row.solucion || {},
    consideraciones: row.consideraciones || {},
    geometrias: row.geometrias || {},
    certificacion: row.certificacion || {},
    galeria: row.galeria || [],
    secciones: row.secciones || {},
    cta: row.cta || {},
    fechaCreacion: row.fecha_creacion,
    fechaEdicion: row.fecha_edicion,
  };
}

function toDb(s) {
  return {
    slug: s.slug,
    titulo: s.titulo,
    categoria: s.categoria,
    eyebrow: s.eyebrow ?? null,
    lead: s.lead ?? null,
    estado: s.estado ?? 'borrador',
    hero: s.hero ?? {},
    solucion: s.solucion ?? {},
    consideraciones: s.consideraciones ?? {},
    geometrias: s.geometrias ?? {},
    certificacion: s.certificacion ?? {},
    galeria: s.galeria ?? [],
    secciones: s.secciones ?? {},
    cta: s.cta ?? {},
  };
}

export async function getServicios() {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .order('fecha_edicion', { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
}

export async function getServicio(slug) {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return fromDb(data);
}

export async function saveServicio(data) {
  if (!data.slug) throw new Error('saveServicio: slug requerido');
  if (!data.titulo) throw new Error('saveServicio: titulo requerido');

  const payload = toDb(data);
  const { data: row, error } = await supabase
    .from('servicios')
    .upsert(payload, { onConflict: 'slug' })
    .select()
    .single();
  if (error) throw error;
  return fromDb(row);
}

export async function deleteServicio(slug) {
  const { error, count } = await supabase
    .from('servicios')
    .delete({ count: 'exact' })
    .eq('slug', slug);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// ── Storage helpers ──────────────────────────────────────────────

function safeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .slice(0, 100);
}

export async function uploadAsset(file, prefix = 'misc') {
  if (!file) throw new Error('uploadAsset: file requerido');
  const key = `${prefix}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
