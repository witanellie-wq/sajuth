alter table public.staff_expenses
  add column if not exists paid_by       text not null default '회사',
  add column if not exists reimbursed_at date;
create index if not exists staff_expenses_payer_idx
  on public.staff_expenses(paid_by, reimbursed_at);
alter table public.staff_fixed_payments
  add column if not exists paid_by       text not null default '회사',
  add column if not exists reimbursed_at date;
select '2/6 완료 · 사비 결제 정산' as "결과";
