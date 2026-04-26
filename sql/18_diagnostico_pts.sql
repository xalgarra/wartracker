-- =============================================================
-- DIAGNÓSTICO: qué minis no tienen pts en el catálogo
-- Ejecutar en Supabase SQL Editor (como SELECT, no modifica nada)
-- =============================================================


-- 1. Minis que no matchean con ninguna entrada del catálogo
--    (la app no puede asignarles pts ni juego)
SELECT
  m.name,
  m.factions,
  m.status,
  m.qty
FROM minis m
WHERE m.status != 'wishlist'
  AND NOT EXISTS (
    SELECT 1
    FROM units u
    WHERE u.name = m.name
      AND u.faction = ANY(m.factions)
      AND u.points IS NOT NULL
      AND u.points > 0
  )
ORDER BY m.name;


-- 2. Minis que SÍ matchean, pero la primera facción coincide con AoS
--    aunque el usuario las tiene principalmente como 40K
--    → son candidatas a estar inflando el total de AoS
SELECT
  m.name,
  m.factions,
  m.status,
  u.faction        AS faccion_matcheada,
  u.game_slug      AS juego_matcheado,
  u.points,
  u.points * m.qty AS pts_contabilizados
FROM minis m
JOIN LATERAL (
  -- replica la lógica de ptsFor(): primera facción con pts
  SELECT u2.faction, u2.game_slug, u2.points
  FROM   units u2
  WHERE  u2.name    = m.name
    AND  u2.faction = ANY(m.factions)
    AND  u2.points IS NOT NULL
    AND  u2.points > 0
  ORDER BY array_position(m.factions, u2.faction)
  LIMIT 1
) u ON true
WHERE m.status != 'wishlist'
ORDER BY u.game_slug, m.name;


-- 3. Resumen: pts totales y pintados por juego (tal como lo ve la app)
SELECT
  u.game_slug                                                          AS juego,
  SUM(u.points * m.qty)                                               AS total_pts,
  SUM(CASE WHEN m.status = 'pintada' THEN u.points * m.qty ELSE 0 END) AS pintados_pts,
  COUNT(*)                                                             AS num_minis
FROM minis m
JOIN LATERAL (
  SELECT u2.game_slug, u2.points
  FROM   units u2
  WHERE  u2.name    = m.name
    AND  u2.faction = ANY(m.factions)
    AND  u2.points IS NOT NULL
    AND  u2.points > 0
  ORDER BY array_position(m.factions, u2.faction)
  LIMIT 1
) u ON true
WHERE m.status != 'wishlist'
GROUP BY u.game_slug
ORDER BY total_pts DESC;
