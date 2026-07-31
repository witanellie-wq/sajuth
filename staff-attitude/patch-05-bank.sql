-- ═══════════════════════════════════════════════════════════════════════════
--  직원 급여 계좌 (은행 · 계좌번호 · 예금주)
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_members
  add column if not exists bank_name    text default '',   -- 은행 (SCB / Kasikorn …)
  add column if not exists bank_account text default '',   -- 계좌번호
  add column if not exists bank_holder  text default '';   -- 예금주 (직원 이름과 다를 때만)

-- ══ 확인 ══
select column_name as "컬럼", data_type as "타입"
from information_schema.columns
where table_schema='public' and table_name='staff_members'
  and column_name in ('bank_name','bank_account','bank_holder')
order by 1;
