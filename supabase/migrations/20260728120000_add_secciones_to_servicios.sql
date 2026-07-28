-- Migration: per-service section headings (tag / titulo / descripcion).
--
-- Until now the headings of every section on a service page ("Certificación &
-- Normativa", "Casos en terreno", …) were hard-coded in servicios/index.html,
-- so every service shared them. This column makes them editable per service.
--
-- Shape:
--   {
--     "certificacion": { "tag": "…", "titulo": "…", "descripcion": "…" },
--     "solucion":      { "tag": "…", "titulo": "…", "descripcion": "…" },
--     "geometrias":    { "tag": "…", "titulo": "…", "descripcion": "…" },
--     "galeria":       { "tag": "…", "titulo": "…", "descripcion": "…" }
--   }
--
-- A missing key means "use the built-in default"; a key present but empty
-- means "hide this element". Existing rows default to '{}', so they keep
-- rendering exactly as before until they are saved from the admin.
--
-- The descriptions of Consideraciones and Geometrías used to live in
-- solucion.descripcion / geometrias.descripcion. Both readers fall back to
-- those legacy paths, so no data migration is needed.
--
-- Idempotent. Safe to re-run.

ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS secciones jsonb NOT NULL DEFAULT '{}'::jsonb;
