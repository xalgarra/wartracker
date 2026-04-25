-- Añade campo opcional para registrar cuántos modelos individuales
-- hay en la entrada (ej: 1 caja de Pink Horrors = 10 modelos)
ALTER TABLE minis ADD COLUMN IF NOT EXISTS models int;
