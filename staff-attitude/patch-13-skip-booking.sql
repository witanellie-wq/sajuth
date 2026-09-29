-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 — 건별 제외 (중복 입력 등)
--  Supabase → SQL Editor → + New query → 붙여넣고 Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    같은 시술이 예약장부에 두 번 들어가는 일이 있습니다 (전화번호 오타 등).
--    그대로 두면 커미션이 두 배로 나갑니다.
--    금액을 0 으로 고치면 '0 원 받았다' 는 뜻이 되어 기록이 틀어지므로,
--    '이 건은 커미션에서 뺀다' 는 표시를 따로 둡니다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_comm_override
  add column if not exists skip     boolean not null default false,  -- true = 커미션 제외
  add column if not exists skip_why text default '';                 -- 중복 / 취소 등

select '완료 — 건별 제외' as "결과";
