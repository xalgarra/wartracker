-- Añade columna pdf_url a recipes para adjuntar un PDF de referencia
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS pdf_url TEXT;
