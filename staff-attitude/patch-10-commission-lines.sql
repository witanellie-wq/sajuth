-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 — 판매금액에서 자동 계산 + 사진 붙여넣기 가져오기
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    지금까지 커미션은 '지급할 금액' 하나만 저장했습니다.
--    이제 '판매금액' 과 '비율' 도 같이 남겨서
--      · 3% 가 제대로 계산됐는지 나중에 확인할 수 있고
--      · 비율이 바뀌어도 판매금액에서 다시 계산할 수 있습니다.
--    (판매금액을 안 넣고 커미션액만 넣는 기존 방식도 그대로 됩니다)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_commissions
  add column if not exists sale_amount numeric(12,2),   -- 판매금액 (비우면 커미션액만 직접 넣은 것)
  add column if not exists rate        numeric(6,3),    -- 그 건에 적용한 % (비우면 기본 비율)
  add column if not exists share       numeric(7,4),    -- 여러 명이 나눴을 때의 몫 (1 = 혼자)
  add column if not exists src         text default ''; -- 'paste' = 사진 붙여넣기로 들어온 건

create index if not exists staff_commissions_date_idx
  on public.staff_commissions(date);

-- ══ 확인 ══
select column_name as "컬럼", data_type as "타입"
from information_schema.columns
where table_schema='public' and table_name='staff_commissions'
order by ordinal_position;
