-- ═══════════════════════════════════════════════════════════════════════════
--  목표 매출 기록
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.staff_targets (
  id         uuid primary key default gen_random_uuid(),
  biz        text not null default '하나하얀',   -- 사업장
  month      text not null,                     -- 'YYYY-MM'
  amount     numeric(14,2) not null default 0,  -- 목표 매출 (฿)
  memo       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (biz, month)
);
create index if not exists staff_targets_month_idx on public.staff_targets(month);

drop trigger if exists staff_targets_touch on public.staff_targets;
create trigger staff_targets_touch before update on public.staff_targets
  for each row execute function staff_touch_updated_at();

-- 매출 목표도 돈 정보이므로 관리자만
alter table public.staff_targets enable row level security;

drop policy if exists staff_targets_rw on public.staff_targets;
create policy staff_targets_rw on public.staff_targets
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on public.staff_targets to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_targets'
  ) then
    alter publication supabase_realtime add table public.staff_targets;
  end if;
end $$;

alter table public.staff_targets replica identity full;

-- ══ 확인 ══
select c.relname as "테이블",
       c.relrowsecurity as "RLS",
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as "정책",
       exists(select 1 from pg_publication_tables t
         where t.pubname='supabase_realtime' and t.tablename=c.relname) as "실시간"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='staff_targets';
