alter table public.staff_commissions
  add column if not exists sale_amount numeric(12,2),
  add column if not exists rate        numeric(6,3),
  add column if not exists share       numeric(7,4),
  add column if not exists src         text default '';
create index if not exists staff_commissions_date_idx
  on public.staff_commissions(date);
select '5/6 완료 · 커미션 판매금액' as "결과";
