-- Progreso de pintura por mini y pinturas usadas
-- Ejecutar en Supabase SQL Editor

ALTER TABLE minis ADD COLUMN IF NOT EXISTS paint_progress integer NOT NULL DEFAULT 0
  CHECK (paint_progress >= 0 AND paint_progress <= 100);

CREATE TABLE IF NOT EXISTS mini_paints (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  mini_id    bigint NOT NULL REFERENCES minis(id) ON DELETE CASCADE,
  paint_id   bigint NOT NULL REFERENCES paints(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mini_id, paint_id)
);

ALTER TABLE mini_paints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their mini paints" ON mini_paints
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS mini_paints_mini_id_idx ON mini_paints(mini_id);
