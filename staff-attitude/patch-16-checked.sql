-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 — 건별 '금액 확인함' 표시
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    하루 정산 때 포스 · 종이 기록과 한 건씩 대조합니다.
--    어디까지 맞춰 봤는지 표시가 없으면 중간에 끊겼을 때 처음부터 다시 봐야 합니다.
--    확인한 건에 표시를 남겨 두면 남은 건만 보면 됩니다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_comm_override
  add column if not exists checked    boolean not null default false,  -- 금액 대조 끝
  add column if not exists checked_at timestamptz;                     -- 언제 확인했는지

-- ══ 확인 ══
select count(*) filter (where checked)     as "확인한 건",
       count(*) filter (where not checked) as "아직",
       count(*)                            as "전체"
from public.staff_comm_override;
