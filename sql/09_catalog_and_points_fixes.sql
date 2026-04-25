-- =============================================================
-- CORRECCIONES GENERALES DE CATÁLOGO Y PUNTOS
-- =============================================================


-- =============================================================
-- DISCIPLES OF TZEENTCH (AoS) — unidades faltantes
-- =============================================================
INSERT INTO units (name, faction, game_slug, points) VALUES
  ('Chaos Spawn of Tzeentch', 'Disciples of Tzeentch', 'aos', 60),
  ('Jade Obelisk',            'Disciples of Tzeentch', 'aos', 100);


-- =============================================================
-- ADEPTA SORORITAS (40K) — unidades faltantes
-- =============================================================
INSERT INTO units (name, faction, game_slug, points) VALUES
  ('Daemonifuge', 'Adepta Sororitas', '40k', 85);


-- =============================================================
-- THOUSAND SONS — puntos de entradas nuevas (08 + 07)
-- =============================================================

-- Sekhetar Robots: el UPDATE del 06 fue no-op (la entrada no existía aún)
UPDATE units SET points = 80
  WHERE name = 'Sekhetar Robots' AND faction = 'Thousand Sons';

-- Daemon Prince
UPDATE units SET points = 180
  WHERE name = 'Daemon Prince of Tzeentch' AND faction = 'Thousand Sons';
UPDATE units SET points = 170
  WHERE name = 'Daemon Prince of Tzeentch with Wings' AND faction = 'Thousand Sons';

-- Forgefiend / Maulerfiend
UPDATE units SET points = 130
  WHERE name = 'Forgefiend' AND faction = 'Thousand Sons';
UPDATE units SET points = 120
  WHERE name = 'Maulerfiend' AND faction = 'Thousand Sons';

-- Chaos Predator
UPDATE units SET points = 130
  WHERE name = 'Chaos Predator Annihilator' AND faction = 'Thousand Sons';
UPDATE units SET points = 130
  WHERE name = 'Chaos Predator Destructor'  AND faction = 'Thousand Sons';

-- Tzaangor Enlightened
UPDATE units SET points = 45
  WHERE name = 'Tzaangor Enlightened' AND faction = 'Thousand Sons';
UPDATE units SET points = 55
  WHERE name = 'Tzaangor Enlightened with Fatecaster Greatbows' AND faction = 'Thousand Sons';

-- Kairos y Lord of Change en 40K (MFM v4.2)
UPDATE units SET points = 295
  WHERE name = 'Kairos Fateweaver' AND faction = 'Thousand Sons' AND game_slug = '40k';
UPDATE units SET points = 285
  WHERE name = 'Lord of Change'    AND faction = 'Thousand Sons' AND game_slug = '40k';
