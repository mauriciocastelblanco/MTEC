-- Migration: create servicios table + trigger + partial index
-- Idempotent. Safe to re-run.

CREATE TABLE IF NOT EXISTS servicios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  titulo          text NOT NULL,
  categoria       text NOT NULL
                   CHECK (categoria IN ('servicios-especializados','representacion','comercializacion')),
  eyebrow         text,
  lead            text,
  estado          text NOT NULL DEFAULT 'borrador'
                   CHECK (estado IN ('publicado','borrador')),

  hero            jsonb NOT NULL DEFAULT '{}'::jsonb,
  solucion        jsonb NOT NULL DEFAULT '{}'::jsonb,
  consideraciones jsonb NOT NULL DEFAULT '{}'::jsonb,
  geometrias      jsonb NOT NULL DEFAULT '{}'::jsonb,
  certificacion   jsonb NOT NULL DEFAULT '{}'::jsonb,
  galeria         jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta             jsonb NOT NULL DEFAULT '{}'::jsonb,

  fecha_creacion  timestamptz NOT NULL DEFAULT now(),
  fecha_edicion   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_set_fecha_edicion()
RETURNS trigger AS $$
BEGIN
  NEW.fecha_edicion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_fecha_edicion ON servicios;
CREATE TRIGGER set_fecha_edicion
BEFORE UPDATE ON servicios
FOR EACH ROW EXECUTE FUNCTION trigger_set_fecha_edicion();

CREATE INDEX IF NOT EXISTS idx_servicios_estado_categoria
  ON servicios(estado, categoria)
  WHERE estado = 'publicado';
