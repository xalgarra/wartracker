-- =============================================================
-- CORRECCIONES DEL CATÁLOGO DE UNIDADES
-- Basado en revisión contra Wahapedia / GW (abril 2026)
-- =============================================================


-- =============================================================
-- IDONETH DEEPKIN (AoS)
-- =============================================================

-- Nombre incorrecto
UPDATE units SET name = 'Akhelian Thrallmaster'
  WHERE name = 'Namarti Thrallmaster' AND faction = 'Idoneth Deepkin';

-- Unidades faltantes
INSERT INTO units (name, faction, game_slug) VALUES
  ('Mathaela, Oracle of the Abyss', 'Idoneth Deepkin', 'aos'),
  ('Ikon of the Sea/Ikon of the Storm', 'Idoneth Deepkin', 'aos');


-- =============================================================
-- DISCIPLES OF TZEENTCH (AoS)
-- =============================================================

-- Blue Horrors y Brimstone Horrors son el mismo kit → fusionar
UPDATE units SET name = 'Blue Horrors/Brimstone Horrors of Tzeentch'
  WHERE name = 'Blue Horrors of Tzeentch' AND faction = 'Disciples of Tzeentch';

DELETE FROM units
  WHERE name = 'Brimstone Horrors of Tzeentch' AND faction = 'Disciples of Tzeentch';

-- Unidades faltantes
INSERT INTO units (name, faction, game_slug) VALUES
  ('Curseling, Eye of Tzeentch',        'Disciples of Tzeentch', 'aos'),
  ('Gaunt Summoner on Disc of Tzeentch','Disciples of Tzeentch', 'aos'),
  ('Magister on Disc of Tzeentch',      'Disciples of Tzeentch', 'aos');


-- =============================================================
-- THOUSAND SONS (40K)
-- =============================================================

-- Unidades faltantes
INSERT INTO units (name, faction, game_slug) VALUES
  ('Sorcerer',                          'Thousand Sons', '40k'),
  ('Sorcerer in Terminator Armour',     'Thousand Sons', '40k'),
  ('Exalted Sorcerer on Disc of Tzeentch', 'Thousand Sons', '40k'),
  ('Heldrake',                          'Thousand Sons', '40k'),
  ('Chaos Land Raider',                 'Thousand Sons', '40k'),
  ('Chaos Vindicator',                  'Thousand Sons', '40k'),
  ('Chaos Spawn',                       'Thousand Sons', '40k');

-- Unidades cross-game: mismos nombres que en Disciples of Tzeentch (AoS)
-- para que el selector multi-facción muestre el checkbox correctamente
INSERT INTO units (name, faction, game_slug) VALUES
  ('Pink Horrors of Tzeentch',                        'Thousand Sons', '40k'),
  ('Blue Horrors/Brimstone Horrors of Tzeentch',      'Thousand Sons', '40k'),
  ('Flamers of Tzeentch',                             'Thousand Sons', '40k'),
  ('Exalted Flamer of Tzeentch',                      'Thousand Sons', '40k'),
  ('Screamers of Tzeentch',                           'Thousand Sons', '40k'),
  ('Tzaangor Enlightened (a pie/en Disco de Tzeentch)','Thousand Sons', '40k');


-- =============================================================
-- ADEPTUS CUSTODES (40K)
-- =============================================================

INSERT INTO units (name, faction, game_slug) VALUES
  ('Aleya',                  'Adeptus Custodes', '40k'),
  ('Valerian',               'Adeptus Custodes', '40k'),
  ('Knight-Centura',         'Adeptus Custodes', '40k'),
  ('Venerable Land Raider',  'Adeptus Custodes', '40k');


-- =============================================================
-- ADEPTA SORORITAS (40K)
-- =============================================================

-- Seraphim y Zephyrim son kits SEPARADOS, no una sola caja con dos opciones
UPDATE units SET name = 'Seraphim Squad'
  WHERE name = 'Seraphim Squad/Zephyrim Squad' AND faction = 'Adepta Sororitas';

INSERT INTO units (name, faction, game_slug) VALUES
  ('Zephyrim Squad', 'Adepta Sororitas', '40k');

-- Celestian Squad está descontinuado
DELETE FROM units
  WHERE name = 'Celestian Squad' AND faction = 'Adepta Sororitas';

-- Unidades faltantes
INSERT INTO units (name, faction, game_slug) VALUES
  ('Canoness with Jump Pack',    'Adepta Sororitas', '40k'),
  ('Ministorum Priest',          'Adepta Sororitas', '40k'),
  ('Sisters Novitiate Squad',    'Adepta Sororitas', '40k'),
  ('Sanctifiers',                'Adepta Sororitas', '40k'),
  ('Celestian Insidiants',       'Adepta Sororitas', '40k'),
  ('Intranzia Fraye',            'Adepta Sororitas', '40k');
