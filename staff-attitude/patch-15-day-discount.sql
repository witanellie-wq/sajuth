-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 — 날짜별 매출보정 (하루 할인)
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    하루 장사를 마감하고 보면 실제로 들어온 돈이 예약장부 합계보다
--    조금 적은 날이 있습니다 (현장 할인 · 끝자리 깎기 등).
--    건마다 얼마씩 깎였는지는 알 수 없으니, 그날 깎인 총액을 적어 두고
--    각 건의 금액에 비례해서 나눠 뺍니다. 커미션 기준이 실제 입금과 맞습니다.
--
--    이미 있는 '제외한 날' 표에 칸만 더합니다.
--    지금까지 들어간 줄은 모두 '커미션 안 주는 날' 이므로 skip 기본값이 true 입니다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_comm_skip
  add column if not exists skip     boolean not null default true,   -- false = 보정만 있는 날
  add column if not exists discount numeric(12,2) not null default 0; -- 그날 깎인 총액

-- ══ 확인 ══
select coalesce(day::text,'-') as "날짜",
       case when skip then '커미션 없음' else '커미션 줌' end as "지급",
       discount as "매출보정"
from public.staff_comm_skip order by day;
