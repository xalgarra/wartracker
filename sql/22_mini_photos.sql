-- Tabla de fotos adicionales por mini (fotos de proceso: sin montar, en proceso, terminada…)
-- La foto principal sigue en minis.photo_url; estas son fotos de galería/proceso.

CREATE TABLE IF NOT EXISTS mini_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_id    bigint NOT NULL REFERENCES minis(id) ON DELETE CASCADE,
  url        text NOT NULL,
  label      text NOT NULL DEFAULT 'Sin montar',
  position   integer NOT NULL DEFAULT 0,
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mini_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mini_photos"
  ON mini_photos
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS mini_photos_mini_id_idx ON mini_photos(mini_id);
