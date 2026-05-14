create table public.user_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  google_cse_key text,
  google_cse_cx  text,
  updated_at    timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
