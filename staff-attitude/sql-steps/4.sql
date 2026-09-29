create table if not exists public.staff_comm_config (
  id            integer primary key default 1 check (id = 1),
  rate          numeric(6,3) not null default 3,
  gowabi_basis  text         not null default 'net',
  min_amount    numeric(12,2) not null default 0,
  updated_at    timestamptz  not null default now()
);
insert into public.staff_comm_config (id) values (1) on conflict (id) do nothing;
create table if not exists public.staff_name_map (
  booking_name text primary key,
  staff_id     uuid references public.staff_members(id) on delete cascade,
  updated_at   timestamptz not null default now()
);
create index if not exists staff_name_map_staff_idx on public.staff_name_map(staff_id);
create table if not exists public.staff_comm_split (
  booking_id   bigint not null,
  booking_name text   not null,
  share        numeric(7,4) not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (booking_id, booking_name)
);
create index if not exists staff_comm_split_bk_idx on public.staff_comm_split(booking_id);
create table if not exists public.staff_comm_override (
  booking_id bigint primary key,
  amount     numeric(12,2),
  memo       text default '',
  updated_at timestamptz not null default now()
);
drop trigger if exists staff_comm_config_touch on public.staff_comm_config;
create trigger staff_comm_config_touch before update on public.staff_comm_config
  for each row execute function staff_touch_updated_at();
drop trigger if exists staff_name_map_touch on public.staff_name_map;
create trigger staff_name_map_touch before update on public.staff_name_map
  for each row execute function staff_touch_updated_at();
drop trigger if exists staff_comm_split_touch on public.staff_comm_split;
create trigger staff_comm_split_touch before update on public.staff_comm_split
  for each row execute function staff_touch_updated_at();
drop trigger if exists staff_comm_override_touch on public.staff_comm_override;
create trigger staff_comm_override_touch before update on public.staff_comm_override
  for each row execute function staff_touch_updated_at();
alter table public.staff_comm_config   enable row level security;
alter table public.staff_name_map      enable row level security;
alter table public.staff_comm_split    enable row level security;
alter table public.staff_comm_override enable row level security;
drop policy if exists staff_comm_config_rw on public.staff_comm_config;
create policy staff_comm_config_rw on public.staff_comm_config
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists staff_name_map_rw on public.staff_name_map;
create policy staff_name_map_rw on public.staff_name_map
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists staff_comm_split_rw on public.staff_comm_split;
create policy staff_comm_split_rw on public.staff_comm_split
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists staff_comm_override_rw on public.staff_comm_override;
create policy staff_comm_override_rw on public.staff_comm_override
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
grant select, insert, update, delete on public.staff_comm_config   to authenticated;
grant select, insert, update, delete on public.staff_name_map      to authenticated;
grant select, insert, update, delete on public.staff_comm_split    to authenticated;
grant select, insert, update, delete on public.staff_comm_override to authenticated;
do $$
declare tb text;
begin
  foreach tb in array array['staff_comm_config','staff_name_map','staff_comm_split','staff_comm_override'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=tb
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tb);
    end if;
    execute format('alter table public.%I replica identity full', tb);
  end loop;
end $$;
select '4/6 완료 · 자동 커미션' as "결과";
