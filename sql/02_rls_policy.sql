ALTER TABLE minis ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo usuarios autenticados" ON minis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lectura autenticados" ON games
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lectura autenticados" ON factions
  FOR SELECT TO authenticated USING (true);