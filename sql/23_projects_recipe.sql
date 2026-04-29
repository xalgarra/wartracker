-- Notas de proceso/receta de pintado en proyectos (campo separado de notes)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recipe text;
