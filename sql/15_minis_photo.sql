-- =============================================================
-- FOTOS DE MINIS — añade columna photo_url a minis
-- =============================================================

ALTER TABLE minis ADD COLUMN IF NOT EXISTS photo_url text;

-- =============================================================
-- STORAGE: crear bucket mini-photos
-- Hazlo manualmente en Supabase Dashboard → Storage → New bucket
--   Name: mini-photos
--   Public bucket: SÍ (para poder mostrar las fotos sin auth)
-- Luego ejecuta estas políticas:
-- =============================================================

CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mini-photos');

CREATE POLICY "Authenticated update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'mini-photos');

CREATE POLICY "Authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'mini-photos');

CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'mini-photos');
