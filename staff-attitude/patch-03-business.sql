-- ═══════════════════════════════════════════════════════════════════════════
--  지출을 사업장별(하나하얀 / 위탄 타일랜드)로 나누기
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════════════════════

-- 기존에 등록해 둔 항목은 전부 '하나하얀' 으로 들어갑니다.
-- 위탄 쪽 항목은 화면에서 사업장만 바꿔주면 됩니다.
alter table public.staff_fixed_costs
  add column if not exists biz text not null default '하나하얀';

alter table public.staff_expenses
  add column if not exists biz text not null default '하나하얀';

create index if not exists staff_fixed_costs_biz_idx on public.staff_fixed_costs(biz);
create index if not exists staff_expenses_biz_idx     on public.staff_expenses(biz);

-- ══ 확인 ══
select table_name as "테이블", column_name as "컬럼", column_default as "기본값"
from information_schema.columns
where table_schema='public'
  and table_name in ('staff_fixed_costs','staff_expenses')
  and column_name='biz'
order by 1;
