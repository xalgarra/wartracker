-- Recetas de pintura reutilizables, vinculables a proyectos
-- Ejecutar en Supabase SQL Editor
-- Después, crear bucket "recipe-photos" en Supabase → Storage → New bucket (público)

CREATE TABLE IF NOT EXISTS recipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their recipes" ON recipes
  FOR ALL USING (auth.uid() = user_id);

-- Fotos de referencia (pasos, resultados, potes, etc.)
CREATE TABLE IF NOT EXISTS recipe_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  url        text NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recipe_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their recipe_photos" ON recipe_photos
  FOR ALL USING (auth.uid() = user_id);

-- Pinturas usadas en la receta
CREATE TABLE IF NOT EXISTS recipe_paints (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  paint_id   bigint NOT NULL REFERENCES paints(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(recipe_id, paint_id)
);
ALTER TABLE recipe_paints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their recipe_paints" ON recipe_paints
  FOR ALL USING (auth.uid() = user_id);

-- Vinculación proyecto → receta (opcional, un proyecto puede referenciar una receta)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS recipe_photos_recipe_id_idx ON recipe_photos(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_paints_recipe_id_idx ON recipe_paints(recipe_id);
CREATE INDEX IF NOT EXISTS projects_recipe_id_idx      ON projects(recipe_id);

-- Storage policies para recipe-photos (bucket publico)
CREATE POLICY "Public read recipe-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-photos');

CREATE POLICY "Authenticated upload recipe-photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recipe-photos');

CREATE POLICY "Authenticated update recipe-photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'recipe-photos');

CREATE POLICY "Authenticated delete recipe-photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'recipe-photos');
