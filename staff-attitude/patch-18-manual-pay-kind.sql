-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 내역 — 직접 넣은 건도 고와비 · 현장 고르기
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    예약장부에 없어서 직접 넣는 건 중에도 고와비 건이 있습니다.
--    고와비는 수수료 20% 를 떼고 들어오므로 그 금액에 커미션을 매겨야 합니다.
--    비워 두면 현장 결제로 봅니다 (지금까지와 같습니다).
--      'gw' = 고와비 (수수료 뺌)   ·   비움 = 현장
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_commissions
  add column if not exists pay_kind text;

-- ══ 확인 ══
select coalesce(pay_kind,'(현장)') as "결제 경로", count(*) as "건수"
from public.staff_commissions group by 1 order by 2 desc;
