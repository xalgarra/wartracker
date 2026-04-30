-- Diario de sesiones de hobby + campos wishlist para pareja
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS hobby_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date NOT NULL DEFAULT current_date,
  duration_min integer,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hobby_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their hobby_sessions" ON hobby_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS hobby_session_minis (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES hobby_sessions(id) ON DELETE CASCADE,
  mini_id    bigint NOT NULL REFERENCES minis(id) ON DELETE CASCADE,
  UNIQUE(session_id, mini_id)
);
ALTER TABLE hobby_session_minis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their hobby_session_minis" ON hobby_session_minis
  FOR ALL USING (auth.uid() = user_id);

-- Campos para wishlist colaborativa con pareja
ALTER TABLE minis ADD COLUMN IF NOT EXISTS wishlist_priority integer NOT NULL DEFAULT 0;
ALTER TABLE minis ADD COLUMN IF NOT EXISTS partner_bought boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS hobby_sessions_user_date_idx     ON hobby_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS hobby_session_minis_session_idx  ON hobby_session_minis(session_id);
