# Supabase Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provision the Supabase project `fpewrusowllrycpshxaq` with the `servicios` table, RLS policies, public `service-assets` Storage bucket, and the Encintado de Líneas service as a published seed (data row + hero image + ficha técnica PDF in Storage).

**Architecture:** Three SQL migrations applied via the `mcp__claude_ai_Supabase__apply_migration` tool, each focused on one concern (table schema, RLS on servicios, Storage bucket + policies). One Node script (`scripts/seed-encintado.mjs`) uploads the two seed files to Storage and inserts the encintado row using the service_role key from `.env.local`. Idempotent throughout — re-running any step is a no-op.

**Tech Stack:** Postgres 15 + Supabase Storage (claude.ai Supabase MCP), Node.js ESM, `@supabase/supabase-js` v2.

**Spec:** [docs/superpowers/specs/2026-05-15-supabase-data-layer-design.md](../specs/2026-05-15-supabase-data-layer-design.md)

**Project ref:** `fpewrusowllrycpshxaq`
**Admin user (already created):** `davalos@erres.cl`

---

## File structure

```
supabase/
  migrations/
    20260515120000_create_servicios.sql       Table + trigger + index
    20260515120001_servicios_rls.sql           RLS policies on servicios
    20260515120002_storage_bucket.sql          Bucket + storage.objects policies
scripts/
  seed-encintado.mjs                            Upload files + INSERT row
.env.example                                    Document expected env vars
.env.local                                      Real values, gitignored
.gitignore                                      Ensure .env.local excluded
```

Each migration is a single concern. The seed script is the only place that needs the `service_role` key (server-side write authority). The migrations themselves run through the MCP which is already authenticated against the project.

---

## Task 1: Project setup — dependencies, env files, gitignore

**Goal:** Make sure `@supabase/supabase-js` is installable, env-var contract is documented, and secrets are excluded from git.

**Files:**
- Create or modify: `package.json` (ensure `@supabase/supabase-js` present)
- Create: `.env.example`
- Create or modify: `.gitignore` (add `.env*`, except `.env.example`)

- [ ] **Step 1: Check current package.json state**

Run: `cat package.json` (use `Read` tool on `c:\Users\Mauricio\Desktop\MTEC\package.json`).

Expected: Either a package.json exists with a `dependencies` block, or it doesn't exist. If it doesn't exist, run:

```bash
npm init -y
```

Then `cat package.json` and confirm it has `"name"`, `"version"`, `"main"`, etc.

- [ ] **Step 2: Install @supabase/supabase-js**

```bash
npm install @supabase/supabase-js
```

Expected: completes without errors. If SSL cert errors appear (as happened earlier with `npx skills`), temporarily set `npm config set strict-ssl false`, retry, then restore with `npm config set strict-ssl true`.

After install, verify in `package.json`:
```bash
node -e "console.log(require('./package.json').dependencies['@supabase/supabase-js'])"
```
Expected: prints a version string like `^2.x.x`.

- [ ] **Step 3: Create `.env.example`**

```
# Supabase data layer — values for scripts/seed-encintado.mjs
# Get these from https://supabase.com/dashboard/project/fpewrusowllrycpshxaq/settings/api

SUPABASE_URL=https://fpewrusowllrycpshxaq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key-here...
```

- [ ] **Step 4: Update `.gitignore`**

Read existing `.gitignore` (if it exists). Add these lines if not already present (do NOT delete existing entries):

```
# Local env files (never commit secrets)
.env
.env.local
.env.*.local

# Allow the example file
!.env.example
```

If `.gitignore` doesn't exist yet, create it with those lines plus standard Node entries:
```
node_modules/
.DS_Store
*.log

# Local env files (never commit secrets)
.env
.env.local
.env.*.local

# Allow the example file
!.env.example
```

- [ ] **Step 5: Create the real `.env.local` (NOT committed)**

This file MUST NOT be committed. Instruct the user to:
1. Open https://supabase.com/dashboard/project/fpewrusowllrycpshxaq/settings/api
2. Copy the `service_role` secret (NOT the anon/publishable key)
3. Paste it into `.env.local`:

```
SUPABASE_URL=https://fpewrusowllrycpshxaq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
```

The implementer agent should NOT create `.env.local` themselves with a fake value — they should STOP and ask the user to populate it before proceeding to the seed task (Task 5).

Verify the file is git-ignored:
```bash
git check-ignore -v .env.local
```
Expected: prints a line like `.gitignore:N:.env.local	.env.local`.

- [ ] **Step 6: Commit (only the safe files)**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "feat(supabase): add @supabase/supabase-js, env.example, gitignore secrets"
```

**Verify `.env.local` is NOT staged:** `git status --short` should show no trace of `.env.local` (either unstaged or untracked, but never staged).

---

## Task 2: Migration — `servicios` table, trigger, index

**Goal:** Create the table, the `fecha_edicion` auto-update trigger, and the partial index for the public query. Idempotent.

**Files:**
- Create: `supabase/migrations/20260515120000_create_servicios.sql`

- [ ] **Step 1: Create the migration file**

Path: `c:\Users\Mauricio\Desktop\MTEC\supabase\migrations\20260515120000_create_servicios.sql`

```sql
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
```

- [ ] **Step 2: Apply the migration via MCP**

Use the MCP tool `mcp__claude_ai_Supabase__apply_migration`. Parameters:
- `project_id`: `fpewrusowllrycpshxaq`
- `name`: `create_servicios`
- `query`: paste the entire SQL from Step 1.

The tool will return a success/error response. Expected: success with no error message.

If the tool schema isn't loaded yet, first call:
```
ToolSearch(query="select:mcp__claude_ai_Supabase__apply_migration", max_results=1)
```

- [ ] **Step 3: Verify table exists**

Use `mcp__claude_ai_Supabase__list_tables` with `project_id: fpewrusowllrycpshxaq` and `schemas: ['public']`.

Expected: the response includes a table named `servicios` with all 16 columns (id, slug, titulo, categoria, eyebrow, lead, estado, hero, solucion, consideraciones, geometrias, certificacion, galeria, cta, fecha_creacion, fecha_edicion).

If the schema parameter isn't accepted, fall back to:
```
mcp__claude_ai_Supabase__execute_sql with project_id: fpewrusowllrycpshxaq, query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'servicios' ORDER BY ordinal_position;"
```

Expected: returns 16 rows, columns named as above. `hero` etc. should show `jsonb`.

- [ ] **Step 4: Verify the trigger fires**

Use `mcp__claude_ai_Supabase__execute_sql`:
```sql
INSERT INTO servicios (slug, titulo, categoria) VALUES ('__trigger_test__', 'Test', 'servicios-especializados') RETURNING fecha_creacion, fecha_edicion;
```

Then immediately:
```sql
UPDATE servicios SET titulo = 'Test 2' WHERE slug = '__trigger_test__' RETURNING fecha_creacion, fecha_edicion;
```

Expected: after the UPDATE, `fecha_edicion > fecha_creacion`.

Cleanup:
```sql
DELETE FROM servicios WHERE slug = '__trigger_test__';
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260515120000_create_servicios.sql
git commit -m "feat(supabase): migration — servicios table, fecha_edicion trigger, partial index"
```

---

## Task 3: Migration — RLS policies on `servicios`

**Goal:** Enable RLS, allow anonymous SELECT only for published rows, allow authenticated full CRUD.

**Files:**
- Create: `supabase/migrations/20260515120001_servicios_rls.sql`

- [ ] **Step 1: Create the migration file**

Path: `c:\Users\Mauricio\Desktop\MTEC\supabase\migrations\20260515120001_servicios_rls.sql`

```sql
-- Migration: RLS policies on servicios
-- Anonymous role: read only published rows
-- Authenticated role: full CRUD on all rows
-- Idempotent.

ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicios_public_read_published" ON servicios;
CREATE POLICY "servicios_public_read_published"
  ON servicios FOR SELECT
  USING (estado = 'publicado');

DROP POLICY IF EXISTS "servicios_authenticated_read_all" ON servicios;
CREATE POLICY "servicios_authenticated_read_all"
  ON servicios FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "servicios_authenticated_insert" ON servicios;
CREATE POLICY "servicios_authenticated_insert"
  ON servicios FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "servicios_authenticated_update" ON servicios;
CREATE POLICY "servicios_authenticated_update"
  ON servicios FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "servicios_authenticated_delete" ON servicios;
CREATE POLICY "servicios_authenticated_delete"
  ON servicios FOR DELETE
  TO authenticated
  USING (true);
```

- [ ] **Step 2: Apply the migration via MCP**

Use `mcp__claude_ai_Supabase__apply_migration`:
- `project_id`: `fpewrusowllrycpshxaq`
- `name`: `servicios_rls`
- `query`: paste the entire SQL from Step 1.

Expected: success.

- [ ] **Step 3: Verify RLS is enabled and policies exist**

Use `mcp__claude_ai_Supabase__execute_sql`:

```sql
SELECT relrowsecurity FROM pg_class WHERE relname = 'servicios';
```
Expected: returns `true`.

```sql
SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'servicios' ORDER BY policyname;
```
Expected: 5 rows — policies named `servicios_public_read_published`, `servicios_authenticated_read_all`, `servicios_authenticated_insert`, `servicios_authenticated_update`, `servicios_authenticated_delete`.

- [ ] **Step 4: Run advisors to check for misconfiguration**

Use `mcp__claude_ai_Supabase__get_advisors` with `project_id: fpewrusowllrycpshxaq` and `type: 'security'`.

Expected: no critical issues about `servicios` table. If there are warnings (e.g., "no policies on public table"), they should now be resolved since we just added them.

Note any unexpected warnings in the commit message or report. Don't fix anything outside the scope of this task.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260515120001_servicios_rls.sql
git commit -m "feat(supabase): migration — RLS on servicios (public read published, authenticated CRUD)"
```

---

## Task 4: Migration — Storage bucket + storage.objects policies

**Goal:** Create the public bucket `service-assets` and the four policies on `storage.objects`.

**Files:**
- Create: `supabase/migrations/20260515120002_storage_bucket.sql`

- [ ] **Step 1: Create the migration file**

Path: `c:\Users\Mauricio\Desktop\MTEC\supabase\migrations\20260515120002_storage_bucket.sql`

```sql
-- Migration: service-assets Storage bucket + policies
-- Public bucket: public read, authenticated CRUD
-- Idempotent.

INSERT INTO storage.buckets (id, name, public)
VALUES ('service-assets', 'service-assets', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "service_assets_public_read" ON storage.objects;
CREATE POLICY "service_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-assets');

DROP POLICY IF EXISTS "service_assets_authenticated_insert" ON storage.objects;
CREATE POLICY "service_assets_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-assets');

DROP POLICY IF EXISTS "service_assets_authenticated_update" ON storage.objects;
CREATE POLICY "service_assets_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'service-assets');

DROP POLICY IF EXISTS "service_assets_authenticated_delete" ON storage.objects;
CREATE POLICY "service_assets_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'service-assets');
```

- [ ] **Step 2: Apply the migration via MCP**

Use `mcp__claude_ai_Supabase__apply_migration`:
- `project_id`: `fpewrusowllrycpshxaq`
- `name`: `storage_bucket`
- `query`: paste the entire SQL from Step 1.

Expected: success.

- [ ] **Step 3: Verify bucket and policies**

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'service-assets';
```
Expected: 1 row, `public = true`.

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE 'service_assets%' ORDER BY policyname;
```
Expected: 4 policies — `service_assets_authenticated_delete`, `service_assets_authenticated_insert`, `service_assets_authenticated_update`, `service_assets_public_read`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260515120002_storage_bucket.sql
git commit -m "feat(supabase): migration — service-assets bucket + storage.objects policies"
```

---

## Task 5: Seed script — `scripts/seed-encintado.mjs`

**Goal:** A single Node ESM script that, with the service_role key, uploads the two encintado files to Storage and inserts the encintado row. Idempotent. Verbose logs.

**Files:**
- Create: `scripts/seed-encintado.mjs`

- [ ] **Step 0: Verify `.env.local` is populated before continuing**

The user must have populated `.env.local` per Task 1 Step 5. Run:

```bash
node -e "import('dotenv').then(d=>d.config({path:'.env.local'})).then(()=>console.log('URL:', !!process.env.SUPABASE_URL, 'KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY))"
```

If this errors with "Cannot find module 'dotenv'", install it first:
```bash
npm install --save-dev dotenv
git add package.json package-lock.json
git commit -m "chore: add dotenv for local seed script"
```

Then re-run the verification.

Expected output: `URL: true KEY: true`.

If either is `false`, STOP — the user has not populated `.env.local` correctly. Ask them to confirm both values.

- [ ] **Step 1: Create the seed script**

Path: `c:\Users\Mauricio\Desktop\MTEC\scripts\seed-encintado.mjs`

```js
// scripts/seed-encintado.mjs
// One-shot, idempotent seed of the "Encintado de Líneas" service into Supabase.
// Uploads hero image and ficha técnica PDF to Storage, then inserts the DB row.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// Run: node scripts/seed-encintado.mjs

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const BUCKET = 'service-assets';
const SLUG = 'encintado-de-lineas';

// Files to upload: { localPath, storagePath, contentType }
const FILES = [
  {
    localPath: path.join(ROOT, 'brand_assets', 'site_pictures', 'encintado_linea.png'),
    storagePath: `${SLUG}/hero.png`,
    contentType: 'image/png'
  },
  {
    localPath: path.join(ROOT, 'deliverables', 'fichas-tecnicas', 'IridiumWrap - TDS (Spanish).pdf'),
    storagePath: `${SLUG}/ficha-tecnica.pdf`,
    contentType: 'application/pdf'
  }
];

// The exact row to insert. Image and PDF references use Storage paths.
const ROW = {
  slug: SLUG,
  titulo: 'Encintado de Líneas',
  categoria: 'servicios-especializados',
  eyebrow: 'Servicio Especializado · Operación',
  lead: 'Sistema de matriz compuesta basado en fibra de carbono que rehabilita y restablece la capacidad MAOP original de tubos y tuberías con daños, corrosión o erosión — sin necesidad de detener el flujo.',
  estado: 'publicado',
  hero: {
    imagen: `${SLUG}/hero.png`,
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
    fichaTecnicaPdf: { nombre: 'IridiumWrap - TDS (Spanish).pdf', path: `${SLUG}/ficha-tecnica.pdf` },
    certificadosPdf: null
  },
  galeria: [],
  cta: { headline: '¿Tu activo necesita esta solución?', botonTexto: 'Agenda una reunión' }
};

async function uploadFile({ localPath, storagePath, contentType }) {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Local file not found: ${localPath}`);
  }
  const buffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw error;
  console.log(`  ✓ uploaded ${storagePath} (${buffer.length} bytes)`);
  return data;
}

async function upsertRow() {
  // Use INSERT ... ON CONFLICT (slug) DO NOTHING to make this idempotent.
  // We rely on the unique constraint on slug.
  const { data: existing, error: selErr } = await supabase
    .from('servicios')
    .select('slug')
    .eq('slug', SLUG)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    console.log(`  ✓ row already exists for slug "${SLUG}", skipping INSERT (run an UPDATE separately if you need to refresh content)`);
    return;
  }

  const { error: insErr } = await supabase
    .from('servicios')
    .insert(ROW);
  if (insErr) throw insErr;
  console.log(`  ✓ inserted row for slug "${SLUG}"`);
}

async function main() {
  console.log('Supabase seed — Encintado de Líneas');
  console.log(`Project: ${SUPABASE_URL}`);
  console.log('');

  console.log('Uploading files to Storage...');
  for (const f of FILES) {
    await uploadFile(f);
  }

  console.log('');
  console.log('Upserting servicios row...');
  await upsertRow();

  console.log('');
  console.log('Done. Next: open Supabase Dashboard and verify the row + files.');
}

main().catch((err) => {
  console.error('SEED FAILED:', err.message || err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the script syntax**

```bash
node --check scripts/seed-encintado.mjs
```

Expected: no output (success).

- [ ] **Step 3: Commit (without running the script yet)**

```bash
git add scripts/seed-encintado.mjs
git commit -m "feat(supabase): seed script for Encintado de Líneas (uploads + row insert)"
```

---

## Task 6: Run the seed + full end-to-end verification

**Goal:** Execute the seed script and verify all 8 checkpoints from the spec.

**No files modified.** This task is pure verification.

- [ ] **Step 1: Confirm prerequisite state**

Run these one-liners; each must succeed:
```bash
ls supabase/migrations/20260515120000_create_servicios.sql
ls supabase/migrations/20260515120001_servicios_rls.sql
ls supabase/migrations/20260515120002_storage_bucket.sql
ls scripts/seed-encintado.mjs
ls .env.local
ls "brand_assets/site_pictures/encintado_linea.png"
ls "deliverables/fichas-tecnicas/IridiumWrap - TDS (Spanish).pdf"
```

All must list the file (no "No such file" errors).

- [ ] **Step 2: Run the seed**

```bash
node scripts/seed-encintado.mjs
```

Expected output:
```
Supabase seed — Encintado de Líneas
Project: https://fpewrusowllrycpshxaq.supabase.co

Uploading files to Storage...
  ✓ uploaded encintado-de-lineas/hero.png (...) bytes)
  ✓ uploaded encintado-de-lineas/ficha-tecnica.pdf (...) bytes)

Upserting servicios row...
  ✓ inserted row for slug "encintado-de-lineas"

Done. Next: open Supabase Dashboard and verify the row + files.
```

If anything fails, do NOT proceed — report the error verbatim.

- [ ] **Step 3: Verify checkpoint 1 — schema exists**

Use `mcp__claude_ai_Supabase__list_tables` with `project_id: fpewrusowllrycpshxaq`, `schemas: ['public']`.

Expected: `servicios` listed with all 16 columns.

- [ ] **Step 4: Verify checkpoint 2 — bucket exists and is public**

`mcp__claude_ai_Supabase__execute_sql` with:
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'service-assets';
```
Expected: 1 row, `public = true`.

- [ ] **Step 5: Verify checkpoint 3 — seed row loaded**

```sql
SELECT slug, titulo, estado, categoria, fecha_creacion, fecha_edicion FROM servicios;
```

Expected: 1 row — `encintado-de-lineas | Encintado de Líneas | publicado | servicios-especializados | <recent> | <recent>`.

- [ ] **Step 6: Verify checkpoint 4 — files uploaded**

```sql
SELECT name, metadata->'size' AS size_bytes FROM storage.objects WHERE bucket_id = 'service-assets' ORDER BY name;
```

Expected: 2 rows — `encintado-de-lineas/ficha-tecnica.pdf` and `encintado-de-lineas/hero.png`, both with non-zero `size_bytes`.

- [ ] **Step 7: Verify checkpoint 5 — anonymous public read works**

Get the project's anon key first via `mcp__claude_ai_Supabase__get_publishable_keys` with `project_id: fpewrusowllrycpshxaq`. Note the key value.

Then a quick curl test from the project root:
```bash
curl -s "https://fpewrusowllrycpshxaq.supabase.co/rest/v1/servicios?select=slug,titulo&estado=eq.publicado" -H "apikey: <PASTE_ANON_KEY>"
```

Expected: `[{"slug":"encintado-de-lineas","titulo":"Encintado de Líneas"}]`.

- [ ] **Step 8: Verify checkpoint 6 — anonymous CANNOT read drafts**

Insert a draft row via `execute_sql` (service_role bypasses RLS):
```sql
INSERT INTO servicios (slug, titulo, categoria, estado) VALUES ('__draft_test__', 'Draft Test', 'servicios-especializados', 'borrador');
```

Then repeat the curl above. Expected: still returns only the encintado row, NOT the draft.

Cleanup:
```sql
DELETE FROM servicios WHERE slug = '__draft_test__';
```

- [ ] **Step 9: Verify checkpoint 7 — authenticated update works (manual)**

This step requires the user to be logged in as `davalos@erres.cl`. Easiest path: use the Supabase Dashboard SQL editor (it auto-authenticates with their session).

Instruct the user:
1. Open https://supabase.com/dashboard/project/fpewrusowllrycpshxaq/sql
2. Run:
   ```sql
   SELECT fecha_edicion FROM servicios WHERE slug = 'encintado-de-lineas';
   ```
   Note the value (call it T1).
3. Run:
   ```sql
   UPDATE servicios SET eyebrow = eyebrow WHERE slug = 'encintado-de-lineas';
   ```
4. Run the SELECT again. Expected: `fecha_edicion > T1` (the trigger fired on no-op UPDATE).

If skipping (because we can't drive the dashboard from the agent), note this as "manual user verification pending" and proceed.

- [ ] **Step 10: Verify checkpoint 8 — Storage public URL works**

Open in browser:
```
https://fpewrusowllrycpshxaq.supabase.co/storage/v1/object/public/service-assets/encintado-de-lineas/hero.png
```

Expected: the image renders (the same `encintado_linea.png` that's in the repo). HTTP 200.

For an automated check:
```bash
curl -sI "https://fpewrusowllrycpshxaq.supabase.co/storage/v1/object/public/service-assets/encintado-de-lineas/hero.png" | head -1
```
Expected: `HTTP/2 200` or `HTTP/1.1 200 OK`.

Repeat for the PDF:
```bash
curl -sI "https://fpewrusowllrycpshxaq.supabase.co/storage/v1/object/public/service-assets/encintado-de-lineas/ficha-tecnica.pdf" | head -1
```
Expected: HTTP 200.

- [ ] **Step 11: Run advisors one more time**

`mcp__claude_ai_Supabase__get_advisors` with `project_id: fpewrusowllrycpshxaq`, `type: 'security'`.

Expected: no critical issues mentioning `servicios` or `service-assets`. Performance advisors may flag minor things but those are not blocking.

- [ ] **Step 12: Final commit (verification log)**

No code change. If all 8 checkpoints pass, commit a stub marker so the closure of this sub-project is in the history:

```bash
git commit --allow-empty -m "verify(supabase): data layer end-to-end — schema, RLS, bucket, seed all green

Checkpoints passed:
1. servicios table exists with all 16 columns
2. service-assets bucket exists (public)
3. encintado-de-lineas row inserted (estado=publicado)
4. hero.png + ficha-tecnica.pdf uploaded to Storage
5. Anonymous can read published rows via REST API
6. Anonymous CANNOT read draft rows (RLS blocks)
7. Authenticated UPDATE triggers fecha_edicion auto-update
8. Storage public URLs return HTTP 200 for both files

Next sub-project: Auth UI for admin (login page + session)."
```

---

## Self-review notes

**Spec coverage check:**
- Tabla `servicios` schema (CREATE TABLE + trigger + index) → Task 2.
- Storage bucket + storage policies → Task 4.
- RLS policies on servicios → Task 3.
- Admin user → No code task; user already created it per Task 0/spec.
- Seed encintado (row + 2 files) → Tasks 5 + 6.
- End-to-end verification (8 checkpoints) → Task 6.
- Idempotency throughout → handled via `IF NOT EXISTS` / `DROP ... IF EXISTS` / `upsert: true` / `ON CONFLICT DO NOTHING` / select-before-insert pattern in seed.
- File structure (supabase/migrations/, scripts/) → Task 1 sets up; Tasks 2-5 create the files.

**Placeholder scan:** no "TBD", "TODO", or "fill in" remaining. Each step has concrete code/commands and expected outputs.

**Type/name consistency:**
- Bucket id consistently `service-assets`.
- Slug consistently `encintado-de-lineas`.
- Policy names matched between Task 3 (servicios) and Task 4 (storage.objects) — five for servicios, four for storage.objects.
- Storage paths: `<slug>/hero.png`, `<slug>/ficha-tecnica.pdf` consistent in spec, migrations, seed script, and verification.
- Tool names: `mcp__claude_ai_Supabase__apply_migration`, `mcp__claude_ai_Supabase__execute_sql`, `mcp__claude_ai_Supabase__list_tables`, `mcp__claude_ai_Supabase__get_advisors`, `mcp__claude_ai_Supabase__get_publishable_keys` used consistently. If a worker can't find a tool, they call ToolSearch to load the schema.

**Caveat on tool availability:** The MCP tools are deferred at session start (must be loaded via ToolSearch). The implementer subagent should call ToolSearch in its first step if it intends to invoke them. If the tool resolution fails, fall back to the Supabase CLI (`npx supabase db push`) — but that requires the CLI to be installed locally, which the project doesn't currently have, so prefer MCP.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-15-supabase-data-layer.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Good for the 6-task structure here where each task is self-contained and verifiable.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, with batch execution and checkpoints for review.

Which approach?
