# Supabase Data Layer — Schema + Storage + RLS

**Estado:** Spec aprobada · pendiente plan de implementación
**Fecha:** 2026-05-15
**Autor:** Claude + mauriciocastelblanco
**Proyecto Supabase:** `fpewrusowllrycpshxaq`
**MCP Server:** registrado en `.mcp.json` con scope project

## Contexto

El sitio MTEC tiene un admin maqueta con persistencia en `localStorage` ([docs/superpowers/specs/2026-05-14-admin-mtec-design.md](2026-05-14-admin-mtec-design.md)). Funciona como prototipo, pero no se sincroniza con el sitio público: las páginas de servicio (`servicios/*.html`) y el dropdown de la navbar pública siguen siendo HTML estático hardcodeado.

Este spec define la **capa de datos en Supabase** que reemplazará el localStorage. Es el **primer sub-proyecto de 4** que componen la migración total:

1. **Data layer (este spec)** — schema, RLS, Storage buckets, seed inicial.
2. Auth (próximo) — login UI del admin, sesión, manejo de tokens.
3. Admin migration — swap del adapter `admin-data.js` por llamadas Supabase JS, uploads a Storage.
4. Public site integration — navbar dinámico, decisión sobre rendering (estático vía build script vs dinámico client-side) de las páginas de servicio.

**Cada sub-proyecto produce algo testeable por sí solo.** Al cerrar el #1, la DB queda lista para ser consumida — la verificación es que se pueda hacer un `SELECT` que devuelva el seed y subir/descargar un archivo desde Storage. Nada del sitio público ni del admin cambia todavía.

## Objetivo

Dejar la DB de Supabase con:
- Una tabla `servicios` que mapea 1:1 al shape del JSON del admin maqueta.
- Un bucket público `service-assets` con la convención de paths definida.
- RLS aplicado correctamente (público lee publicado, autenticado lee/escribe todo).
- El servicio "Encintado de Líneas" como seed publicado, con su imagen del hero y su PDF de ficha técnica ya subidos a Storage.
- El admin user `davalos@erres.cl` (ya creado en Auth) con permisos completos vía RLS.

Al final, cualquier cliente HTTP con la `anon key` puede hacer `SELECT * FROM servicios WHERE estado = 'publicado'` y obtener encintado-de-lineas, más leer su `hero.png` y `ficha-tecnica.pdf` desde Storage.

## Alcance

**Dentro:**
- Migration SQL que crea: tabla `servicios`, índices, trigger de `fecha_edicion`, bucket `service-assets`, todas las RLS policies.
- Script Node (idempotente) que sube los 2 archivos del seed a Storage y hace el INSERT del registro encintado.
- Documentación del schema (este archivo) versionada en el repo.

**Fuera (próximos sub-proyectos):**
- Login UI del admin / Auth flow.
- Cambios en `admin/assets/js/admin-data.js` (sigue con localStorage hasta el sub-proyecto 3).
- Cambios en `partials/nav.html` o las páginas de servicio (sigue estático hasta el sub-proyecto 4).
- Política de backup automático (Supabase ya hace daily backups en el plan free; cuando crezca lo revisitamos).
- Estrategia de migración de assets de `brand_assets/` adicionales (el seed solo migra los del encintado).

## Schema — tabla `servicios`

```sql
CREATE TABLE servicios (
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

CREATE TRIGGER set_fecha_edicion
BEFORE UPDATE ON servicios
FOR EACH ROW EXECUTE FUNCTION trigger_set_fecha_edicion();

CREATE INDEX idx_servicios_estado_categoria
  ON servicios(estado, categoria)
  WHERE estado = 'publicado';
```

**Decisiones de diseño:**

- **`id` uuid** (no autoincrement): mejor para distribución, no expone cantidad de registros, fácil de generar client-side antes de insertar.
- **`slug` UNIQUE**: previene duplicados a nivel DB, no solo en UI.
- **JSONB para secciones anidadas**: cada servicio se renderiza como documento completo (página de servicio o item del dropdown). No hay queries que filtren por contenido anidado en el alcance. Si más adelante alguna sección se vuelve global (ej. una librería compartida de iconos), se promueve a tabla propia.
- **`NOT NULL DEFAULT '{}'::jsonb`** en cada JSONB: el consumer siempre recibe un objeto/array, nunca null. Reduce ramas en el código de render.
- **CHECK constraints** en `categoria` y `estado`: la DB rechaza valores inválidos sin depender de validación en cliente.
- **Index parcial** sobre `(estado, categoria) WHERE estado='publicado'`: el query más frecuente del sitio público es "dame los publicados de la categoría X" (lo que pueblan los 3 sub-paneles de la navbar). Index parcial = pequeño y rápido.
- **Trigger en fecha_edicion**: el admin nunca tiene que pensar en setearla; cualquier UPDATE la refresca.

## Storage bucket `service-assets`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-assets', 'service-assets', true);
```

**Convención de paths:**

```
service-assets/
  <slug>/
    hero.{jpg|png|webp}
    callout.{jpg|png|webp}
    gallery/
      0.{jpg|png|webp}
      1.{jpg|png|webp}
      ...
    ficha-tecnica.pdf
    certificados.pdf
```

**Cómo se referencian los archivos en JSONB** (path relativo, no URL completa):

```jsonc
{
  "hero": {
    "imagen": "encintado-de-lineas/hero.png",
    "productCallout": {
      "imagen": "encintado-de-lineas/callout.png",
      ...
    }
  },
  "certificacion": {
    "fichaTecnicaPdf": {
      "nombre": "IridiumWrap - TDS (Spanish).pdf",
      "path": "encintado-de-lineas/ficha-tecnica.pdf"
    }
  },
  "galeria": [
    { "path": "encintado-de-lineas/gallery/0.png", "caption": "...", "tamano": "L" }
  ]
}
```

El consumer construye la URL pública con:
```js
const { data } = supabase.storage.from('service-assets').getPublicUrl(path);
// → https://fpewrusowllrycpshxaq.supabase.co/storage/v1/object/public/service-assets/<path>
```

**Por qué path y no URL completa:** portable across environments, más corto en DB, fácil cambiar bucket/CDN sin reescribir registros.

## Row Level Security

**`servicios`:**

```sql
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicios_public_read_published"
  ON servicios FOR SELECT
  USING (estado = 'publicado');

CREATE POLICY "servicios_authenticated_read_all"
  ON servicios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "servicios_authenticated_insert"
  ON servicios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "servicios_authenticated_update"
  ON servicios FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "servicios_authenticated_delete"
  ON servicios FOR DELETE
  TO authenticated
  USING (true);
```

**Modelo de permisos:**
- **Anónimo** (sitio público con anon key): solo `SELECT` y solo donde `estado = 'publicado'`. Los borradores son invisibles.
- **Autenticado** (admin `davalos@erres.cl`): `SELECT/INSERT/UPDATE/DELETE` sobre todo, sin filtro de estado. Cuatro policies separadas en lugar de una `FOR ALL` para mayor claridad de auditoría.

**`storage.objects` (bucket service-assets):**

```sql
CREATE POLICY "service_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-assets');

CREATE POLICY "service_assets_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-assets');

CREATE POLICY "service_assets_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'service-assets');

CREATE POLICY "service_assets_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'service-assets');
```

## Admin user

**Ya creado por el usuario** vía dashboard de Supabase: `davalos@erres.cl`.

Confirmar antes de aplicar la migration:
- Email confirmado (no pending verification).
- Password no expirado.
- Aparece en https://supabase.com/dashboard/project/fpewrusowllrycpshxaq/auth/users.

**No se versionan credenciales.** Si más adelante hay que rotar el password o agregar otro admin, se hace en el dashboard directamente.

## Seed inicial — Encintado de Líneas

**Source of truth:** el objeto SEED en [admin/assets/js/admin-data.js:8-77](../../../admin/assets/js/admin-data.js#L8). Lo migramos verbatim a la DB, ajustando solo las referencias de imagen/PDF para que apunten a paths del bucket en lugar de paths del filesystem (`../brand_assets/...` → `encintado-de-lineas/hero.png`).

**Archivos a subir a Storage:**

| Archivo local | Destino en Storage |
|---|---|
| `brand_assets/site_pictures/encintado_linea.png` | `service-assets/encintado-de-lineas/hero.png` |
| `deliverables/fichas-tecnicas/IridiumWrap - TDS (Spanish).pdf` | `service-assets/encintado-de-lineas/ficha-tecnica.pdf` |

**Row a insertar:**

```sql
INSERT INTO servicios (slug, titulo, categoria, eyebrow, lead, estado, hero, solucion, consideraciones, geometrias, certificacion, galeria, cta)
VALUES (
  'encintado-de-lineas',
  'Encintado de Líneas',
  'servicios-especializados',
  'Servicio Especializado · Operación',
  'Sistema de matriz compuesta basado en fibra de carbono que rehabilita y restablece la capacidad MAOP original de tubos y tuberías con daños, corrosión o erosión — sin necesidad de detener el flujo.',
  'publicado',
  '{
    "imagen": "encintado-de-lineas/hero.png",
    "productCallout": {
      "textoSuperior": "Tecnología aplicada",
      "nombreProducto": "Iridium Wrap",
      "textoInferior": "AKKAIM INTEGRITY",
      "imagen": ""
    }
  }'::jsonb,
  -- ... (resto del shape verbatim del SEED, con metricaClave, beneficios, etc.)
  '{...solucion...}'::jsonb,
  '{...consideraciones...}'::jsonb,
  '{...geometrias...}'::jsonb,
  '{
    "badges": [{"nombre":"API"},{"nombre":"ASME"},{"nombre":"ISO"}],
    "normas": [
      {"texto":"ASME PCC-2 Art. 4.1"},
      {"texto":"ISO 24817 Clase 1, 2 y 3"},
      {"texto":"API 570"},
      {"texto":"API 1160"}
    ],
    "fichaTecnicaPdf": {
      "nombre": "IridiumWrap - TDS (Spanish).pdf",
      "path": "encintado-de-lineas/ficha-tecnica.pdf"
    },
    "certificadosPdf": null
  }'::jsonb,
  '[]'::jsonb,
  '{
    "headline": "¿Tu activo necesita esta solución?",
    "botonTexto": "Agenda una reunión"
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
```

El INSERT completo va en el script de seed con el JSON expandido entero (los placeholders `{...solucion...}`, `{...consideraciones...}`, `{...geometrias...}` arriba son atajos visuales del spec — en la migration real cada uno se expande con el contenido literal del SEED de `admin-data.js`). `ON CONFLICT (slug) DO NOTHING` hace el INSERT idempotente: correrlo dos veces no duplica ni sobrescribe.

## Ejecución

Dos artefactos:

1. **Migration SQL** (vía `mcp__supabase__apply_migration` o vía Supabase CLI): crea tabla, trigger, index, bucket, todas las policies. Pura DDL. Idempotencia se logra con `CREATE TABLE IF NOT EXISTS` para la tabla, `CREATE INDEX IF NOT EXISTS` para el index, `CREATE OR REPLACE FUNCTION` para la función del trigger, y `DROP TRIGGER/POLICY IF EXISTS ... ;` antes de cada `CREATE TRIGGER`/`CREATE POLICY` (Postgres no soporta `IF NOT EXISTS` en `CREATE POLICY` ni `CREATE TRIGGER` de forma confiable cross-version). El plan de implementación detalla la estructura exacta.

2. **Script Node `scripts/seed-encintado.mjs`** (corre una sola vez con `service_role` key local en env var, no commiteada): sube los 2 archivos al bucket usando el SDK de Supabase y ejecuta el INSERT del row. Logs claros. Idempotente: si los archivos ya existen, los reemplaza (upsert); si el row ya existe, no-op.

El plan de implementación (próximo) detalla los pasos concretos.

## Verificación end-to-end

Una vez aplicado:

1. **Schema existe**: en Supabase Dashboard → Database → Tables → ver `servicios` con todas las columnas.
2. **Bucket existe**: Storage → ver `service-assets` listado, marcado como public.
3. **Seed cargado**:
   ```sql
   SELECT slug, titulo, estado FROM servicios;
   -- Debe devolver: encintado-de-lineas | Encintado de Líneas | publicado
   ```
4. **Archivos subidos**: Storage → `service-assets/encintado-de-lineas/` → ver `hero.png` y `ficha-tecnica.pdf`.
5. **Public read funciona** (con la anon key, sin autenticar):
   ```js
   const { data, error } = await supabase
     .from('servicios')
     .select('slug, titulo')
     .eq('estado', 'publicado');
   // data.length === 1, data[0].slug === 'encintado-de-lineas'
   ```
6. **Public read NO ve borradores**: insertar manualmente un row con `estado='borrador'`, repetir el query anónimo, confirmar que no aparece.
7. **Authenticated write funciona**: loguear como `davalos@erres.cl`, hacer un UPDATE simple sobre el seed, ver que `fecha_edicion` se actualizó.
8. **Storage public URL funciona**: abrir `https://fpewrusowllrycpshxaq.supabase.co/storage/v1/object/public/service-assets/encintado-de-lineas/hero.png` en el navegador → muestra la imagen.

Si los 8 pasos pasan, el sub-proyecto #1 está cerrado y queda listo para el sub-proyecto #2 (Auth UI).
