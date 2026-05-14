-- Reemplaza columnas de Google CSE por Brave Search API key
alter table public.user_settings
  add column if not exists brave_api_key text;

-- Limpiar columnas de Google que ya no se usan
alter table public.user_settings
  drop column if exists google_cse_key,
  drop column if exists google_cse_cx;
