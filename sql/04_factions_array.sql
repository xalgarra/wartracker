-- Migración: faction text → factions text[]
-- La tabla minis está vacía así que no hay datos que migrar

ALTER TABLE minis DROP COLUMN faction;
ALTER TABLE minis ADD COLUMN factions text[] NOT NULL DEFAULT '{}';
