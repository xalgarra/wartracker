-- =============================================================
-- DAEMONS CROSS-GAME FALTANTES: Thousand Sons (40K)
-- Solo añadir lo que no está ya en 03_units_catalog.sql ni en 05.
--
-- Ya cubiertos en 03: Tzaangor Shaman, Tzaangors
-- Ya cubiertos en 05: Pink Horrors, Blue Horrors, Flamers,
--                     Exalted Flamer, Screamers, Tzaangor Enlightened
--
-- NOT in TS army list (son solo DoT/AoS): The Changeling,
--   The Blue Scribes, Changecaster, Fluxmaster, Fateskimmer,
--   Burning Chariot, Tzaangor Skyfires
-- =============================================================

INSERT INTO units (name, faction, game_slug) VALUES
  ('Kairos Fateweaver', 'Thousand Sons', '40k'),
  ('Lord of Change',    'Thousand Sons', '40k');
