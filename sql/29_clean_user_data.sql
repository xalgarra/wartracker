-- Limpieza completa de datos de usuario (mantiene catálogo units)
-- Ejecutar en Supabase SQL Editor

-- Tablas hijas primero (FK constraints)
TRUNCATE TABLE hobby_session_minis CASCADE;
TRUNCATE TABLE hobby_sessions CASCADE;
TRUNCATE TABLE recipe_steps CASCADE;
TRUNCATE TABLE recipe_photos CASCADE;
TRUNCATE TABLE recipe_paints CASCADE;
TRUNCATE TABLE recipes CASCADE;
TRUNCATE TABLE army_list_units CASCADE;
TRUNCATE TABLE army_lists CASCADE;
TRUNCATE TABLE project_minis CASCADE;
TRUNCATE TABLE project_paints CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE minis CASCADE;
TRUNCATE TABLE paints CASCADE;

-- Verificar que quedan vacías
SELECT 'minis' as tabla, count(*) FROM minis
UNION ALL SELECT 'paints', count(*) FROM paints
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'recipes', count(*) FROM recipes
UNION ALL SELECT 'army_lists', count(*) FROM army_lists
UNION ALL SELECT 'hobby_sessions', count(*) FROM hobby_sessions
UNION ALL SELECT 'units (catálogo, intacto)', count(*) FROM units;
