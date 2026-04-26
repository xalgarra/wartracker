-- Army lists: permite crear listas de ejército con minis de la colección
-- Ejecutar en Supabase SQL Editor

-- Tabla principal de listas
CREATE TABLE IF NOT EXISTS army_lists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  game        text NOT NULL,
  faction     text NOT NULL DEFAULT '',
  target_points int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Tabla de unidades en lista (1 entrada = 1 mini de la colección)
CREATE TABLE IF NOT EXISTS army_list_units (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id     uuid NOT NULL REFERENCES army_lists(id) ON DELETE CASCADE,
  mini_id     bigint NOT NULL REFERENCES minis(id) ON DELETE CASCADE,
  qty         int NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS army_lists
ALTER TABLE army_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their lists" ON army_lists
  FOR ALL USING (auth.uid() = user_id);

-- RLS army_list_units
ALTER TABLE army_list_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their list units" ON army_list_units
  FOR ALL USING (auth.uid() = user_id);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS army_list_units_list_id_idx ON army_list_units(list_id);
CREATE INDEX IF NOT EXISTS army_list_units_mini_id_idx ON army_list_units(mini_id);
CREATE INDEX IF NOT EXISTS army_lists_user_id_idx ON army_lists(user_id);
