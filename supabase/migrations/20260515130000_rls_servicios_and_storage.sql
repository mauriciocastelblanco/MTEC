-- Enable RLS on servicios
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Public can read only published rows (anon role)
DROP POLICY IF EXISTS servicios_public_select ON servicios;
CREATE POLICY servicios_public_select
  ON servicios
  FOR SELECT
  TO anon
  USING (estado = 'publicado');

-- Authenticated users (admin) can do everything.
-- Single-admin model: any authenticated session = admin. RLS advisor
-- flags this as overly permissive; intentional for this project.
DROP POLICY IF EXISTS servicios_auth_all ON servicios;
CREATE POLICY servicios_auth_all
  ON servicios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storage: authenticated can insert/update/delete on servicios-media.
-- Public read works via the public CDN URL without a SELECT policy
-- (avoids broad listing of bucket contents by anon clients).
DROP POLICY IF EXISTS "servicios_media_auth_insert" ON storage.objects;
CREATE POLICY "servicios_media_auth_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'servicios-media');

DROP POLICY IF EXISTS "servicios_media_auth_update" ON storage.objects;
CREATE POLICY "servicios_media_auth_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'servicios-media')
  WITH CHECK (bucket_id = 'servicios-media');

DROP POLICY IF EXISTS "servicios_media_auth_delete" ON storage.objects;
CREATE POLICY "servicios_media_auth_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'servicios-media');
