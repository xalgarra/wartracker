-- Proyectos de pintura (reemplaza mini_paints)
-- Ejecutar en Supabase SQL Editor

DROP TABLE IF EXISTS mini_paints;

CREATE TABLE IF NOT EXISTS projects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name       text NOT NULL,
  notes      text,
  status     text NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'completado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Unidades incluidas en el proyecto (entradas completas de la colección)
CREATE TABLE IF NOT EXISTS project_minis (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mini_id    bigint NOT NULL REFERENCES minis(id) ON DELETE CASCADE,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, mini_id)
);

ALTER TABLE project_minis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their project minis" ON project_minis
  FOR ALL USING (auth.uid() = user_id);

-- Pinturas usadas en el proyecto (lista compartida para todas las unidades)
CREATE TABLE IF NOT EXISTS project_paints (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  paint_id   bigint NOT NULL REFERENCES paints(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, paint_id)
);

ALTER TABLE project_paints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their project paints" ON project_paints
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS project_minis_project_id_idx ON project_minis(project_id);
CREATE INDEX IF NOT EXISTS project_paints_project_id_idx ON project_paints(project_id);
