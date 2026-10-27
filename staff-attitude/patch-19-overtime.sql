-- ═══════════════════════════════════════════════════════════════════════════
--  초과근무(분) — 텔레그램 퇴근 버튼이 자동으로 채웁니다 (정규 19:30, Manju 18:00 기준)
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다. (2026-10-27 적용 완료)
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.staff_records add column if not exists overtime_min integer not null default 0;
update public.staff_records
   set overtime_min = (substring(memo from 'OT ([0-9]+)분'))::int
 where memo ~ 'OT [0-9]+분' and overtime_min = 0;
