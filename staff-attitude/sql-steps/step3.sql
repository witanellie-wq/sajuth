-- ▼▼▼ 3/6 · 기타 이체 계좌 — 여기부터 전부 복사 ▼▼▼

create table if not exists public.staff_payees (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null default '기타',
  biz          text not null default '하나하얀',
  bank_name    text default '',
  bank_account text default '',
  bank_holder  text default '',
  memo         text default '',
  active       boolean not null default true,
  sort_order   integer not null default 0,
  legacy_id    text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists staff_payees_biz_idx on public.staff_payees(biz, sort_order);
drop trigger if exists staff_payees_touch on public.staff_payees;
create trigger staff_payees_touch before update on public.staff_payees
  for each row execute function staff_touch_updated_at();
alter table public.staff_payees enable row level security;
drop policy if exists staff_payees_rw on public.staff_payees;
create policy staff_payees_rw on public.staff_payees
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
grant select, insert, update, delete on public.staff_payees to authenticated;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_payees'
  ) then
    alter publication supabase_realtime add table public.staff_payees;
  end if;
end $$;
alter table public.staff_payees replica identity full;

select '3/6 기타 이체 계좌 — 완료' as "결과";
-- ▲▲▲ 3/6 끝 · 이 줄까지 보여야 합니다 ▲▲▲
