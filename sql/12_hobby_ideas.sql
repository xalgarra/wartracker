-- =====================================================================
-- 12_hobby_ideas.sql
--
-- Tabla `hobby_ideas` — cosas que el usuario quiere hacer "en algún
-- momento". Texto libre, categoría opcional, vínculo opcional con una
-- mini de la colección/wishlist. Orden manual.
--
-- Ejecutar manualmente en el SQL editor de Supabase.
-- =====================================================================

create table if not exists public.hobby_ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- Contenido
  text        text not null
              check (length(trim(text)) > 0 and length(text) <= 500),
  category    text
              check (category is null or category in
                ('tecnica','mini','compra','lista','otros')),

  -- Vínculo opcional a una mini (colección o wishlist; la mini ya
  -- distingue eso con su propio flag). Si la mini se borra, soltamos
  -- el vínculo en vez de borrar la idea.
  mini_id     bigint references public.minis(id) on delete set null,

  -- Orden manual dentro de la lista del usuario. Más bajo = más arriba.
  order_index integer not null default 0,

  -- Estado: 'open' (visible en la lista), 'promoted' (se convirtió en
  -- sesión/proyecto, se oculta por defecto), 'done' (archivada).
  status      text not null default 'open'
              check (status in ('open','promoted','done')),

  -- Si se promovió, guardamos a qué se promovió (para auditoría).
  promoted_to_session_id uuid references public.hobby_sessions(id) on delete set null,
  promoted_to_project_id uuid references public.projects(id) on delete set null,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Lista del usuario ordenada
create index if not exists hobby_ideas_user_order_idx
  on public.hobby_ideas (user_id, order_index)
  where status = 'open';

-- Lookup inverso por mini (para mostrar "ideas relacionadas" en el
-- detalle de la mini, opcional)
create index if not exists hobby_ideas_mini_idx
  on public.hobby_ideas (mini_id)
  where mini_id is not null;

-- ─── RLS ──────────────────────────────────────────────────────────
alter table public.hobby_ideas enable row level security;

drop policy if exists "ideas_select_own" on public.hobby_ideas;
create policy "ideas_select_own"
  on public.hobby_ideas for select
  using (auth.uid() = user_id);

drop policy if exists "ideas_insert_own" on public.hobby_ideas;
create policy "ideas_insert_own"
  on public.hobby_ideas for insert
  with check (auth.uid() = user_id);

drop policy if exists "ideas_update_own" on public.hobby_ideas;
create policy "ideas_update_own"
  on public.hobby_ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ideas_delete_own" on public.hobby_ideas;
create policy "ideas_delete_own"
  on public.hobby_ideas for delete
  using (auth.uid() = user_id);

-- ─── updated_at trigger ───────────────────────────────────────────
-- Reutiliza la función `set_updated_at` si ya existe (común en este
-- proyecto); si no, créala antes.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hobby_ideas_updated_at on public.hobby_ideas;
create trigger hobby_ideas_updated_at
  before update on public.hobby_ideas
  for each row execute function public.set_updated_at();
