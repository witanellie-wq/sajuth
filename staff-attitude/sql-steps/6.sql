alter table public.staff_comm_config
  add column if not exists start_date date;
create table if not exists public.staff_comm_skip (
  day        date primary key,
  memo       text default '',
  updated_at timestamptz not null default now()
);
drop trigger if exists staff_comm_skip_touch on public.staff_comm_skip;
create trigger staff_comm_skip_touch before update on public.staff_comm_skip
  for each row execute function staff_touch_updated_at();
alter table public.staff_comm_skip enable row level security;
drop policy if exists staff_comm_skip_rw on public.staff_comm_skip;
create policy staff_comm_skip_rw on public.staff_comm_skip
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
grant select, insert, update, delete on public.staff_comm_skip to authenticated;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_comm_skip'
  ) then
    alter publication supabase_realtime add table public.staff_comm_skip;
  end if;
end $$;
alter table public.staff_comm_skip replica identity full;
select '6/6 완료 · 커미션 시작일' as "결과";
