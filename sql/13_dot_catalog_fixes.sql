-- =============================================================
-- DISCIPLES OF TZEENTCH — correcciones según Battle Profiles Abril 2026
-- =============================================================

-- -------------------------------------------------------------
-- 1. ELIMINAR entrada combinada de Tzaangor Enlightened
-- -------------------------------------------------------------
DELETE FROM units WHERE name = 'Tzaangor Enlightened (a pie/en Disco de Tzeentch)' AND faction = 'Disciples of Tzeentch';


-- -------------------------------------------------------------
-- 2. INSERTAR entradas separadas
-- -------------------------------------------------------------
INSERT INTO units (name, faction, game_slug, points, type) VALUES
  ('Tzaangor Enlightened',         'Disciples of Tzeentch', 'aos', 200, 'caballería'),  -- en Discos (activo)
  ('Tzaangor Enlightened on Foot', 'Disciples of Tzeentch', 'aos', 110, 'infantería'),  -- a pie (pasa a Legends junio 2027)
  ('Argent Shard',                 'Disciples of Tzeentch', 'aos',   0, 'faction terrain');


-- -------------------------------------------------------------
-- 3. CORREGIR tipos de unidades existentes
-- -------------------------------------------------------------

-- Jade Obelisk es una unidad de infantería (9 modelos, 100 pts) — no terrain
UPDATE units SET type = 'infantería' WHERE name = 'Jade Obelisk'                AND faction = 'Disciples of Tzeentch';

-- Screamers tienen keyword Beast → monstruo
UPDATE units SET type = 'monstruo'   WHERE name = 'Screamers of Tzeentch'      AND faction = 'Disciples of Tzeentch';

-- Tzaangor Skyfires van en Discos de Tzeentch → Cavalry
UPDATE units SET type = 'caballería' WHERE name = 'Tzaangor Skyfires'          AND faction = 'Disciples of Tzeentch';

-- Curseling → Hero genérico (no tiene keyword Unique en el PDF)
UPDATE units SET type = 'personaje'  WHERE name = 'Curseling, Eye of Tzeentch' AND faction = 'Disciples of Tzeentch';
