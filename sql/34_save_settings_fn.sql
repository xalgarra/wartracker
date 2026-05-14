create or replace function public.save_brave_api_key(p_key text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_settings (user_id, brave_api_key)
  values (auth.uid(), p_key)
  on conflict (user_id)
  do update set brave_api_key = p_key;
end;
$$;
