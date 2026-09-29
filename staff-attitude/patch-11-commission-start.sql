-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 시작일 · 날짜별 제외
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    커미션을 중간부터 주기 시작한 달이 있습니다 (예: 9월은 19일부터).
--    그 전 날짜까지 3% 가 붙으면 안 되므로 '시작일' 을 둡니다.
--    시작일 뒤라도 특정 날만 빼야 할 때가 있어 '제외한 날' 도 따로 둡니다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_comm_config
  add column if not exists start_date date;     -- 이 날짜부터 커미션 계산 (비우면 전부)

-- 시작일 뒤인데도 커미션을 안 주는 날
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

-- ══ 확인 ══
select 'start_date' as "항목", coalesce(start_date::text,'(비어 있음 — 전부 계산)') as "값"
from public.staff_comm_config where id=1
union all
select '제외한 날', count(*)::text from public.staff_comm_skip;
