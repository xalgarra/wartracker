-- =============================================================
-- CORRECCIONES CATÁLOGO THOUSAND SONS (40K)
-- Basado en army list oficial (10ª edición)
-- =============================================================

-- ELIMINAR: no existen en el army list de TS
DELETE FROM units WHERE name = 'Ahriman on Disc of Tzeentch'           AND faction = 'Thousand Sons';
DELETE FROM units WHERE name = 'Exalted Flamer of Tzeentch'            AND faction = 'Thousand Sons';
DELETE FROM units WHERE name = 'Tzaangor Enlightened (a pie/en Disco de Tzeentch)' AND faction = 'Thousand Sons';

-- SEPARAR: Daemon Prince
DELETE FROM units WHERE name = 'Daemon Prince/Daemon Prince with Wings' AND faction = 'Thousand Sons';
INSERT INTO units (name, faction, game_slug) VALUES
  ('Daemon Prince of Tzeentch',            'Thousand Sons', '40k'),
  ('Daemon Prince of Tzeentch with Wings', 'Thousand Sons', '40k');

-- SEPARAR: Forgefiend / Maulerfiend
DELETE FROM units WHERE name = 'Forgefiend/Maulerfiend' AND faction = 'Thousand Sons';
INSERT INTO units (name, faction, game_slug) VALUES
  ('Forgefiend', 'Thousand Sons', '40k'),
  ('Maulerfiend', 'Thousand Sons', '40k');

-- SEPARAR: Chaos Predator
DELETE FROM units WHERE name = 'Chaos Predator Destructor/Annihilator' AND faction = 'Thousand Sons';
INSERT INTO units (name, faction, game_slug) VALUES
  ('Chaos Predator Annihilator', 'Thousand Sons', '40k'),
  ('Chaos Predator Destructor',  'Thousand Sons', '40k');

-- SEPARAR: Tzaangor Enlightened
INSERT INTO units (name, faction, game_slug) VALUES
  ('Tzaangor Enlightened',                          'Thousand Sons', '40k'),
  ('Tzaangor Enlightened with Fatecaster Greatbows','Thousand Sons', '40k');

-- AÑADIR: faltantes
INSERT INTO units (name, faction, game_slug) VALUES
  ('Sekhetar Robots', 'Thousand Sons', '40k');
