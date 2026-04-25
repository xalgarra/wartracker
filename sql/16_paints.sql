-- =============================================================
-- INVENTARIO DE PINTURAS
-- =============================================================

CREATE TABLE IF NOT EXISTS paints (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users not null default auth.uid(),
  brand      text not null,
  name       text not null,
  type       text not null,
  color_hex  text,
  in_stock   boolean not null default true,
  created_at timestamptz default now()
);

ALTER TABLE paints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own paints" ON paints
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
