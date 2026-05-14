alter table public.user_settings enable row level security;

drop policy if exists "user_settings all" on public.user_settings;
create policy "user_settings all"
  on public.user_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
