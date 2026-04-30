-- Pasos estructurados para recetas de pintura
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS recipe_steps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id   uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position    integer NOT NULL DEFAULT 0,
  technique   text,
  instruction text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their recipe_steps" ON recipe_steps
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS recipe_steps_recipe_id_idx ON recipe_steps(recipe_id);
