-- ═══════════════════════════════════════════════════════════════════════════
--  입금(수입) 기록 — 지출 탭 맨 아래 '입금 기록'
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다. 기존 표(지출 등)는 건드리지 않습니다.
--
--  왜 필요한가:
--    현금 입금(이인규) · 고와비 정산금 · 지출 환급 같은 '들어온 돈' 을
--    지출과 섞지 않고 따로 적어 두고, 달마다 합계를 보기 위해서입니다.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.staff_income (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  kind       text not null default '기타 입금',   -- 현금 입금(이인규) / 고와비 정산금 / 지출 환급 / 기타 입금
  biz        text not null default '하나하얀',    -- 하나하얀 / 위튼
  amount     numeric(12,2) not null default 0,
  memo       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_income_date_idx on public.staff_income(date);

drop trigger if exists staff_income_touch on public.staff_income;
create trigger staff_income_touch before update on public.staff_income
  for each row execute function staff_touch_updated_at();

alter table public.staff_income enable row level security;

drop policy if exists staff_income_rw on public.staff_income;
create policy staff_income_rw on public.staff_income
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on public.staff_income to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_income'
  ) then
    alter publication supabase_realtime add table public.staff_income;
  end if;
end $$;

alter table public.staff_income replica identity full;

select '완료 — 입금(수입) 기록' as "결과";
