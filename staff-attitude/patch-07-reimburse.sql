-- ═══════════════════════════════════════════════════════════════════════════
--  사비 결제 · 정산 (임원이 회사 비용을 개인 돈으로 낸 건)
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  생각하는 방식:
--    · 누가 냈든 그건 '회사 지출' 이므로 총지출에는 그대로 들어갑니다.
--    · 사비로 낸 건은 별도로 '회사가 그 사람에게 갚아야 할 돈' 이 됩니다.
--      → paid_by 가 '회사' 가 아니고 reimbursed_at 이 비어 있으면 미정산.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_expenses
  add column if not exists paid_by       text not null default '회사',  -- 결제자
  add column if not exists reimbursed_at date;                          -- 정산(변제)일, 비어있으면 미정산

create index if not exists staff_expenses_payer_idx
  on public.staff_expenses(paid_by, reimbursed_at);

-- 고정비도 사비로 낼 수 있으므로 같이 붙여 둡니다
alter table public.staff_fixed_payments
  add column if not exists paid_by       text not null default '회사',
  add column if not exists reimbursed_at date;

-- ══ 확인 ══
select table_name as "테이블", column_name as "컬럼", column_default as "기본값"
from information_schema.columns
where table_schema='public'
  and table_name in ('staff_expenses','staff_fixed_payments')
  and column_name in ('paid_by','reimbursed_at')
order by 1, 2;
