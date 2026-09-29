-- ▼▼▼ 5/6 · 커미션 판매금액 — 여기부터 전부 복사 ▼▼▼

alter table public.staff_commissions
  add column if not exists sale_amount numeric(12,2),
  add column if not exists rate        numeric(6,3),
  add column if not exists share       numeric(7,4),
  add column if not exists src         text default '';
create index if not exists staff_commissions_date_idx
  on public.staff_commissions(date);

select '5/6 커미션 판매금액 — 완료' as "결과";
-- ▲▲▲ 5/6 끝 · 이 줄까지 보여야 합니다 ▲▲▲
