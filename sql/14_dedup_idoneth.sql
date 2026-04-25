-- =============================================================
-- ELIMINAR DUPLICADOS — todas las facciones
-- Mantiene el registro con el id más bajo de cada (name, faction).
-- =============================================================

DELETE FROM units
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY name, faction ORDER BY id) AS rn
    FROM units
  ) t
  WHERE rn > 1
);
