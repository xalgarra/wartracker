-- =============================================================
-- IDONETH DEEPKIN — correcciones según Battle Profiles Abril 2026
-- =============================================================

-- -------------------------------------------------------------
-- 1. ELIMINAR entradas fusionadas incorrectamente
-- -------------------------------------------------------------
DELETE FROM units WHERE name = 'Eidolon of Mathlann (Aspect of the Sea/Aspect of the Storm)' AND faction = 'Idoneth Deepkin';
DELETE FROM units WHERE name = 'Akhelian Guard (Morrsarr/Ishlaen)'                           AND faction = 'Idoneth Deepkin';
DELETE FROM units WHERE name = 'Ikon of the Sea/Ikon of the Storm'                            AND faction = 'Idoneth Deepkin';

-- Gloomtide Shipwreck es Faction Terrain — se mantiene con tipo 'faction terrain' y 0 pts
UPDATE units SET type = 'faction terrain', points = 0 WHERE name = 'Gloomtide Shipwreck' AND faction = 'Idoneth Deepkin';


-- -------------------------------------------------------------
-- 2. INSERTAR entradas separadas con puntos y tipo
-- -------------------------------------------------------------
INSERT INTO units (name, faction, game_slug, points, type) VALUES
  ('Eidolon of Mathlann, Aspect of the Sea',  'Idoneth Deepkin', 'aos', 340, 'personaje'),
  ('Eidolon of Mathlann, Aspect of the Storm','Idoneth Deepkin', 'aos', 280, 'personaje'),
  ('Akhelian Morrsarr Guard',                  'Idoneth Deepkin', 'aos', 160, 'caballería'),
  ('Akhelian Ishlaen Guard',                   'Idoneth Deepkin', 'aos', 170, 'caballería'),
  ('Ikon of the Sea',                          'Idoneth Deepkin', 'aos', 120, 'personaje'),
  ('Ikon of the Storm',                        'Idoneth Deepkin', 'aos', 130, 'personaje');


-- -------------------------------------------------------------
-- 3. ACTUALIZAR puntos de entradas existentes
-- -------------------------------------------------------------
UPDATE units SET points = 140  WHERE name = 'Akhelian King'                   AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 90   WHERE name = 'Akhelian Thrallmaster'            AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 100  WHERE name = 'Isharann Soulscryer'              AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 90   WHERE name = 'Isharann Soulrender'              AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 100  WHERE name = 'Isharann Tidecaster'              AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 100  WHERE name = 'Lotann, Warden of the Soul Ledgers' AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 150  WHERE name = 'Mathaela, Oracle of the Abyss'   AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 210  WHERE name = 'Volturnos, High King of the Deep' AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 170  WHERE name = 'Akhelian Allopex'                 AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 450  WHERE name = 'Akhelian Leviadon'                AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 120  WHERE name = 'Namarti Reavers'                  AND faction = 'Idoneth Deepkin';
UPDATE units SET points = 90   WHERE name = 'Namarti Thralls'                  AND faction = 'Idoneth Deepkin';


-- -------------------------------------------------------------
-- 4. ACTUALIZAR tipos de unidades existentes
-- -------------------------------------------------------------
UPDATE units SET type = 'único'      WHERE faction = 'Idoneth Deepkin' AND name IN (
  'Volturnos, High King of the Deep',
  'Lotann, Warden of the Soul Ledgers',
  'Mathaela, Oracle of the Abyss'
);
UPDATE units SET type = 'personaje'  WHERE faction = 'Idoneth Deepkin' AND name IN (
  'Akhelian King', 'Akhelian Thrallmaster',
  'Isharann Soulscryer', 'Isharann Soulrender', 'Isharann Tidecaster'
);
UPDATE units SET type = 'infantería' WHERE faction = 'Idoneth Deepkin' AND name IN (
  'Namarti Thralls', 'Namarti Reavers'
);
UPDATE units SET type = 'caballería' WHERE faction = 'Idoneth Deepkin' AND name = 'Akhelian Allopex';
UPDATE units SET type = 'monstruo'   WHERE faction = 'Idoneth Deepkin' AND name = 'Akhelian Leviadon';
