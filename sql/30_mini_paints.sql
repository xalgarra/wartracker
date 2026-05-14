-- Pinturas que el usuario está usando actualmente en una mini.
-- Reemplaza el rol que tenía `project_paints` (la entidad project desaparece a nivel UX).
create table public.mini_paints (
  mini_id  bigint not null references public.minis(id) on delete cascade,
  paint_id bigint not null references public.paints(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (mini_id, paint_id)
);

alter table public.mini_paints enable row level security;

-- RLS: igual que minis — acceso total a usuarios autenticados (app de un solo usuario)
create policy "mini_paints all authenticated" on public.mini_paints
  for all to authenticated using (true) with check (true);

create index mini_paints_mini_idx  on public.mini_paints(mini_id);
create index mini_paints_paint_idx on public.mini_paints(paint_id);
