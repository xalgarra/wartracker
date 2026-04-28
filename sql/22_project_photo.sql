-- Foto de portada para proyectos
-- 1. Ejecutar en Supabase SQL Editor
-- 2. Crear bucket "project-photos" en Supabase Storage (público)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at timestamptz;
